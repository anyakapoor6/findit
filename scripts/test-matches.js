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

async function testMatches() {
	console.log('🔍 Testing existing matches and image embeddings...\n');

	try {
		// Get existing matches with details
		const { data: matches, error } = await supabase
			.from('matches')
			.select(`
				id,
				score,
				match_reasons,
				listing:listings!listing_id(
					title,
					item_type,
					status,
					image_url,
					image_embedding
				),
				matched_listing:listings!matched_listing_id(
					title,
					item_type,
					status,
					image_url,
					image_embedding
				)
			`)
			.order('score', { ascending: false })
			.limit(10);

		if (error) {
			throw error;
		}

		console.log(`Found ${matches.length} matches:\n`);

		matches.forEach((match, index) => {
			const listing = match.listing;
			const matchedListing = match.matched_listing;

			console.log(`${index + 1}. Match Score: ${(match.score * 100).toFixed(1)}%`);
			console.log(`   Listing 1: "${listing.title}" (${listing.item_type}, ${listing.status})`);
			console.log(`   Listing 2: "${matchedListing.title}" (${matchedListing.item_type}, ${matchedListing.status})`);
			console.log(`   Embeddings: ${listing.image_embedding ? '✓' : '✗'} / ${matchedListing.image_embedding ? '✓' : '✗'}`);
			console.log(`   Match Reasons: ${match.match_reasons?.join(', ') || 'None'}`);
			console.log('');
		});

		// Check embedding statistics
		const { count: totalListings } = await supabase
			.from('listings')
			.select('*', { count: 'exact', head: true });

		const { count: listingsWithEmbeddings } = await supabase
			.from('listings')
			.select('*', { count: 'exact', head: true })
			.not('image_embedding', 'is', null);

		console.log(`📊 Embedding Statistics:`);
		console.log(`   Total listings: ${totalListings}`);
		console.log(`   Listings with embeddings: ${listingsWithEmbeddings}`);
		console.log(`   Embedding coverage: ${((listingsWithEmbeddings / totalListings) * 100).toFixed(1)}%`);

	} catch (error) {
		console.error('Error testing matches:', error);
	}
}

testMatches()
	.then(() => {
		console.log('\n✅ Test complete!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 