import { supabase } from '../utils/supabaseClient';

// Upload image to Supabase Storage
export async function uploadListingImage(file: File, userId: string): Promise<string> {
	const timestamp = Date.now();
	const fileExtension = file.name.split('.').pop();
	const fileName = `${userId}_${timestamp}.${fileExtension}`;

	const { error } = await supabase.storage
		.from('listing-images')
		.upload(fileName, file, {
			cacheControl: '3600',
			upsert: false
		});

	if (error) {
		throw new Error(`Failed to upload image: ${error.message}`);
	}

	// Get the public URL
	const { data: urlData } = supabase.storage
		.from('listing-images')
		.getPublicUrl(fileName);

	return urlData.publicUrl;
}

// Delete image from Supabase Storage
export async function deleteListingImage(fileName: string): Promise<void> {
	const { error } = await supabase.storage
		.from('listing-images')
		.remove([fileName]);

	if (error) {
		throw new Error(`Failed to delete image: ${error.message}`);
	}
}

// Get file name from URL
export function getFileNameFromUrl(url: string): string {
	const urlParts = url.split('/');
	return urlParts[urlParts.length - 1];
} 