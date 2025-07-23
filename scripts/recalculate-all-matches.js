const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error('Missing required environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recalculateAllMatches() {
	console.log('🔄 Recalculating all matches with updated image embeddings...\n');

	try {
		// First, delete all existing matches
		console.log('🗑️  Deleting existing matches...');
		const { error: deleteError } = await supabase
			.from('matches')
			.delete()
			.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all matches

		if (deleteError) {
			throw deleteError;
		}

		console.log('✅ Deleted existing matches');

		// Get all listings
		const { data: listings, error: listingsError } = await supabase
			.from('listings')
			.select('id, title, status, item_type')
			.order('created_at', { ascending: false });

		if (listingsError) {
			throw listingsError;
		}

		console.log(`Found ${listings.length} listings to process\n`);

		// Recalculate matches for each listing
		let processed = 0;
		let failed = 0;

		for (const listing of listings) {
			try {
				console.log(`Processing "${listing.title}" (${listing.id})...`);

				// Trigger match finding for this listing
				const { error: matchError } = await supabase
					.rpc('find_matches_for_listing', { new_listing_id: listing.id });

				if (matchError) {
					console.error(`Failed to find matches for ${listing.id}:`, matchError);
					failed++;
				} else {
					console.log(`✓ Processed ${listing.title}`);
					processed++;
				}

				// Add a small delay to avoid overwhelming the database
				await new Promise(resolve => setTimeout(resolve, 100));
			} catch (error) {
				console.error(`Error processing ${listing.id}:`, error);
				failed++;
			}
		}

		console.log(`\n✅ Recalculation complete!`);
		console.log(`Processed: ${processed} listings`);
		console.log(`Failed: ${failed} listings`);

		// Check the new matches
		const { count: newMatchCount } = await supabase
			.from('matches')
			.select('*', { count: 'exact', head: true });

		console.log(`\n📊 New match count: ${newMatchCount || 0} matches`);

	} catch (error) {
		console.error('Error recalculating matches:', error);
	}
}

recalculateAllMatches()
	.then(() => {
		console.log('\n✅ Script completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 