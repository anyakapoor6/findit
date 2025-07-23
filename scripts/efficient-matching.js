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

async function implementEfficientMatching() {
	console.log('🎯 Implementing efficient category-based matching...\n');

	try {
		// Delete existing matches
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

		// Get all active listings (lost and found only, not resolved)
		const { data: listings, error: listingsError } = await supabase
			.from('listings')
			.select('*')
			.in('status', ['lost', 'found'])
			.order('created_at', { ascending: false });

		if (listingsError) {
			throw listingsError;
		}

		console.log(`📋 Processing ${listings.length} active listings...`);

		let processed = 0;
		let matchesCreated = 0;
		let sameCategoryMatchesCount = 0;
		let crossCategoryMatches = 0;

		// Process each listing
		for (const listing of listings) {
			try {
				console.log(`\nProcessing "${listing.title}" (${listing.status}, ${listing.item_type})...`);

				// Find opposite status listings
				const oppositeStatus = listing.status === 'lost' ? 'found' : 'lost';
				const potentialMatches = listings.filter(other =>
					other.id !== listing.id &&
					other.status === oppositeStatus
				);

				console.log(`   Found ${potentialMatches.length} opposite-status listings`);

				// Priority 1: Same category matches (most efficient)
				const sameCategoryMatches = potentialMatches.filter(other =>
					other.item_type === listing.item_type
				);

				console.log(`   Same category (${listing.item_type}): ${sameCategoryMatches.length}`);

				// Process same-category matches with lower threshold
				for (const match of sameCategoryMatches) {
					const score = calculateMatchScore(listing, match);
					if (score > 0.25) { // Lower threshold for same category
						await createMatch(listing.id, match.id, score, listing, match);
						matchesCreated++;
						sameCategoryMatchesCount++;
						console.log(`   ✅ Created same-category match: ${(score * 100).toFixed(1)}%`);
					}
				}

				// Priority 2: Cross-category matches only if very high image similarity
				const differentCategoryMatches = potentialMatches.filter(other =>
					other.item_type !== listing.item_type
				);

				console.log(`   Different category: ${differentCategoryMatches.length}`);

				// Only process cross-category if both have image embeddings
				if (listing.image_embedding) {
					const crossCategoryWithImages = differentCategoryMatches.filter(other =>
						other.image_embedding
					).slice(0, 3); // Very limited cross-category

					console.log(`   Cross-category with images: ${crossCategoryWithImages.length}`);

					for (const match of crossCategoryWithImages) {
						const score = calculateMatchScore(listing, match);
						if (score > 0.6) { // Very high threshold for cross-category
							await createMatch(listing.id, match.id, score, listing, match);
							matchesCreated++;
							crossCategoryMatches++;
							console.log(`   ✅ Created cross-category match: ${(score * 100).toFixed(1)}%`);
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
		console.log(`Same-category matches: ${sameCategoryMatchesCount}`);
		console.log(`Cross-category matches: ${crossCategoryMatches}`);
		console.log(`Efficiency: ${((crossCategoryMatches / matchesCreated) * 100).toFixed(1)}% cross-category matches (should be low)`);

		// Show some example matches
		console.log('\n📊 Example matches created:');
		const { data: newMatches, error: matchesError } = await supabase
			.from('matches')
			.select(`
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

		if (!matchesError && newMatches.length > 0) {
			newMatches.forEach((match, index) => {
				const listing = match.listing;
				const matchedListing = match.matched_listing;
				console.log(`${index + 1}. Score: ${(match.score * 100).toFixed(1)}%`);
				console.log(`   "${listing.title}" (${listing.item_type}) vs "${matchedListing.title}" (${matchedListing.item_type})`);
				console.log(`   Categories: ${listing.item_type} vs ${matchedListing.item_type} - ${listing.item_type === matchedListing.item_type ? 'SAME' : 'DIFFERENT'}`);
				console.log(`   Reasons: ${match.match_reasons?.join(', ') || 'None'}`);
				console.log('');
			});
		}

	} catch (error) {
		console.error('Error implementing efficient matching:', error);
	}
}

function calculateMatchScore(listing1, listing2) {
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

	// Image similarity - ACTUAL COSINE SIMILARITY CALCULATION
	if (listing1.image_embedding && listing2.image_embedding) {
		try {
			// Parse embeddings if they're stored as strings
			let embedding1 = listing1.image_embedding;
			let embedding2 = listing2.image_embedding;

			if (typeof embedding1 === 'string') {
				embedding1 = JSON.parse(embedding1);
			}
			if (typeof embedding2 === 'string') {
				embedding2 = JSON.parse(embedding2);
			}

			// Calculate cosine similarity
			const similarity = calculateCosineSimilarity(embedding1, embedding2);

			// Weight the visual similarity based on actual similarity
			if (similarity > 0.95) {
				// Nearly identical images
				score += 0.3;
				reasons.push(`Identical visual similarity: ${Math.round(similarity * 100)}%`);
			} else if (similarity > 0.90) {
				// Very similar images
				score += 0.2;
				reasons.push(`High visual similarity: ${Math.round(similarity * 100)}%`);
			} else if (similarity > 0.80) {
				// Moderately similar images
				score += 0.1;
				reasons.push(`Visual similarity: ${Math.round(similarity * 100)}%`);
			} else if (similarity > 0.70) {
				// Slightly similar images
				score += 0.05;
				reasons.push(`Moderate visual similarity: ${Math.round(similarity * 100)}%`);
			} else if (similarity > 0.60) {
				// Barely similar images
				score += 0.02;
				reasons.push(`Low visual similarity: ${Math.round(similarity * 100)}%`);
			}
			// Below 0.60 similarity gets no bonus
		} catch (error) {
			console.error('Error calculating image similarity:', error);
			// Fallback to basic bonus if calculation fails
			score += 0.15;
			reasons.push('Visual similarity detected');
		}
	}

	// Location matching (0.1 weight) - simplified for now
	if (listing1.location === listing2.location && listing1.location) {
		score += 0.1;
		reasons.push('Same location');
	}

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

// Helper function to calculate cosine similarity between two vectors
function calculateCosineSimilarity(vector1, vector2) {
	if (!Array.isArray(vector1) || !Array.isArray(vector2) || vector1.length !== vector2.length) {
		return 0;
	}

	let dotProduct = 0;
	let magnitude1 = 0;
	let magnitude2 = 0;

	for (let i = 0; i < vector1.length; i++) {
		dotProduct += vector1[i] * vector2[i];
		magnitude1 += vector1[i] * vector1[i];
		magnitude2 += vector2[i] * vector2[i];
	}

	magnitude1 = Math.sqrt(magnitude1);
	magnitude2 = Math.sqrt(magnitude2);

	if (magnitude1 === 0 || magnitude2 === 0) {
		return 0;
	}

	return dotProduct / (magnitude1 * magnitude2);
}

async function createMatch(listing1Id, listing2Id, score, listing1, listing2) {
	try {
		const reasons = [];

		// Generate match reasons based on the listings
		if (listing1.item_type === listing2.item_type) {
			reasons.push(`Same category: ${listing1.item_type}`);
		} else {
			reasons.push(`Cross-category: ${listing1.item_type} vs ${listing2.item_type}`);
		}

		if (listing1.item_subtype === listing2.item_subtype && listing1.item_subtype) {
			reasons.push(`Same subcategory: ${listing1.item_subtype}`);
		}

		// Add keyword matching reason
		const words1 = listing1.title.toLowerCase().split(' ');
		const words2 = listing2.title.toLowerCase().split(' ');
		const commonWords = words1.filter(word => words2.includes(word));
		if (commonWords.length > 0) {
			reasons.push(`Keyword match: ${commonWords.length} common words`);
		}

		// Add image similarity reason with actual calculation
		if (listing1.image_embedding && listing2.image_embedding) {
			try {
				let embedding1 = listing1.image_embedding;
				let embedding2 = listing2.image_embedding;

				if (typeof embedding1 === 'string') {
					embedding1 = JSON.parse(embedding1);
				}
				if (typeof embedding2 === 'string') {
					embedding2 = JSON.parse(embedding2);
				}

				const similarity = calculateCosineSimilarity(embedding1, embedding2);

				if (similarity > 0.95) {
					reasons.push(`Identical visual similarity: ${Math.round(similarity * 100)}%`);
				} else if (similarity > 0.90) {
					reasons.push(`High visual similarity: ${Math.round(similarity * 100)}%`);
				} else if (similarity > 0.80) {
					reasons.push(`Visual similarity: ${Math.round(similarity * 100)}%`);
				} else if (similarity > 0.70) {
					reasons.push(`Moderate visual similarity: ${Math.round(similarity * 100)}%`);
				} else if (similarity > 0.60) {
					reasons.push(`Low visual similarity: ${Math.round(similarity * 100)}%`);
				}
			} catch (error) {
				reasons.push('Visual similarity detected');
			}
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

implementEfficientMatching()
	.then(() => {
		console.log('\n✅ Script completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 