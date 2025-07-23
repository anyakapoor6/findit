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

async function testImageSimilarity() {
	console.log('🔍 Testing image similarity scores between listings...\n');

	try {
		// Get all listings with embeddings
		const { data: listings, error } = await supabase
			.from('listings')
			.select('id, title, item_type, status, image_url, image_embedding')
			.not('image_embedding', 'is', null)
			.order('created_at', { ascending: false });

		if (error) {
			throw error;
		}

		console.log(`Found ${listings.length} listings with embeddings\n`);

		// Test similarity between similar items
		const testPairs = [
			// Test Airpods vs Airpods (should be very similar)
			{ name: 'Airpods vs Airpods', filter: (l) => l.title.toLowerCase().includes('airpod') },
			// Test Dogs vs Dogs (should be similar)
			{ name: 'Dogs vs Dogs', filter: (l) => l.title.toLowerCase().includes('dog') || l.title.toLowerCase().includes('alfie') },
			// Test Dolls vs Dolls (should be similar)
			{ name: 'Dolls vs Dolls', filter: (l) => l.title.toLowerCase().includes('doll') },
			// Test different categories (should be less similar)
			{ name: 'Different Categories', filter: (l) => true }
		];

		for (const testPair of testPairs) {
			const filteredListings = listings.filter(testPair.filter);

			if (filteredListings.length < 2) {
				console.log(`⚠️  ${testPair.name}: Not enough listings (${filteredListings.length})`);
				continue;
			}

			console.log(`📊 ${testPair.name}:`);

			// Test similarity between first two listings
			const listing1 = filteredListings[0];
			const listing2 = filteredListings[1];

			// Calculate cosine similarity manually
			const embedding1 = listing1.image_embedding;
			const embedding2 = listing2.image_embedding;

			if (embedding1 && embedding2) {
				const similarity = calculateCosineSimilarity(embedding1, embedding2);
				console.log(`   "${listing1.title}" vs "${listing2.title}"`);
				console.log(`   Similarity: ${(similarity * 100).toFixed(1)}%`);
				console.log(`   Categories: ${listing1.item_type} vs ${listing2.item_type}`);
				console.log(`   Status: ${listing1.status} vs ${listing2.status}`);
				console.log('');
			}
		}

		// Test a few specific pairs
		console.log('🎯 Specific Similarity Tests:');

		const airpods = listings.filter(l => l.title.toLowerCase().includes('airpod'));
		const dogs = listings.filter(l => l.title.toLowerCase().includes('dog') || l.title.toLowerCase().includes('alfie'));
		const dolls = listings.filter(l => l.title.toLowerCase().includes('doll'));

		if (airpods.length >= 2) {
			const similarity = calculateCosineSimilarity(airpods[0].image_embedding, airpods[1].image_embedding);
			console.log(`   Airpods similarity: ${(similarity * 100).toFixed(1)}%`);
		}

		if (dogs.length >= 2) {
			const similarity = calculateCosineSimilarity(dogs[0].image_embedding, dogs[1].image_embedding);
			console.log(`   Dogs similarity: ${(similarity * 100).toFixed(1)}%`);
		}

		if (dolls.length >= 2) {
			const similarity = calculateCosineSimilarity(dolls[0].image_embedding, dolls[1].image_embedding);
			console.log(`   Dolls similarity: ${(similarity * 100).toFixed(1)}%`);
		}

		// Test cross-category similarity
		if (airpods.length > 0 && dogs.length > 0) {
			const similarity = calculateCosineSimilarity(airpods[0].image_embedding, dogs[0].image_embedding);
			console.log(`   Airpods vs Dogs similarity: ${(similarity * 100).toFixed(1)}%`);
		}

	} catch (error) {
		console.error('Error testing image similarity:', error);
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

testImageSimilarity()
	.then(() => {
		console.log('\n✅ Image similarity test complete!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 