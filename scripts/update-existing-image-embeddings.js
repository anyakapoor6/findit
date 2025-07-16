const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
	console.error('Missing required environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateImageEmbedding(imageUrl) {
	try {
		const response = await fetch('/api/image-embedding', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ imageUrl }),
		});

		if (!response.ok) {
			throw new Error(`Failed to generate embedding: ${response.statusText}`);
		}

		const data = await response.json();
		return data.embedding;
	} catch (error) {
		console.error('Error generating image embedding:', error);
		return null;
	}
}

async function updateExistingListings() {
	console.log('Starting to update existing listings with image embeddings...');

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
				await new Promise(resolve => setTimeout(resolve, 100));
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