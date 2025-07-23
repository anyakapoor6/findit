-- Test script to check existing matches and their scores
SELECT 
  m.id,
  m.score,
  m.match_reasons,
  l1.title as listing1_title,
  l2.title as listing2_title,
  l1.item_type as listing1_type,
  l2.item_type as listing2_type,
  l1.status as listing1_status,
  l2.status as listing2_status,
  CASE 
    WHEN l1.image_embedding IS NOT NULL AND l2.image_embedding IS NOT NULL 
    THEN 'Both have embeddings'
    WHEN l1.image_embedding IS NOT NULL OR l2.image_embedding IS NOT NULL 
    THEN 'One has embedding'
    ELSE 'No embeddings'
  END as embedding_status
FROM matches m 
JOIN listings l1 ON m.listing_id = l1.id 
JOIN listings l2 ON m.matched_listing_id = l2.id 
ORDER BY m.score DESC 
LIMIT 10; 