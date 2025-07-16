-- Add image_embedding column to listings table
-- This column will store vector embeddings for image similarity matching

-- Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add image_embedding column to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS image_embedding vector(512);

-- Create index for efficient similarity searches
CREATE INDEX IF NOT EXISTS idx_listings_image_embedding 
ON listings USING ivfflat (image_embedding vector_cosine_ops)
WITH (lists = 100);

-- Add a function to update image embeddings
CREATE OR REPLACE FUNCTION update_image_embedding(
  listing_id UUID,
  embedding vector(512)
) RETURNS void AS $$
BEGIN
  UPDATE listings 
  SET image_embedding = embedding,
      updated_at = NOW()
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql;

-- Add a function to find similar images
CREATE OR REPLACE FUNCTION find_similar_images(
  query_embedding vector(512),
  limit_count INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  title TEXT,
  image_url TEXT,
  similarity DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.image_url,
    1 - (l.image_embedding <=> query_embedding) as similarity
  FROM listings l
  WHERE l.image_embedding IS NOT NULL
  ORDER BY l.image_embedding <=> query_embedding
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql; 