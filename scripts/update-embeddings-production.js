const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const path = require('path');

// This script is designed to run with production environment variables
// You can run it with: 
// SUPABASE_URL=your_prod_url SUPABASE_SERVICE_KEY=your_prod_key OPENAI_API_KEY=your_key node scripts/update-embeddings-production.js

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
	console.error('Missing required environment variables');
	console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY');
	console.error('You can run this script with:');
	console.error('SUPABASE_URL=your_prod_url SUPABASE_SERVICE_KEY=your_prod_key OPENAI_API_KEY=your_key node scripts/update-embeddings-production.js');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

async function generateImageEmbedding(imageUrl) {
	try {
		const response = await openai.embeddings.create({
			model: "text-embedding-3-small", // This model returns 1536 dimensions
			input: imageUrl,
			encoding_format: "float",
		});

		// Truncate to 512 dimensions to match database column
		const embedding = response.data[0].embedding.slice(0, 512);
		return embedding;
	} catch (error) {
		console.error('Error generating image embedding:', error);
		return null;
	}
}

async function updateExistingListings() {
	console.log('Starting to update existing listings with image embeddings...');
	console.log('Database URL:', supabaseUrl);
	console.log('Environment: PRODUCTION');

	try {
		// Get all listings that don't have image embeddings yet
		const { data: listings, error } = await supabase
			.from('listings')
			.select('id, image_url')
			.is('image_embedding', null)
			.not('image_url', 'is', null);

		if (error) {
			throw error;
		}

		console.log(`Found ${listings.length} listings without image embeddings`);

		if (listings.length === 0) {
			console.log('All listings already have image embeddings!');
			return;
		}

		let processed = 0;
		let failed = 0;

		for (const listing of listings) {
			try {
				console.log(`Processing listing ${listing.id}...`);

				const embedding = await generateImageEmbedding(listing.image_url);

				if (embedding) {
					const { error: updateError } = await supabase
						.from('listings')
						.update({ image_embedding: embedding })
						.eq('id', listing.id);

					if (updateError) {
						console.error(`Failed to update listing ${listing.id}:`, updateError);
						failed++;
					} else {
						console.log(`✓ Updated listing ${listing.id}`);
						processed++;
					}
				} else {
					console.log(`⚠ Skipped listing ${listing.id} (no embedding generated)`);
					failed++;
				}

				// Add a small delay to avoid overwhelming the API
				await new Promise(resolve => setTimeout(resolve, 200));
			} catch (error) {
				console.error(`Error processing listing ${listing.id}:`, error);
				failed++;
			}
		}

		console.log(`\n✅ Processing complete!`);
		console.log(`Processed: ${processed} listings`);
		console.log(`Failed: ${failed} listings`);

	} catch (error) {
		console.error('Error updating listings:', error);
	}
}

// Run the script
updateExistingListings()
	.then(() => {
		console.log('Script completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 