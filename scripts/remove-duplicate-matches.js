const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDuplicateMatches() {
	console.log('🧹 Removing duplicate matches...\n');

	try {
		// First, let's see how many matches we have
		const { data: allMatches, error: fetchError } = await supabase
			.from('matches')
			.select('id, listing_id, matched_listing_id, score, created_at');

		if (fetchError) {
			console.error('❌ Error fetching matches:', fetchError);
			return;
		}

		console.log(`📊 Found ${allMatches.length} total matches`);

		// Find duplicates (matches that exist in both directions)
		const duplicates = [];
		const seen = new Set();

		for (const match of allMatches) {
			const key1 = `${match.listing_id}-${match.matched_listing_id}`;
			const key2 = `${match.matched_listing_id}-${match.listing_id}`;

			if (seen.has(key2)) {
				// This is a duplicate - we've seen the reverse match
				duplicates.push(match.id);
			} else {
				seen.add(key1);
			}
		}

		console.log(`🔍 Found ${duplicates.length} duplicate matches`);

		if (duplicates.length > 0) {
			// Remove the duplicates
			const { error: deleteError } = await supabase
				.from('matches')
				.delete()
				.in('id', duplicates);

			if (deleteError) {
				console.error('❌ Error deleting duplicates:', deleteError);
				return;
			}

			console.log(`✅ Removed ${duplicates.length} duplicate matches`);
		} else {
			console.log('✅ No duplicates found');
		}

		// Show final count
		const { data: finalMatches, error: finalError } = await supabase
			.from('matches')
			.select('id');

		if (finalError) {
			console.error('❌ Error counting final matches:', finalError);
		} else {
			console.log(`📊 Final match count: ${finalMatches.length}`);
		}

		// Show some example matches
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

		if (!sampleError && sampleMatches && sampleMatches.length > 0) {
			console.log('\n📋 Sample matches after cleanup:');
			sampleMatches.forEach(match => {
				console.log(`• ${match.listing.title} (${match.listing.status}) ↔ ${match.matched_listing.title} (${match.matched_listing.status})`);
				console.log(`  Score: ${match.score}, Reasons: ${match.match_reasons.join(', ')}`);
			});
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

removeDuplicateMatches(); 