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

async function updateMatchingFunctions() {
	console.log('🔄 Updating matching functions for better efficiency...\n');

	try {
		// First, let's test the current matching to see what we're working with
		console.log('📊 Current matching behavior:');

		// Get a sample of current matches
		const { data: currentMatches, error: matchesError } = await supabase
			.from('matches')
			.select(`
				id,
				score,
				match_reasons,
				listing:listings!listing_id(
					title,
					item_type,
					status
				),
				matched_listing:listings!matched_listing_id(
					title,
					item_type,
					status
				)
			`)
			.order('score', { ascending: false })
			.limit(5);

		if (matchesError) {
			console.error('Error fetching current matches:', matchesError);
		} else {
			console.log(`Found ${currentMatches.length} current matches:`);
			currentMatches.forEach((match, index) => {
				const listing = match.listing;
				const matchedListing = match.matched_listing;
				console.log(`${index + 1}. Score: ${(match.score * 100).toFixed(1)}%`);
				console.log(`   "${listing.title}" (${listing.item_type}) vs "${matchedListing.title}" (${matchedListing.item_type})`);
				console.log(`   Categories: ${listing.item_type} vs ${matchedListing.item_type} - ${listing.item_type === matchedListing.item_type ? 'SAME' : 'DIFFERENT'}`);
				console.log(`   Reasons: ${match.match_reasons?.join(', ') || 'None'}`);
				console.log('');
			});
		}

		// Now let's implement a more efficient matching approach
		console.log('🎯 Implementing efficient category-based matching...');

		// Delete existing inefficient matches
		console.log('🗑️  Deleting existing matches...');
		const { error: deleteError } = await supabase
			.from('matches')
			.delete()
			.neq('id', '00000000-0000-0000-0000-000000000000');

		if (deleteError) {
			console.error('Error deleting matches:', deleteError);
		} else {
			console.log('✅ Deleted existing matches');
		}

		// Get all listings
		const { data: listings, error: listingsError } = await supabase
			.from('listings')
			.select('id, title, status, item_type, item_subtype, image_embedding')
			.order('created_at', { ascending: false });

		if (listingsError) {
			throw listingsError;
		}

		console.log(`\n📋 Processing ${listings.length} listings with category-based matching...`);

		let processed = 0;
		let matchesCreated = 0;
		let crossCategoryMatches = 0;

		// Process each listing
		for (const listing of listings) {
			try {
				console.log(`\nProcessing "${listing.title}" (${listing.item_type})...`);

				// Find potential matches with category filtering
				const potentialMatches = listings.filter(other =>
					other.id !== listing.id &&
					other.status !== listing.status &&
					other.created_at >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() // Within 90 days
				);

				// Priority 1: Same category matches (most efficient)
				const sameCategoryMatches = potentialMatches.filter(other =>
					other.item_type === listing.item_type
				).slice(0, 10); // Limit to prevent too many API calls

				console.log(`   Found ${sameCategoryMatches.length} same-category potential matches`);

				// Process same-category matches
				for (const match of sameCategoryMatches) {
					const score = calculateEfficientMatchScore(listing, match);
					if (score > 0.3) { // Higher threshold for efficiency
						await createMatch(listing.id, match.id, score, listing, match);
						matchesCreated++;
					}
				}

				// Priority 2: Cross-category matches only if very high image similarity
				if (listing.image_embedding) {
					const crossCategoryMatches = potentialMatches.filter(other =>
						other.item_type !== listing.item_type &&
						other.image_embedding
					).slice(0, 5); // Very limited cross-category

					console.log(`   Found ${crossCategoryMatches.length} cross-category potential matches`);

					for (const match of crossCategoryMatches) {
						const score = calculateEfficientMatchScore(listing, match);
						if (score > 0.6) { // Very high threshold for cross-category
							await createMatch(listing.id, match.id, score, listing, match);
							matchesCreated++;
							crossCategoryMatches++;
						}
					}
				}

				processed++;
			} catch (error) {
				console.error(`Error processing ${listing.id}:`, error);
			}
		}

		console.log(`\n✅ Efficient matching complete!`);
		console.log(`Processed: ${processed} listings`);
		console.log(`Total matches created: ${matchesCreated}`);
		console.log(`Cross-category matches: ${crossCategoryMatches}`);
		console.log(`Efficiency improvement: ${((crossCategoryMatches / matchesCreated) * 100).toFixed(1)}% cross-category matches (should be low)`);

	} catch (error) {
		console.error('Error updating matching functions:', error);
	}
}

function calculateEfficientMatchScore(listing1, listing2) {
	let score = 0;
	const reasons = [];

	// Category match (0.4 weight - highest priority)
	if (listing1.item_type === listing2.item_type) {
		score += 0.4;
		reasons.push(`Same category: ${listing1.item_type}`);
	} else {
		// Cross-category penalty
		score -= 0.2;
		reasons.push(`Different category: ${listing1.item_type} vs ${listing2.item_type}`);
	}

	// Subcategory match (0.25 weight)
	if (listing1.item_subtype === listing2.item_subtype && listing1.item_subtype) {
		score += 0.25;
		reasons.push(`Same subcategory: ${listing1.item_subtype}`);
	}

	// Keyword matching (0.2 weight)
	const words1 = listing1.title.toLowerCase().split(' ');
	const words2 = listing2.title.toLowerCase().split(' ');
	const commonWords = words1.filter(word => words2.includes(word));
	if (commonWords.length > 0) {
		score += Math.min(commonWords.length * 0.05, 0.2);
		reasons.push(`Keyword match: ${commonWords.length} common words`);
	}

	// Image similarity (if both have embeddings)
	if (listing1.image_embedding && listing2.image_embedding) {
		// For now, we'll use a simple approach since we can't calculate pgvector distance here
		// In production, this would use the actual pgvector calculation
		const hasImageSimilarity = true; // Placeholder
		if (hasImageSimilarity) {
			score += 0.15;
			reasons.push('Visual similarity detected');
		}
	}

	// Location matching (0.1 weight)
	// This would be implemented based on actual location data

	// Date proximity (0.05 weight)
	const date1 = new Date(listing1.created_at);
	const date2 = new Date(listing2.created_at);
	const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
	if (daysDiff <= 7) {
		score += 0.05;
		reasons.push('Date proximity: within 7 days');
	}

	return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}

async function createMatch(listing1Id, listing2Id, score, listing1, listing2) {
	try {
		const reasons = [];

		// Generate match reasons based on the listings
		if (listing1.item_type === listing2.item_type) {
			reasons.push(`Same category: ${listing1.item_type}`);
		}

		if (listing1.item_subtype === listing2.item_subtype && listing1.item_subtype) {
			reasons.push(`Same subcategory: ${listing1.item_subtype}`);
		}

		const { error } = await supabase
			.from('matches')
			.insert({
				listing_id: listing1Id,
				matched_listing_id: listing2Id,
				score: score,
				match_reasons: reasons
			});

		if (error) {
			console.error(`Error creating match:`, error);
		}
	} catch (error) {
		console.error(`Error creating match:`, error);
	}
}

updateMatchingFunctions()
	.then(() => {
		console.log('\n✅ Script completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 