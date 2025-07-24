-- Create claims table if it doesn't exist
CREATE TABLE IF NOT EXISTS claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  claimant_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  location TEXT,
  contents TEXT,
  proof_image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id, claimant_user_id)
);

-- Enable RLS
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_claims_listing_id ON claims(listing_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant_user_id ON claims(claimant_user_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at DESC);

-- RLS Policies

-- Policy 1: Users can insert their own claims
CREATE POLICY "Users can insert their own claims" ON claims
  FOR INSERT WITH CHECK (auth.uid() = claimant_user_id);

-- Policy 2: Users can view claims they submitted
CREATE POLICY "Users can view their own claims" ON claims
  FOR SELECT USING (auth.uid() = claimant_user_id);

-- Policy 3: Users can update their own pending claims
CREATE POLICY "Users can update their own pending claims" ON claims
  FOR UPDATE USING (auth.uid() = claimant_user_id AND status = 'pending');

-- Policy 4: Listing owners can view claims on their listings
CREATE POLICY "Listing owners can view claims on their listings" ON claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = claims.listing_id 
      AND listings.user_id = auth.uid()
    )
  );

-- Policy 5: Listing owners can update claim status
CREATE POLICY "Listing owners can update claim status" ON claims
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = claims.listing_id 
      AND listings.user_id = auth.uid()
    )
  );

-- Verify the table and policies were created
SELECT 'Claims table created successfully' as status; 