const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ Missing Supabase environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentListings() {
	console.log('🔍 Checking recent listings and potential matches...\n');

	try {
		// Get the 5 most recent listings
		const { data: recentListings, error: fetchError } = await supabase
			.from('listings')
			.select('id, title, description, status, item_type, item_subtype, location, created_at, image_embedding')
			.order('created_at', { ascending: false })
			.limit(5);

		if (fetchError) {
			console.error('❌ Error fetching listings:', fetchError);
			return;
		}

		console.log('📋 Most recent listings:');
		recentListings.forEach((listing, index) => {
			console.log(`${index + 1}. "${listing.title}" (${listing.status})`);
			console.log(`   Category: ${listing.item_type} / ${listing.item_subtype || 'none'}`);
			console.log(`   Location: ${listing.location}`);
			console.log(`   Date: ${new Date(listing.created_at).toLocaleDateString()}`);
			console.log(`   Has embedding: ${listing.image_embedding ? 'Yes' : 'No'}`);
			console.log('');
		});

		// Check for potential matches among recent listings
		console.log('🔍 Checking for potential matches...\n');

		for (let i = 0; i < recentListings.length; i++) {
			const listing1 = recentListings[i];

			for (let j = i + 1; j < recentListings.length; j++) {
				const listing2 = recentListings[j];

				// Only check opposite status listings
				if (listing1.status !== listing2.status) {
					let matchScore = 0;
					let reasons = [];

					// Category match
					if (listing1.item_type === listing2.item_type) {
						matchScore += 0.4;
						reasons.push('Same category');
					}

					// Subcategory match
					if (listing1.item_subtype === listing2.item_subtype && listing1.item_subtype) {
						matchScore += 0.25;
						reasons.push('Same subcategory');
					}

					// Location match
					if (listing1.location === listing2.location && listing1.location) {
						matchScore += 0.1;
						reasons.push('Same location');
					}

					// Keyword match
					if (listing1.title && listing2.title) {
						const words1 = listing1.title.toLowerCase().split(' ');
						const words2 = listing2.title.toLowerCase().split(' ');
						const commonWords = words1.filter(word => words2.includes(word));
						if (commonWords.length > 0) {
							matchScore += Math.min(commonWords.length * 0.05, 0.25);
							reasons.push(`${commonWords.length} common words: ${commonWords.join(', ')}`);
						}
					}

					// Date proximity
					const daysDiff = Math.abs(new Date(listing1.created_at) - new Date(listing2.created_at)) / (1000 * 60 * 60 * 24);
					if (daysDiff <= 7) {
						matchScore += 0.05;
						reasons.push('Within 7 days');
					} else if (daysDiff <= 30) {
						matchScore += 0.025;
						reasons.push('Within 30 days');
					}

					if (matchScore > 0.25) {
						console.log(`🎯 Potential match (${Math.round(matchScore * 100)}%):`);
						console.log(`   "${listing1.title}" (${listing1.status}) ↔ "${listing2.title}" (${listing2.status})`);
						console.log(`   Reasons: ${reasons.join(', ')}`);
						console.log('');
					}
				}
			}
		}

		// Check if there are any existing matches for recent listings
		console.log('📊 Existing matches for recent listings:');
		const { data: recentMatches, error: matchError } = await supabase
			.from('matches')
			.select(`
        id,
        score,
        match_reasons,
        listing:listings!matches_listing_id_fkey(id, title, status, created_at),
        matched_listing:listings!matches_matched_listing_id_fkey(id, title, status, created_at)
      `)
			.or(`listing_id.eq.${recentListings[0].id},matched_listing_id.eq.${recentListings[0].id}`);

		if (matchError) {
			console.error('❌ Error fetching matches:', matchError);
		} else if (recentMatches && recentMatches.length > 0) {
			recentMatches.forEach(match => {
				console.log(`• ${match.listing.title} ↔ ${match.matched_listing.title} (${Math.round(match.score * 100)}%)`);
			});
		} else {
			console.log('❌ No existing matches found for the most recent listing');
		}

	} catch (error) {
		console.error('❌ Error:', error);
	}
}

checkRecentListings(); 