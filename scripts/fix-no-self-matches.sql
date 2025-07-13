-- Patch: Prevent self-matching in AI matches
-- This update ensures a user's own listings cannot be matched together

CREATE OR REPLACE FUNCTION find_matches_for_listing(new_listing_id UUID)
RETURNS VOID AS $$
DECLARE
  new_listing RECORD;
  opposite_listing RECORD;
  match_score DECIMAL(3,2);
BEGIN
  -- Get the new listing details
  SELECT * INTO new_listing FROM listings WHERE id = new_listing_id;
  
  -- Find opposite type listings (lost vs found), EXCLUDE same user
  FOR opposite_listing IN 
    SELECT * FROM listings 
    WHERE id != new_listing_id 
      AND status != new_listing.status
      AND user_id != new_listing.user_id
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