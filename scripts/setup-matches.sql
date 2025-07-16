-- Create matches table for AI-suggested matches
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  matched_listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
  match_reasons TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, matched_listing_id)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_matches_listing_id ON matches(listing_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);

-- Function to calculate match score between two listings
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

  -- Category match (0.3 weight)
  IF l1.item_type = l2.item_type THEN
    category_score := 0.3;
    reasons := array_append(reasons, 'Same category: ' || l1.item_type);
  END IF;

  -- Subcategory match (0.2 weight)
  IF l1.item_subtype = l2.item_subtype AND l1.item_subtype IS NOT NULL THEN
    subcategory_score := 0.2;
    reasons := array_append(reasons, 'Same subcategory: ' || l1.item_subtype);
  END IF;

  -- Keyword matching (0.25 weight)
  IF l1.title IS NOT NULL AND l2.title IS NOT NULL THEN
    SELECT COUNT(*) INTO keyword_score
    FROM (
      SELECT unnest(string_to_array(lower(l1.title), ' ')) AS word1
      INTERSECT
      SELECT unnest(string_to_array(lower(l2.title), ' '))
    ) common_words;
    IF keyword_score > 0 THEN
      keyword_score := LEAST(keyword_score * 0.05, 0.25);
      reasons := array_append(reasons, 'Keyword match: ' || keyword_score::text || ' common words');
    END IF;
  END IF;

  -- Location matching (0.15 weight)
  IF l1.location = l2.location AND l1.location IS NOT NULL THEN
    location_score := 0.15;
    reasons := array_append(reasons, 'Same location: ' || l1.location);
  END IF;

  -- Date proximity (0.1 weight)
  IF l1.created_at IS NOT NULL AND l2.created_at IS NOT NULL THEN
    IF ABS(EXTRACT(EPOCH FROM (l1.created_at - l2.created_at))) <= 604800 THEN
      date_score := 0.1;
      reasons := array_append(reasons, 'Date proximity: within 7 days');
    ELSIF ABS(EXTRACT(EPOCH FROM (l1.created_at - l2.created_at))) <= 2592000 THEN
      date_score := 0.05;
      reasons := array_append(reasons, 'Date proximity: within 30 days');
    END IF;
  END IF;

  -- Check image similarity if both listings have embeddings
  IF l1.image_embedding IS NOT NULL AND l2.image_embedding IS NOT NULL THEN
    image_similarity_score := 1 - (l1.image_embedding <=> l2.image_embedding);
    IF image_similarity_score > 0.7 THEN
      score := score + 0.3; -- Increased weight for visual similarity
      reasons := array_append(reasons, 'Visual similarity: ' || round(image_similarity_score * 100)::text || '%');
    ELSIF image_similarity_score > 0.5 THEN
      score := score + 0.15;
      reasons := array_append(reasons, 'Moderate visual similarity: ' || round(image_similarity_score * 100)::text || '%');
    END IF;
  END IF;

  -- Extra details smart matching (up to 0.15 weight)
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
      extra_score := LEAST(match_count * 0.05, 0.15);
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

-- Function to find and store matches for a new listing
CREATE OR REPLACE FUNCTION find_matches_for_listing(new_listing_id UUID)
RETURNS VOID AS $$
DECLARE
  new_listing RECORD;
  opposite_listing RECORD;
  match_score DECIMAL(3,2);
BEGIN
  -- Get the new listing details
  SELECT * INTO new_listing FROM listings WHERE id = new_listing_id;
  
  -- Find opposite type listings (lost vs found)
  FOR opposite_listing IN 
    SELECT * FROM listings 
    WHERE id != new_listing_id 
    AND status != new_listing.status
    AND created_at >= NOW() - INTERVAL '90 days' -- Only match recent listings
  LOOP
    -- Calculate match score
    SELECT calculate_match_score(new_listing_id, opposite_listing.id) INTO match_score;
    
    -- Only store matches with score > 0.2
    IF match_score > 0.2 THEN
      -- Match is already stored by calculate_match_score function
      CONTINUE;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically find matches when a new listing is created
CREATE OR REPLACE FUNCTION trigger_find_matches()
RETURNS TRIGGER AS $$
BEGIN
  -- Find matches for the new listing
  PERFORM find_matches_for_listing(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS find_matches_trigger ON listings;
CREATE TRIGGER find_matches_trigger
  AFTER INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_find_matches();

-- Function to get matches for a user's listings
CREATE OR REPLACE FUNCTION get_user_matches(user_id UUID)
RETURNS TABLE (
  match_id UUID,
  listing_id UUID,
  listing_title TEXT,
  listing_status TEXT,
  listing_category TEXT,
  listing_subcategory TEXT,
  listing_location TEXT,
  listing_created_at TIMESTAMP WITH TIME ZONE,
  listing_image_url TEXT,
  listing_description TEXT,
  listing_extra_details JSONB,
  matched_listing_id UUID,
  matched_listing_title TEXT,
  matched_listing_status TEXT,
  matched_listing_category TEXT,
  matched_listing_subcategory TEXT,
  matched_listing_location TEXT,
  matched_listing_created_at TIMESTAMP WITH TIME ZONE,
  matched_listing_image_url TEXT,
  matched_listing_description TEXT,
  matched_listing_extra_details JSONB,
  score DECIMAL(3,2),
  match_reasons TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as match_id,
    l1.id as listing_id,
    l1.title as listing_title,
    l1.status as listing_status,
    l1.item_type as listing_category,
    l1.item_subtype as listing_subcategory,
    l1.location as listing_location,
    l1.created_at as listing_created_at,
    l1.image_url as listing_image_url,
    l1.description as listing_description,
    l1.extra_details as listing_extra_details,
    l2.id as matched_listing_id,
    l2.title as matched_listing_title,
    l2.status as matched_listing_status,
    l2.item_type as matched_listing_category,
    l2.item_subtype as matched_listing_subcategory,
    l2.location as matched_listing_location,
    l2.created_at as matched_listing_created_at,
    l2.image_url as matched_listing_image_url,
    l2.description as matched_listing_description,
    l2.extra_details as matched_listing_extra_details,
    m.score,
    m.match_reasons
  FROM matches m
  JOIN listings l1 ON m.listing_id = l1.id
  JOIN listings l2 ON m.matched_listing_id = l2.id
  WHERE l1.user_id = get_user_matches.user_id
  ORDER BY m.score DESC, m.created_at DESC;
END;
$$ LANGUAGE plpgsql; 