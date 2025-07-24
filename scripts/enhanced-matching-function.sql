-- Enhanced matching function with all original features
-- This function includes image similarity, keyword matching, date proximity, and cross-category matching
-- Uses the correct 'image_embedding' column name to avoid errors

CREATE OR REPLACE FUNCTION find_matches_for_listing(new_listing_id UUID)
RETURNS VOID AS $$
DECLARE
  new_listing RECORD;
  opposite_listing RECORD;
  match_score DECIMAL(3,2);
  category_score DECIMAL(3,2);
  subcategory_score DECIMAL(3,2);
  keyword_score DECIMAL(3,2);
  location_score DECIMAL(3,2);
  date_score DECIMAL(3,2);
  image_similarity_score DECIMAL(3,2);
  extra_score DECIMAL(3,2);
  reasons TEXT[] := '{}';
  k TEXT;
  v1 TEXT;
  v2 TEXT;
  match_count INT := 0;
  total_fields INT := 0;
  same_category_matches INT := 0;
  cross_category_matches INT := 0;
  max_same_category_matches INT := 5;
  max_cross_category_matches INT := 3;
BEGIN
  -- Get the new listing details
  SELECT * INTO new_listing FROM listings WHERE id = new_listing_id;
  
  -- Find opposite status listings
  FOR opposite_listing IN 
    SELECT * FROM listings 
    WHERE status != new_listing.status 
    AND id != new_listing_id
    ORDER BY 
      -- Prioritize same category matches first
      CASE WHEN item_type = new_listing.item_type THEN 0 ELSE 1 END,
      -- Then by creation date (newer first)
      created_at DESC
  LOOP
    -- Reset scores for each potential match
    match_score := 0.0;
    category_score := 0.0;
    subcategory_score := 0.0;
    keyword_score := 0.0;
    location_score := 0.0;
    date_score := 0.0;
    image_similarity_score := 0.0;
    extra_score := 0.0;
    reasons := '{}';
    
    -- Category match (0.4 weight - highest priority)
    IF new_listing.item_type = opposite_listing.item_type THEN
      category_score := 0.4;
      reasons := array_append(reasons, 'Same category: ' || new_listing.item_type);
    END IF;
    
    -- Subcategory match (0.25 weight)
    IF new_listing.item_subtype = opposite_listing.item_subtype 
       AND new_listing.item_subtype IS NOT NULL 
       AND opposite_listing.item_subtype IS NOT NULL THEN
      subcategory_score := 0.25;
      reasons := array_append(reasons, 'Same subcategory: ' || new_listing.item_subtype);
    END IF;
    
    -- Keyword matching (0.05 per common word, max 0.25)
    IF new_listing.title IS NOT NULL AND opposite_listing.title IS NOT NULL THEN
      SELECT COUNT(*) INTO keyword_score
      FROM (
        SELECT unnest(string_to_array(lower(new_listing.title), ' ')) AS word1
        INTERSECT
        SELECT unnest(string_to_array(lower(opposite_listing.title), ' '))
      ) common_words;
      
      IF keyword_score > 0 THEN
        keyword_score := LEAST(keyword_score * 0.05, 0.25);
        reasons := array_append(reasons, 'Keyword match: ' || keyword_score::text || ' common words');
      END IF;
    END IF;
    
    -- Location matching (0.1 weight)
    IF new_listing.location = opposite_listing.location 
       AND new_listing.location IS NOT NULL 
       AND opposite_listing.location IS NOT NULL THEN
      location_score := 0.1;
      reasons := array_append(reasons, 'Same location: ' || new_listing.location);
    END IF;
    
    -- Date proximity (0.05 weight for within 7 days, 0.025 for within 30 days)
    IF new_listing.created_at IS NOT NULL AND opposite_listing.created_at IS NOT NULL THEN
      IF ABS(EXTRACT(EPOCH FROM (new_listing.created_at - opposite_listing.created_at))) <= 604800 THEN
        date_score := 0.05;
        reasons := array_append(reasons, 'Date proximity: within 7 days');
      ELSIF ABS(EXTRACT(EPOCH FROM (new_listing.created_at - opposite_listing.created_at))) <= 2592000 THEN
        date_score := 0.025;
        reasons := array_append(reasons, 'Date proximity: within 30 days');
      END IF;
    END IF;
    
    -- Image similarity (only if both listings have embeddings)
    IF new_listing.image_embedding IS NOT NULL 
       AND opposite_listing.image_embedding IS NOT NULL 
       AND new_listing.image_embedding IS NOT NULL 
       AND opposite_listing.image_embedding IS NOT NULL THEN
      
      -- Calculate cosine similarity using pgvector
      image_similarity_score := 1 - (new_listing.image_embedding <=> opposite_listing.image_embedding);
      
      -- Apply tiered bonuses based on similarity
      IF image_similarity_score > 0.95 THEN
        image_similarity_score := 0.3; -- Nearly identical
        reasons := array_append(reasons, 'Visual similarity: ' || round((1 - (new_listing.image_embedding <=> opposite_listing.image_embedding)) * 100)::text || '% (nearly identical)');
      ELSIF image_similarity_score > 0.90 THEN
        image_similarity_score := 0.2; -- Very similar
        reasons := array_append(reasons, 'Visual similarity: ' || round((1 - (new_listing.image_embedding <=> opposite_listing.image_embedding)) * 100)::text || '% (very similar)');
      ELSIF image_similarity_score > 0.80 THEN
        image_similarity_score := 0.1; -- Moderately similar
        reasons := array_append(reasons, 'Visual similarity: ' || round((1 - (new_listing.image_embedding <=> opposite_listing.image_embedding)) * 100)::text || '% (moderately similar)');
      ELSIF image_similarity_score > 0.70 THEN
        image_similarity_score := 0.05; -- Slightly similar
        reasons := array_append(reasons, 'Visual similarity: ' || round((1 - (new_listing.image_embedding <=> opposite_listing.image_embedding)) * 100)::text || '% (slightly similar)');
      ELSIF image_similarity_score > 0.60 THEN
        image_similarity_score := 0.02; -- Barely similar
        reasons := array_append(reasons, 'Visual similarity: ' || round((1 - (new_listing.image_embedding <=> opposite_listing.image_embedding)) * 100)::text || '% (barely similar)');
      ELSE
        image_similarity_score := 0.0; -- Not similar enough
      END IF;
    END IF;
    
    -- Extra details smart matching (up to 0.15 weight)
    IF new_listing.extra_details IS NOT NULL 
       AND opposite_listing.extra_details IS NOT NULL 
       AND new_listing.extra_details != '{}' 
       AND opposite_listing.extra_details != '{}' THEN
      
      match_count := 0;
      total_fields := 0;
      
      -- Compare each key in extra_details
      FOR k IN SELECT jsonb_object_keys(new_listing.extra_details)
      LOOP
        total_fields := total_fields + 1;
        v1 := new_listing.extra_details ->> k;
        v2 := opposite_listing.extra_details ->> k;
        
        IF v1 IS NOT NULL AND v2 IS NOT NULL THEN
          IF lower(v1) = lower(v2) THEN
            match_count := match_count + 1;
          END IF;
        END IF;
      END LOOP;
      
      IF total_fields > 0 AND match_count > 0 THEN
        extra_score := (match_count::DECIMAL / total_fields::DECIMAL) * 0.15;
        reasons := array_append(reasons, 'Extra details match: ' || match_count::text || '/' || total_fields::text || ' fields');
      END IF;
    END IF;
    
    -- Calculate total score
    match_score := category_score + subcategory_score + keyword_score + 
                   location_score + date_score + image_similarity_score + extra_score;
    
    -- Apply different thresholds based on category match
    IF new_listing.item_type = opposite_listing.item_type THEN
      -- Same category: lower threshold, higher priority
      IF match_score > 0.25 AND same_category_matches < max_same_category_matches THEN
        INSERT INTO matches (listing_id, matched_listing_id, score, match_reasons)
        VALUES (new_listing_id, opposite_listing.id, match_score, reasons)
        ON CONFLICT (listing_id, matched_listing_id) DO NOTHING;
        same_category_matches := same_category_matches + 1;
      END IF;
    ELSE
      -- Cross category: higher threshold, only if image similarity is high
      IF match_score > 0.6 
         AND image_similarity_score > 0.1 
         AND cross_category_matches < max_cross_category_matches THEN
        INSERT INTO matches (listing_id, matched_listing_id, score, match_reasons)
        VALUES (new_listing_id, opposite_listing.id, match_score, reasons)
        ON CONFLICT (listing_id, matched_listing_id) DO NOTHING;
        cross_category_matches := cross_category_matches + 1;
      END IF;
    END IF;
    
    -- Stop if we've reached our limits
    IF same_category_matches >= max_same_category_matches 
       AND cross_category_matches >= max_cross_category_matches THEN
      EXIT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql; 