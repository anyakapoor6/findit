const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixFunctions() {
	console.log('🔍 Checking for database functions with old column references...\n');

	try {
		// First, let's check what functions exist
		const { data: functions, error } = await supabase
			.rpc('exec_sql', {
				sql: `
          SELECT 
            p.proname as function_name,
            n.nspname as schema_name
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
          AND p.proname LIKE '%match%'
          ORDER BY p.proname;
        `
			});

		if (error) {
			console.log('⚠️  Could not check functions via RPC, trying direct approach...');

			// Try a different approach - check if the trigger exists
			const { data: triggers, error: triggerError } = await supabase
				.rpc('exec_sql', {
					sql: `
            SELECT 
              trigger_name,
              event_manipulation,
              action_statement
            FROM information_schema.triggers 
            WHERE trigger_schema = 'public'
            AND trigger_name LIKE '%match%';
          `
				});

			if (triggerError) {
				console.log('❌ Could not check triggers either');
				console.log('Error:', triggerError);
				return;
			}

			console.log('📋 Found triggers:');
			console.log(triggers);
		} else {
			console.log('📋 Found functions:');
			console.log(functions);
		}

		// Let's try to drop and recreate the problematic function
		console.log('\n🔧 Attempting to fix the function...');

		// Drop the existing function
		const { error: dropError } = await supabase
			.rpc('exec_sql', {
				sql: 'DROP FUNCTION IF EXISTS find_matches_for_listing(UUID);'
			});

		if (dropError) {
			console.log('⚠️  Could not drop function:', dropError.message);
		} else {
			console.log('✅ Dropped existing function');
		}

		// Now let's try to create a simple version of the function
		const { error: createError } = await supabase
			.rpc('exec_sql', {
				sql: `
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
        `
			});

		if (createError) {
			console.log('❌ Could not create function:', createError.message);
		} else {
			console.log('✅ Created simplified function');
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

checkAndFixFunctions(); 