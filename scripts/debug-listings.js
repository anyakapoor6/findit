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

async function debugListings() {
	console.log('🔍 Debugging listings data...\n');

	try {
		// Get all listings with detailed info
		const { data: listings, error: listingsError } = await supabase
			.from('listings')
			.select('*')
			.order('created_at', { ascending: false });

		if (listingsError) {
			throw listingsError;
		}

		console.log(`📋 Found ${listings.length} total listings:\n`);

		// Group by status
		const lostListings = listings.filter(l => l.status === 'lost');
		const foundListings = listings.filter(l => l.status === 'found');

		console.log(`Lost: ${lostListings.length} listings`);
		console.log(`Found: ${foundListings.length} listings\n`);

		// Show detailed breakdown
		console.log('📊 Detailed breakdown:');
		listings.forEach((listing, index) => {
			console.log(`${index + 1}. "${listing.title}"`);
			console.log(`   Status: ${listing.status}`);
			console.log(`   Category: ${listing.item_type}`);
			console.log(`   Subcategory: ${listing.item_subtype}`);
			console.log(`   Created: ${listing.created_at}`);
			console.log(`   Has image_embedding: ${listing.image_embedding ? 'Yes' : 'No'}`);
			console.log('');
		});

		// Test potential matches
		console.log('🎯 Testing potential matches:');

		for (const listing of listings) {
			console.log(`\nTesting "${listing.title}" (${listing.status}, ${listing.item_type}):`);

			// Find opposite status listings
			const oppositeStatus = listing.status === 'lost' ? 'found' : 'lost';
			const potentialMatches = listings.filter(other =>
				other.id !== listing.id &&
				other.status === oppositeStatus
			);

			console.log(`   Found ${potentialMatches.length} opposite-status listings`);

			// Same category matches
			const sameCategoryMatches = potentialMatches.filter(other =>
				other.item_type === listing.item_type
			);
			console.log(`   Same category (${listing.item_type}): ${sameCategoryMatches.length}`);

			// Different category matches
			const differentCategoryMatches = potentialMatches.filter(other =>
				other.item_type !== listing.item_type
			);
			console.log(`   Different category: ${differentCategoryMatches.length}`);

			// Show some examples
			if (sameCategoryMatches.length > 0) {
				console.log(`   Same category examples:`);
				sameCategoryMatches.slice(0, 3).forEach(match => {
					console.log(`     - "${match.title}" (${match.item_type})`);
				});
			}

			if (differentCategoryMatches.length > 0) {
				console.log(`   Different category examples:`);
				differentCategoryMatches.slice(0, 3).forEach(match => {
					console.log(`     - "${match.title}" (${match.item_type})`);
				});
			}
		}

		// Test the date filtering issue
		console.log('\n📅 Testing date filtering:');
		const now = new Date();
		const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
		console.log(`Current time: ${now.toISOString()}`);
		console.log(`90 days ago: ${ninetyDaysAgo.toISOString()}`);

		const recentListings = listings.filter(l => new Date(l.created_at) >= ninetyDaysAgo);
		console.log(`Listings within 90 days: ${recentListings.length}/${listings.length}`);

		if (recentListings.length === 0) {
			console.log('⚠️  No listings within 90 days - this is why no matches are found!');
			console.log('Using all listings for matching instead...');
		}

	} catch (error) {
		console.error('Error debugging listings:', error);
	}
}

debugListings()
	.then(() => {
		console.log('\n✅ Debug complete');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Debug failed:', error);
		process.exit(1);
	}); 