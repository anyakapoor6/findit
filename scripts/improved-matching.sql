-- Improved matching algorithm that prioritizes same-category matches
-- and avoids inefficient cross-category matching

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS find_matches_for_listing(UUID);
DROP FUNCTION IF EXISTS calculate_match_score(UUID, UUID);

-- Improved function to calculate match score with better category filtering
CREATE OR REPLACE FUNCTION calculate_match_score(
  listing1_id UUID,
  listing2_id UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
  score DECIMAL(3,2) := 0;
  l1 RECORD;
  l2 RECORD;
  category_score DECIMAL(3,2) := 0;
  subcategory_score DECIMAL(3,2) := 0;
  keyword_score DECIMAL(3,2) := 0;
  location_score DECIMAL(3,2) := 0;
  date_score DECIMAL(3,2) := 0;
  image_similarity_score DECIMAL(3,2) := 0;
  extra_score DECIMAL(3,2) := 0;
  reasons TEXT[] := '{}';
  k TEXT;
  v1 TEXT;
  v2 TEXT;
  match_count INT := 0;
  total_fields INT := 0;
BEGIN
  -- Get listing details
  SELECT * INTO l1 FROM listings WHERE id = listing1_id;
  SELECT * INTO l2 FROM listings WHERE id = listing2_id;

  -- Category match (0.4 weight - increased importance)
  IF l1.item_type = l2.item_type THEN
    category_score := 0.4;
    reasons := array_append(reasons, 'Same category: ' || l1.item_type);
  ELSE
    -- If categories don't match, only proceed if there's very high image similarity
    IF l1.image_embedding IS NOT NULL AND l2.image_embedding IS NOT NULL THEN
      image_similarity_score := 1 - (l1.image_embedding <=> l2.image_embedding);
      IF image_similarity_score < 0.8 THEN
        -- Return very low score for different categories without high visual similarity
        RETURN 0.05;
      END IF;
    ELSE
      -- No image embeddings and different categories - very low score
      RETURN 0.05;
    END IF;
  END IF;

  -- Subcategory match (0.25 weight)
  IF l1.item_subtype = l2.item_subtype AND l1.item_subtype IS NOT NULL THEN
    subcategory_score := 0.25;
    reasons := array_append(reasons, 'Same subcategory: ' || l1.item_subtype);
  END IF;

  -- Keyword matching (0.2 weight)
  IF l1.title IS NOT NULL AND l2.title IS NOT NULL THEN
    SELECT COUNT(*) INTO keyword_score
    FROM (
      SELECT unnest(string_to_array(lower(l1.title), ' ')) AS word1
      INTERSECT
      SELECT unnest(string_to_array(lower(l2.title), ' '))
    ) common_words;
    IF keyword_score > 0 THEN
      keyword_score := LEAST(keyword_score * 0.05, 0.2);
      reasons := array_append(reasons, 'Keyword match: ' || keyword_score::text || ' common words');
    END IF;
  END IF;

  -- Location matching (0.1 weight)
  IF l1.location = l2.location AND l1.location IS NOT NULL THEN
    location_score := 0.1;
    reasons := array_append(reasons, 'Same location: ' || l1.location);
  END IF;

  -- Date proximity (0.05 weight - reduced importance)
  IF l1.created_at IS NOT NULL AND l2.created_at IS NOT NULL THEN
    IF ABS(EXTRACT(EPOCH FROM (l1.created_at - l2.created_at))) <= 604800 THEN
      date_score := 0.05;
      reasons := array_append(reasons, 'Date proximity: within 7 days');
    ELSIF ABS(EXTRACT(EPOCH FROM (l1.created_at - l2.created_at))) <= 2592000 THEN
      date_score := 0.025;
      reasons := array_append(reasons, 'Date proximity: within 30 days');
    END IF;
  END IF;

  -- Check image similarity if both listings have embeddings
  IF l1.image_embedding IS NOT NULL AND l2.image_embedding IS NOT NULL THEN
    image_similarity_score := 1 - (l1.image_embedding <=> l2.image_embedding);
    IF image_similarity_score > 0.8 THEN
      score := score + 0.3; -- High weight for very similar images
      reasons := array_append(reasons, 'High visual similarity: ' || round(image_similarity_score * 100)::text || '%');
    ELSIF image_similarity_score > 0.6 THEN
      score := score + 0.2; -- Medium weight for similar images
      reasons := array_append(reasons, 'Visual similarity: ' || round(image_similarity_score * 100)::text || '%');
    ELSIF image_similarity_score > 0.4 THEN
      score := score + 0.1; -- Low weight for moderate similarity
      reasons := array_append(reasons, 'Moderate visual similarity: ' || round(image_similarity_score * 100)::text || '%');
    END IF;
  END IF;

  -- Extra details smart matching (up to 0.1 weight - reduced)
  IF l1.extra_details IS NOT NULL AND l2.extra_details IS NOT NULL THEN
    FOR k IN SELECT key FROM jsonb_each_text(l1.extra_details) LOOP
      v1 := l1.extra_details ->> k;
      v2 := l2.extra_details ->> k;
      IF v1 IS NOT NULL AND v2 IS NOT NULL THEN
        total_fields := total_fields + 1;
        IF lower(v1) = lower(v2) THEN
          match_count := match_count + 1;
        END IF;
      END IF;
    END LOOP;
    IF total_fields > 0 AND match_count > 0 THEN
      extra_score := LEAST(match_count * 0.025, 0.1);
      score := score + extra_score;
      reasons := array_append(reasons, 'Extra details match: ' || match_count::text || ' fields');
    END IF;
  END IF;

  -- Calculate total score
  score := score + category_score + subcategory_score + keyword_score + location_score + date_score;

  -- Store match with reasons
  INSERT INTO matches (listing_id, matched_listing_id, score, match_reasons)
  VALUES (listing1_id, listing2_id, score, reasons)
  ON CONFLICT (listing_id, matched_listing_id) 
  DO UPDATE SET 
    score = EXCLUDED.score,
    match_reasons = EXCLUDED.match_reasons,
    updated_at = NOW();

  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Improved function to find matches with category filtering
CREATE OR REPLACE FUNCTION find_matches_for_listing(new_listing_id UUID)
RETURNS VOID AS $$
DECLARE
  new_listing RECORD;
  opposite_listing RECORD;
  match_score DECIMAL(3,2);
BEGIN
  -- Get the new listing details
  SELECT * INTO new_listing FROM listings WHERE id = new_listing_id;
  
  -- Find opposite type listings (lost vs found) with category filtering
  -- Priority 1: Same category matches
  FOR opposite_listing IN 
    SELECT * FROM listings 
    WHERE id != new_listing_id 
    AND status != new_listing.status
    AND item_type = new_listing.item_type  -- Same category
    AND created_at >= NOW() - INTERVAL '90 days' -- Only match recent listings
    ORDER BY created_at DESC
    LIMIT 20  -- Limit to prevent too many API calls
  LOOP
    -- Calculate match score
    SELECT calculate_match_score(new_listing_id, opposite_listing.id) INTO match_score;
    
    -- Only store matches with score > 0.3 (higher threshold for efficiency)
    IF match_score > 0.3 THEN
      -- Match is already stored by calculate_match_score function
      CONTINUE;
    END IF;
  END LOOP;

  -- Priority 2: Cross-category matches only if very high image similarity
  IF new_listing.image_embedding IS NOT NULL THEN
    FOR opposite_listing IN 
      SELECT * FROM listings 
      WHERE id != new_listing_id 
      AND status != new_listing.status
      AND item_type != new_listing.item_type  -- Different category
      AND image_embedding IS NOT NULL  -- Must have image embedding
      AND created_at >= NOW() - INTERVAL '30 days' -- Shorter time window for cross-category
      ORDER BY created_at DESC
      LIMIT 10  -- Very limited cross-category matches
    LOOP
      -- Only calculate if there's potential for high visual similarity
      SELECT calculate_match_score(new_listing_id, opposite_listing.id) INTO match_score;
      
      -- Only store matches with very high score for cross-category
      IF match_score > 0.6 THEN
        -- Match is already stored by calculate_match_score function
        CONTINUE;
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger
DROP TRIGGER IF EXISTS find_matches_trigger ON listings;
CREATE TRIGGER find_matches_trigger
  AFTER INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_find_matches(); 