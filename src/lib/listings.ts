import { supabase } from '../utils/supabaseClient';
import type { Listing, CreateListingData } from './types';

// Fetch all listings
export async function fetchListings(): Promise<Listing[]> {
	const { data, error } = await supabase
		.from('listings')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data as Listing[];
}

// Fetch listings by status (lost or found)
export async function fetchListingsByStatus(status: 'lost' | 'found'): Promise<Listing[]> {
	const { data, error } = await supabase
		.from('listings')
		.select('*')
		.eq('status', status)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data as Listing[];
}

// Fetch listings by user ID
export async function fetchUserListings(userId: string): Promise<Listing[]> {
	const { data, error } = await supabase
		.from('listings')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data as Listing[];
}

// Add a new listing
export async function addListing(listingData: CreateListingData): Promise<Listing> {
	const { data: { user } } = await supabase.auth.getUser();
	if (!user) throw new Error('User not authenticated');

	const { data, error } = await supabase
		.from('listings')
		.insert([{ ...listingData, user_id: user.id }])
		.select()
		.single();

	if (error) throw error;
	return data as Listing;
}

// Update a listing
export async function updateListing(id: string, updates: Partial<CreateListingData>): Promise<Listing> {
	const { data, error } = await supabase
		.from('listings')
		.update(updates)
		.eq('id', id)
		.select()
		.single();

	if (error) throw error;
	return data as Listing;
}

// Delete a listing
export async function deleteListing(id: string): Promise<void> {
	const { error } = await supabase
		.from('listings')
		.delete()
		.eq('id', id);

	if (error) throw error;
}

// Get a single listing by ID
export async function getListing(id: string): Promise<Listing> {
	const { data, error } = await supabase
		.from('listings')
		.select('*')
		.eq('id', id)
		.single();

	if (error) throw error;
	return data as Listing;
} 