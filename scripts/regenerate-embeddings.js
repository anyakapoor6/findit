const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
	console.error('Missing required environment variables');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

async function generateImageEmbedding(imageUrl) {
	try {
		// First, get a detailed description of the image using vision model
		const visionResponse = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: "Generate a detailed description of this image that can be used for matching with similar items. Focus on visual characteristics, colors, shapes, materials, and any distinctive features."
						},
						{
							type: "image_url",
							image_url: {
								url: imageUrl
							}
						}
					]
				}
			],
			max_tokens: 300
		});

		const imageDescription = visionResponse.choices[0].message.content;
		console.log(`  Generated description: ${imageDescription.substring(0, 100)}...`);

		// Now generate embedding from the description
		const embeddingResponse = await openai.embeddings.create({
			model: "text-embedding-3-small",
			input: imageDescription,
			encoding_format: "float",
		});

		// Truncate to 512 dimensions to match database column
		const embedding = embeddingResponse.data[0].embedding.slice(0, 512);
		return embedding;
	} catch (error) {
		console.error('Error generating image embedding:', error);
		return null;
	}
}

async function regenerateAllEmbeddings() {
	console.log('🔄 Starting to regenerate all image embeddings with improved vision model...');

	try {
		// Get all listings with images
		const { data: listings, error } = await supabase
			.from('listings')
			.select('id, title, image_url')
			.not('image_url', 'is', null);

		if (error) {
			throw error;
		}

		console.log(`Found ${listings.length} listings with images to regenerate`);

		if (listings.length === 0) {
			console.log('No listings with images found!');
			return;
		}

		let processed = 0;
		let failed = 0;

		for (const listing of listings) {
			try {
				console.log(`\nProcessing listing "${listing.title}" (${listing.id})...`);

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
				await new Promise(resolve => setTimeout(resolve, 500));
			} catch (error) {
				console.error(`Error processing listing ${listing.id}:`, error);
				failed++;
			}
		}

		console.log(`\n✅ Regeneration complete!`);
		console.log(`Processed: ${processed} listings`);
		console.log(`Failed: ${failed} listings`);

		// After regenerating, trigger match recalculation
		console.log('\n🔄 Triggering match recalculation...');
		for (const listing of listings) {
			try {
				await supabase.rpc('find_matches_for_listing', { new_listing_id: listing.id });
				console.log(`✓ Recalculated matches for ${listing.id}`);
			} catch (error) {
				console.error(`Failed to recalculate matches for ${listing.id}:`, error);
			}
		}

	} catch (error) {
		console.error('Error regenerating embeddings:', error);
	}
}

// Run the script
regenerateAllEmbeddings()
	.then(() => {
		console.log('\n✅ Script completed');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Script failed:', error);
		process.exit(1);
	}); 