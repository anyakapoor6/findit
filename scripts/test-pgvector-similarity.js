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

async function testPgvectorSimilarity() {
	console.log('🔍 Testing pgvector similarity calculation...\n');

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

		// Test specific pairs using pgvector
		const testPairs = [
			{
				name: 'Airpods vs Airpods',
				listings: listings.filter(l => l.title.toLowerCase().includes('airpod'))
			},
			{
				name: 'Dogs vs Dogs',
				listings: listings.filter(l => l.title.toLowerCase().includes('dog') || l.title.toLowerCase().includes('alfie'))
			},
			{
				name: 'Dolls vs Dolls',
				listings: listings.filter(l => l.title.toLowerCase().includes('doll'))
			}
		];

		for (const pair of testPairs) {
			if (pair.listings.length >= 2) {
				console.log(`📊 ${pair.name}:`);

				// Test first two listings
				const listing1 = pair.listings[0];
				const listing2 = pair.listings[1];

				// Use pgvector to calculate similarity
				const { data: similarityResult, error: similarityError } = await supabase
					.rpc('calculate_image_similarity', {
						embedding1: listing1.image_embedding,
						embedding2: listing2.image_embedding
					});

				if (similarityError) {
					console.log(`   Error calculating similarity: ${similarityError.message}`);
				} else {
					const pgvectorSimilarity = similarityResult;
					const cosineSimilarity = 1 - pgvectorSimilarity; // Convert distance to similarity

					console.log(`   "${listing1.title}" vs "${listing2.title}"`);
					console.log(`   Pgvector distance: ${pgvectorSimilarity.toFixed(4)}`);
					console.log(`   Cosine similarity: ${(cosineSimilarity * 100).toFixed(2)}%`);
					console.log(`   Would trigger visual match: ${cosineSimilarity > 0.7 ? 'High (>70%)' : cosineSimilarity > 0.5 ? 'Moderate (>50%)' : 'No (<50%)'}`);
					console.log(`   Categories: ${listing1.item_type} vs ${listing2.item_type}`);
					console.log(`   Status: ${listing1.status} vs ${listing2.status}`);
					console.log('');
				}
			} else {
				console.log(`⚠️  ${pair.name}: Not enough listings (${pair.listings.length})`);
			}
		}

		// Test cross-category similarity
		console.log('🎯 Cross-Category Pgvector Similarity:');
		const airpods = listings.filter(l => l.title.toLowerCase().includes('airpod'));
		const dogs = listings.filter(l => l.title.toLowerCase().includes('dog') || l.title.toLowerCase().includes('alfie'));
		const dolls = listings.filter(l => l.title.toLowerCase().includes('doll'));

		if (airpods.length > 0 && dogs.length > 0) {
			const { data: similarity } = await supabase
				.rpc('calculate_image_similarity', {
					embedding1: airpods[0].image_embedding,
					embedding2: dogs[0].image_embedding
				});
			const cosineSimilarity = 1 - similarity;
			console.log(`   Airpods vs Dogs: ${(cosineSimilarity * 100).toFixed(2)}%`);
		}

		if (airpods.length > 0 && dolls.length > 0) {
			const { data: similarity } = await supabase
				.rpc('calculate_image_similarity', {
					embedding1: airpods[0].image_embedding,
					embedding2: dolls[0].image_embedding
				});
			const cosineSimilarity = 1 - similarity;
			console.log(`   Airpods vs Dolls: ${(cosineSimilarity * 100).toFixed(2)}%`);
		}

		if (dogs.length > 0 && dolls.length > 0) {
			const { data: similarity } = await supabase
				.rpc('calculate_image_similarity', {
					embedding1: dogs[0].image_embedding,
					embedding2: dolls[0].image_embedding
				});
			const cosineSimilarity = 1 - similarity;
			console.log(`   Dogs vs Dolls: ${(cosineSimilarity * 100).toFixed(2)}%`);
		}

	} catch (error) {
		console.error('Error testing pgvector similarity:', error);
	}
}

testPgvectorSimilarity()
	.then(() => {
		console.log('\n✅ Pgvector similarity test complete!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 