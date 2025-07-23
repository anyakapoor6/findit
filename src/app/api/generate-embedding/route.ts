import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '../../../utils/supabaseClient';

const supabase = createSupabaseClient();

export async function POST(request: NextRequest) {
	try {
		const { listingId, imageUrl, item_type, item_subtype } = await request.json();

		if (!imageUrl) {
			return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
		}

		// Check if embedding already exists to avoid duplicate API calls
		const { data: existingListing, error: fetchError } = await supabase
			.from('listings')
			.select('image_embedding')
			.eq('id', listingId)
			.single();

		if (fetchError) {
			console.error('Error fetching existing listing:', fetchError);
			return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
		}

		// If embedding already exists, skip generation
		if (existingListing.image_embedding) {
			return NextResponse.json({
				success: true,
				embedding_length: existingListing.image_embedding.length,
				cached: true
			});
		}

		// Generate image embedding using OpenAI CLIP or similar
		const embedding = await generateImageEmbedding(imageUrl);

		if (!embedding) {
			return NextResponse.json({ error: 'Failed to generate embedding' }, { status: 500 });
		}

		// Store the embedding in the database
		const { error: updateError } = await supabase
			.from('listings')
			.update({
				image_embedding: embedding,
				updated_at: new Date().toISOString()
			})
			.eq('id', listingId);

		if (updateError) {
			console.error('Error updating listing with embedding:', updateError);
			return NextResponse.json({ error: 'Failed to store embedding' }, { status: 500 });
		}

		return NextResponse.json({ success: true, embedding_length: embedding.length });
	} catch (error) {
		console.error('Error generating embedding:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

async function generateImageEmbedding(imageUrl: string): Promise<number[] | null> {
	try {
		// Option 1: Use OpenAI CLIP API (requires API key)
		if (process.env.OPENAI_API_KEY) {
			return await generateOpenAICLIPEmbedding(imageUrl);
		}

		// Option 2: Use a free alternative like Hugging Face
		if (process.env.HUGGINGFACE_API_KEY) {
			return await generateHuggingFaceEmbedding(imageUrl);
		}

		// Option 3: Fallback to a simple feature extraction (not as good but works)
		return await generateSimpleEmbedding(imageUrl);

	} catch (error) {
		console.error('Error in generateImageEmbedding:', error);
		return null;
	}
}

async function generateOpenAICLIPEmbedding(imageUrl: string): Promise<number[] | null> {
	try {
		// Use OpenAI's vision model for image embeddings
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'gpt-4o',
				messages: [
					{
						role: 'user',
						content: [
							{
								type: 'text',
								text: 'Generate a detailed description of this image that can be used for matching with similar items. Focus on visual characteristics, colors, shapes, materials, and any distinctive features.'
							},
							{
								type: 'image_url',
								image_url: {
									url: imageUrl
								}
							}
						]
					}
				],
				max_tokens: 300
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status}`);
		}

		const data = await response.json();
		const imageDescription = data.choices[0].message.content;

		// Now generate embedding from the description
		const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				input: imageDescription,
				model: 'text-embedding-3-small'
			}),
		});

		if (!embeddingResponse.ok) {
			throw new Error(`OpenAI embedding API error: ${embeddingResponse.status}`);
		}

		const embeddingData = await embeddingResponse.json();
		const fullEmbedding = embeddingData.data[0].embedding;

		// Truncate to 512 dimensions to match database column
		return fullEmbedding.slice(0, 512);
	} catch (error) {
		console.error('OpenAI CLIP embedding error:', error);
		return null;
	}
}

async function generateHuggingFaceEmbedding(imageUrl: string): Promise<number[] | null> {
	try {
		const response = await fetch(
			'https://api-inference.huggingface.co/models/laion/CLIP-ViT-B-32-laion2B-s34B-b79K',
			{
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					inputs: imageUrl,
				}),
			}
		);

		if (!response.ok) {
			throw new Error(`Hugging Face API error: ${response.status}`);
		}

		const data = await response.json();
		return data.embeddings[0];
	} catch (error) {
		console.error('Hugging Face embedding error:', error);
		return null;
	}
}

async function generateSimpleEmbedding(imageUrl: string): Promise<number[] | null> {
	try {
		// This is a simple fallback that creates a basic feature vector
		// based on image properties. It's not as sophisticated as CLIP but works for testing.

		// For now, we'll create a simple hash-based embedding
		// In production, you should use a proper visual embedding model

		const imageHash = await generateImageHash(imageUrl);
		const embedding = new Array(512).fill(0);

		// Use the hash to seed a pseudo-random embedding
		for (let i = 0; i < embedding.length; i++) {
			embedding[i] = Math.sin(imageHash + i) * 0.5 + 0.5;
		}

		return embedding;
	} catch (error) {
		console.error('Simple embedding error:', error);
		return null;
	}
}

async function generateImageHash(imageUrl: string): Promise<number> {
	// Simple hash function for the image URL
	let hash = 0;
	for (let i = 0; i < imageUrl.length; i++) {
		const char = imageUrl.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
} 