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

async function testSimilarityPairs() {
	console.log('🔍 Testing similarity between specific pairs...\n');

	try {
		// Get all listings with embeddings
		const { data: listings, error } = await supabase
			.from('listings')
			.select('id, title, item_type, status, image_embedding')
			.not('image_embedding', 'is', null);

		if (error) {
			throw error;
		}

		console.log(`Found ${listings.length} listings with embeddings\n`);

		// Parse embeddings
		const parsedListings = listings.map(listing => {
			let embedding = listing.image_embedding;
			if (typeof embedding === 'string') {
				try {
					embedding = JSON.parse(embedding);
				} catch (e) {
					embedding = null;
				}
			}
			return { ...listing, parsed_embedding: embedding };
		}).filter(listing => listing.parsed_embedding && Array.isArray(listing.parsed_embedding));

		console.log(`Parsed ${parsedListings.length} embeddings successfully\n`);

		// Test specific pairs
		const testPairs = [
			{
				name: 'Airpods vs Airpods',
				listings: parsedListings.filter(l => l.title.toLowerCase().includes('airpod'))
			},
			{
				name: 'Dogs vs Dogs',
				listings: parsedListings.filter(l => l.title.toLowerCase().includes('dog') || l.title.toLowerCase().includes('alfie'))
			},
			{
				name: 'Dolls vs Dolls',
				listings: parsedListings.filter(l => l.title.toLowerCase().includes('doll'))
			}
		];

		for (const pair of testPairs) {
			if (pair.listings.length >= 2) {
				console.log(`📊 ${pair.name}:`);

				// Test all combinations
				for (let i = 0; i < pair.listings.length; i++) {
					for (let j = i + 1; j < pair.listings.length; j++) {
						const listing1 = pair.listings[i];
						const listing2 = pair.listings[j];

						const similarity = calculateCosineSimilarity(listing1.parsed_embedding, listing2.parsed_embedding);
						const distance = calculateEuclideanDistance(listing1.parsed_embedding, listing2.parsed_embedding);

						console.log(`   "${listing1.title}" vs "${listing2.title}"`);
						console.log(`   Cosine similarity: ${(similarity * 100).toFixed(2)}%`);
						console.log(`   Euclidean distance: ${distance.toFixed(4)}`);
						console.log(`   Categories: ${listing1.item_type} vs ${listing2.item_type}`);
						console.log(`   Status: ${listing1.status} vs ${listing2.status}`);
						console.log('');
					}
				}
			} else {
				console.log(`⚠️  ${pair.name}: Not enough listings (${pair.listings.length})`);
			}
		}

		// Test cross-category similarity
		console.log('🎯 Cross-Category Similarity:');
		const airpods = parsedListings.filter(l => l.title.toLowerCase().includes('airpod'));
		const dogs = parsedListings.filter(l => l.title.toLowerCase().includes('dog') || l.title.toLowerCase().includes('alfie'));
		const dolls = parsedListings.filter(l => l.title.toLowerCase().includes('doll'));

		if (airpods.length > 0 && dogs.length > 0) {
			const similarity = calculateCosineSimilarity(airpods[0].parsed_embedding, dogs[0].parsed_embedding);
			console.log(`   Airpods vs Dogs: ${(similarity * 100).toFixed(2)}%`);
		}

		if (airpods.length > 0 && dolls.length > 0) {
			const similarity = calculateCosineSimilarity(airpods[0].parsed_embedding, dolls[0].parsed_embedding);
			console.log(`   Airpods vs Dolls: ${(similarity * 100).toFixed(2)}%`);
		}

		if (dogs.length > 0 && dolls.length > 0) {
			const similarity = calculateCosineSimilarity(dogs[0].parsed_embedding, dolls[0].parsed_embedding);
			console.log(`   Dogs vs Dolls: ${(similarity * 100).toFixed(2)}%`);
		}

	} catch (error) {
		console.error('Error testing similarity pairs:', error);
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

testSimilarityPairs()
	.then(() => {
		console.log('\n✅ Similarity pairs test complete!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 