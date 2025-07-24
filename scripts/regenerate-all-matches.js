const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function regenerateAllMatches() {
	console.log('🔄 Regenerating matches for all existing listings...\n');

	try {
		// First, clear all existing matches
		console.log('🗑️  Clearing existing matches...');
		const { error: deleteError } = await supabase
			.from('matches')
			.delete()
			.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all matches

		if (deleteError) {
			console.error('❌ Error clearing matches:', deleteError);
			return;
		}
		console.log('✅ Cleared existing matches\n');

		// Get all listings
		console.log('📋 Fetching all listings...');
		const { data: listings, error: fetchError } = await supabase
			.from('listings')
			.select('id, title, status, item_type, item_subtype, location, created_at')
			.order('created_at', { ascending: false });

		if (fetchError) {
			console.error('❌ Error fetching listings:', fetchError);
			return;
		}

		console.log(`✅ Found ${listings.length} listings\n`);

		// Regenerate matches for each listing
		console.log('🔍 Regenerating matches...');
		let processedCount = 0;
		let totalMatches = 0;

		for (const listing of listings) {
			try {
				// Call the enhanced matching function for each listing
				const { error: matchError } = await supabase
					.rpc('find_matches_for_listing', { new_listing_id: listing.id });

				if (matchError) {
					console.log(`⚠️  Error matching listing "${listing.title}":`, matchError.message);
				} else {
					processedCount++;
					console.log(`✅ Processed: ${listing.title} (${listing.status})`);
				}
			} catch (error) {
				console.log(`⚠️  Error processing listing "${listing.title}":`, error.message);
			}
		}

		// Check how many matches were created
		const { data: newMatches, error: countError } = await supabase
			.from('matches')
			.select('id');

		if (countError) {
			console.error('❌ Error counting new matches:', countError);
		} else {
			totalMatches = newMatches.length;
		}

		console.log('\n🎉 Match regeneration complete!');
		console.log(`📊 Processed ${processedCount} listings`);
		console.log(`🔗 Created ${totalMatches} new matches`);

		// Show some example matches
		if (totalMatches > 0) {
			console.log('\n📋 Example matches:');
			const { data: sampleMatches, error: sampleError } = await supabase
				.from('matches')
				.select(`
          id,
          score,
          match_reasons,
          listing:listings!matches_listing_id_fkey(title, status, item_type),
          matched_listing:listings!matches_matched_listing_id_fkey(title, status, item_type)
        `)
				.limit(5);

			if (!sampleError && sampleMatches) {
				sampleMatches.forEach(match => {
					console.log(`• ${match.listing.title} (${match.listing.status}) ↔ ${match.matched_listing.title} (${match.matched_listing.status})`);
					console.log(`  Score: ${match.score}, Reasons: ${match.match_reasons.join(', ')}`);
				});
			}
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

regenerateAllMatches(); 