const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableTrigger() {
	console.log('🔍 Attempting to disable the problematic trigger...\n');

	try {
		// Try to disable the trigger using the Supabase client
		const { data, error } = await supabase
			.from('listings')
			.select('*')
			.limit(1);

		if (error) {
			console.log('❌ Error accessing listings table:', error.message);
			return;
		}

		console.log('✅ Can access listings table');

		// Since we can't run SQL directly, let's try a different approach
		// Let's check if we can modify the trigger by creating a new one that does nothing
		console.log('\n💡 Since we can\'t run SQL directly, here\'s what you need to do:');
		console.log('\n1. Go to your Supabase dashboard');
		console.log('2. Navigate to the SQL Editor');
		console.log('3. Run this command to disable the trigger:');
		console.log('\n   ALTER TABLE listings DISABLE TRIGGER find_matches_trigger;');
		console.log('\n4. Then run this to drop the problematic function:');
		console.log('\n   DROP FUNCTION IF EXISTS find_matches_for_listing(UUID);');
		console.log('\n5. Finally, run this to create a working version:');
		console.log(`
   CREATE OR REPLACE FUNCTION find_matches_for_listing(new_listing_id UUID)
   RETURNS VOID AS $$
   DECLARE
     new_listing RECORD;
     opposite_listing RECORD;
     match_score DECIMAL(3,2);
   BEGIN
     -- Get the new listing details
     SELECT * INTO new_listing FROM listings WHERE id = new_listing_id;
     
     -- Find opposite status listings
     FOR opposite_listing IN 
       SELECT * FROM listings 
       WHERE status != new_listing.status 
       AND id != new_listing_id
     LOOP
       -- Calculate a simple match score (without image embedding for now)
       match_score := 0.0;
       
       -- Category match
       IF new_listing.item_type = opposite_listing.item_type THEN
         match_score := match_score + 0.3;
       END IF;
       
       -- Location match
       IF new_listing.location = opposite_listing.location THEN
         match_score := match_score + 0.2;
       END IF;
       
       -- Only create match if score is reasonable
       IF match_score > 0.2 THEN
         INSERT INTO matches (listing_id, matched_listing_id, score, match_reasons)
         VALUES (new_listing_id, opposite_listing.id, match_score, ARRAY['Basic matching'])
         ON CONFLICT (listing_id, matched_listing_id) DO NOTHING;
       END IF;
     END LOOP;
   END;
   $$ LANGUAGE plpgsql;
   `);
		console.log('\n6. Re-enable the trigger:');
		console.log('\n   ALTER TABLE listings ENABLE TRIGGER find_matches_trigger;');

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

disableTrigger(); 