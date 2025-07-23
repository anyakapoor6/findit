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

async function debugEmbeddings() {
	console.log('🔍 Debugging embedding data...\n');

	try {
		// Get a few listings with embeddings
		const { data: listings, error } = await supabase
			.from('listings')
			.select('id, title, item_type, image_embedding')
			.not('image_embedding', 'is', null)
			.limit(3);

		if (error) {
			throw error;
		}

		console.log(`Found ${listings.length} listings with embeddings\n`);

		listings.forEach((listing, index) => {
			console.log(`${index + 1}. "${listing.title}" (${listing.item_type})`);
			console.log(`   ID: ${listing.id}`);
			console.log(`   Embedding type: ${typeof listing.image_embedding}`);
			console.log(`   Embedding length: ${listing.image_embedding ? listing.image_embedding.length : 'null'}`);

			// Parse the embedding if it's a string
			let embeddingArray = listing.image_embedding;
			if (typeof listing.image_embedding === 'string') {
				try {
					// Try to parse as JSON first
					embeddingArray = JSON.parse(listing.image_embedding);
				} catch (e) {
					// If not JSON, it might be a pgvector string format
					console.log(`   Raw embedding string: ${listing.image_embedding.substring(0, 100)}...`);
					embeddingArray = null;
				}
			}

			if (embeddingArray && Array.isArray(embeddingArray) && embeddingArray.length > 0) {
				console.log(`   Parsed embedding length: ${embeddingArray.length}`);
				console.log(`   First 5 values: [${embeddingArray.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
				console.log(`   Last 5 values: [${embeddingArray.slice(-5).map(v => v.toFixed(4)).join(', ')}]`);

				// Check if all values are the same (which would indicate an issue)
				const firstValue = embeddingArray[0];
				const allSame = embeddingArray.every(v => v === firstValue);
				console.log(`   All values same: ${allSame}`);

				// Check for NaN or invalid values
				const hasNaN = embeddingArray.some(v => isNaN(v));
				console.log(`   Has NaN values: ${hasNaN}`);
			} else {
				console.log(`   Could not parse embedding as array`);
			}
			console.log('');
		});

		// Test similarity calculation with actual data
		if (listings.length >= 2) {
			const listing1 = listings[0];
			const listing2 = listings[1];

			console.log('🧮 Testing similarity calculation:');
			console.log(`   "${listing1.title}" vs "${listing2.title}"`);

			// Parse embeddings
			let embedding1 = listing1.image_embedding;
			let embedding2 = listing2.image_embedding;

			if (typeof embedding1 === 'string') {
				try {
					embedding1 = JSON.parse(embedding1);
				} catch (e) {
					embedding1 = null;
				}
			}

			if (typeof embedding2 === 'string') {
				try {
					embedding2 = JSON.parse(embedding2);
				} catch (e) {
					embedding2 = null;
				}
			}

			if (embedding1 && embedding2 && Array.isArray(embedding1) && Array.isArray(embedding2)) {
				const similarity = calculateCosineSimilarity(embedding1, embedding2);
				console.log(`   Raw similarity: ${similarity}`);
				console.log(`   Percentage: ${(similarity * 100).toFixed(4)}%`);

				// Also test with pgvector distance
				const distance = calculateEuclideanDistance(embedding1, embedding2);
				console.log(`   Euclidean distance: ${distance}`);
				console.log(`   Similarity from distance: ${1 - (distance / Math.sqrt(embedding1.length))}`);
			} else {
				console.log(`   Could not parse embeddings for similarity calculation`);
			}
		}

	} catch (error) {
		console.error('Error debugging embeddings:', error);
	}
}

function calculateCosineSimilarity(embedding1, embedding2) {
	if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
		return 0;
	}

	let dotProduct = 0;
	let norm1 = 0;
	let norm2 = 0;

	for (let i = 0; i < embedding1.length; i++) {
		dotProduct += embedding1[i] * embedding2[i];
		norm1 += embedding1[i] * embedding1[i];
		norm2 += embedding2[i] * embedding2[i];
	}

	norm1 = Math.sqrt(norm1);
	norm2 = Math.sqrt(norm2);

	if (norm1 === 0 || norm2 === 0) {
		return 0;
	}

	return dotProduct / (norm1 * norm2);
}

function calculateEuclideanDistance(embedding1, embedding2) {
	if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
		return Infinity;
	}

	let sum = 0;
	for (let i = 0; i < embedding1.length; i++) {
		const diff = embedding1[i] - embedding2[i];
		sum += diff * diff;
	}

	return Math.sqrt(sum);
}

debugEmbeddings()
	.then(() => {
		console.log('\n✅ Debug complete!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 