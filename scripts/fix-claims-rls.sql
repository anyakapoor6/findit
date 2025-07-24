-- Fix RLS policies for claims table
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can insert their own claims" ON claims;
DROP POLICY IF EXISTS "Users can view their own claims" ON claims;
DROP POLICY IF EXISTS "Users can update their own pending claims" ON claims;
DROP POLICY IF EXISTS "Listing owners can view claims on their listings" ON claims;
DROP POLICY IF EXISTS "Listing owners can update claim status" ON claims;
DROP POLICY IF EXISTS "Allow all operations" ON claims;

-- Create proper RLS policies

-- Policy 1: Users can insert their own claims
CREATE POLICY "Users can insert their own claims" ON claims
  FOR INSERT WITH CHECK (auth.uid() = claimant_id);

-- Policy 2: Users can view claims they submitted (as claimant)
CREATE POLICY "Users can view claims they submitted" ON claims
  FOR SELECT USING (auth.uid() = claimant_id);

-- Policy 3: Users can update their own pending claims
CREATE POLICY "Users can update their own pending claims" ON claims
  FOR UPDATE USING (auth.uid() = claimant_id AND status = 'pending');

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

SELECT 'Claims RLS policies updated successfully' as status; 