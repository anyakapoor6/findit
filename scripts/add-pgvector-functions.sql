-- Add function to calculate image similarity using pgvector
CREATE OR REPLACE FUNCTION calculate_image_similarity(
  embedding1 vector(512),
  embedding2 vector(512)
) RETURNS DECIMAL AS $$
BEGIN
  -- Return cosine distance (1 - cosine similarity)
  RETURN 1 - (embedding1 <=> embedding2);
END;
$$ LANGUAGE plpgsql;

-- Add function to test similarity between two listings
CREATE OR REPLACE FUNCTION test_listing_similarity(
  listing1_id UUID,
  listing2_id UUID
) RETURNS TABLE (
  listing1_title TEXT,
  listing2_title TEXT,
  category_similarity DECIMAL,
  image_similarity DECIMAL,
  total_similarity DECIMAL
) AS $$
DECLARE
  l1 RECORD;
  l2 RECORD;
BEGIN
  -- Get listing details
  SELECT * INTO l1 FROM listings WHERE id = listing1_id;
  SELECT * INTO l2 FROM listings WHERE id = listing2_id;

  RETURN QUERY
  SELECT 
    l1.title as listing1_title,
    l2.title as listing2_title,
    CASE 
      WHEN l1.item_type = l2.item_type THEN 1.0
      ELSE 0.0
    END as category_similarity,
    CASE 
      WHEN l1.image_embedding IS NOT NULL AND l2.image_embedding IS NOT NULL 
      THEN 1 - (l1.image_embedding <=> l2.image_embedding)
      ELSE 0.0
    END as image_similarity,
    CASE 
      WHEN l1.image_embedding IS NOT NULL AND l2.image_embedding IS NOT NULL 
      THEN (CASE WHEN l1.item_type = l2.item_type THEN 0.3 ELSE 0.0 END) + 
           (CASE WHEN 1 - (l1.image_embedding <=> l2.image_embedding) > 0.7 THEN 0.3 
                 WHEN 1 - (l1.image_embedding <=> l2.image_embedding) > 0.5 THEN 0.15
                 ELSE 0.0 END)
      ELSE (CASE WHEN l1.item_type = l2.item_type THEN 0.3 ELSE 0.0 END)
    END as total_similarity;
END;
$$ LANGUAGE plpgsql; 