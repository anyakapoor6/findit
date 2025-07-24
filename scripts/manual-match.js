const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function manualMatch() {
	console.log('🔍 Manually triggering matching for recent listings...\n');

	try {
		// Get the most recent listing
		const { data: recentListing, error: fetchError } = await supabase
			.from('listings')
			.select('id, title, status, item_type, item_subtype, location, created_at')
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (fetchError) {
			console.error('❌ Error fetching recent listing:', fetchError);
			return;
		}

		console.log(`🎯 Triggering matching for: "${recentListing.title}" (${recentListing.status})`);
		console.log(`   ID: ${recentListing.id}`);
		console.log(`   Category: ${recentListing.item_type} / ${recentListing.item_subtype || 'none'}`);
		console.log(`   Location: ${recentListing.location}\n`);

		// Manually call the matching function
		const { error: matchError } = await supabase
			.rpc('find_matches_for_listing', { new_listing_id: recentListing.id });

		if (matchError) {
			console.error('❌ Error calling matching function:', matchError);
			return;
		}

		console.log('✅ Matching function called successfully');

		// Check if any matches were created
		const { data: newMatches, error: checkError } = await supabase
			.from('matches')
			.select(`
        id,
        score,
        match_reasons,
        listing:listings!matches_listing_id_fkey(title, status),
        matched_listing:listings!matches_matched_listing_id_fkey(title, status)
      `)
			.or(`listing_id.eq.${recentListing.id},matched_listing_id.eq.${recentListing.id}`);

		if (checkError) {
			console.error('❌ Error checking matches:', checkError);
			return;
		}

		if (newMatches && newMatches.length > 0) {
			console.log(`\n🎉 Found ${newMatches.length} new matches:`);
			newMatches.forEach(match => {
				console.log(`• ${match.listing.title} ↔ ${match.matched_listing.title} (${Math.round(match.score * 100)}%)`);
				console.log(`  Reasons: ${match.match_reasons.join(', ')}`);
			});
		} else {
			console.log('\n❌ No matches were created');
			console.log('This could mean:');
			console.log('- No opposite status listings found');
			console.log('- Match score was below threshold (0.25)');
			console.log('- The matching function has an issue');
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

manualMatch(); 