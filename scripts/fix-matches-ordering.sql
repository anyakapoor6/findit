-- Fix the get_user_matches function to order by listing creation date (most recent first)
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
  ORDER BY l1.created_at DESC, m.score DESC;
END;
$$ LANGUAGE plpgsql; 