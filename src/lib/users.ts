import { supabase } from '../utils/supabaseClient';
import { Profile } from './types';

export async function getUserProfile(userId: string): Promise<Profile | null> {
	try {
		const { data, error } = await supabase
			.from('users')
			.select('*')
			.eq('id', userId)
			.single();

		if (error) {
			console.error('Error fetching user profile:', error);
			return null;
		}

		return data;
	} catch (error) {
		console.error('Error fetching user profile:', error);
		return null;
	}
}

export async function createUserProfile(userId: string, email: string, name?: string): Promise<Profile | null> {
	try {
		const { data, error } = await supabase
			.from('users')
			.insert({
				id: userId,
				email,
				name
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating user profile:', error);
			return null;
		}

		return data;
	} catch (error) {
		console.error('Error creating user profile:', error);
		return null;
	}
}

export async function updateUserProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
	try {
		console.log('Updating profile for user:', userId, 'with updates:', updates);

		const { data, error } = await supabase
			.from('users')
			.update({
				...updates,
				updated_at: new Date().toISOString()
			})
			.eq('id', userId)
			.select()
			.single();

		if (error) {
			console.error('Error updating user profile:', error);
			return null;
		}

		console.log('Profile updated successfully:', data);
		return data;
	} catch (error) {
		console.error('Error updating user profile:', error);
		return null;
	}
}

export async function syncUserProfile(userId: string, email: string, name?: string): Promise<Profile | null> {
	try {
		// First try to get existing profile
		let profile = await getUserProfile(userId);

		if (!profile) {
			// Create new profile if it doesn't exist
			profile = await createUserProfile(userId, email, name);
		} else {
			// Update existing profile with latest data
			profile = await updateUserProfile(userId, { email, name });
		}

		return profile;
	} catch (error) {
		console.error('Error syncing user profile:', error);
		return null;
	}
} 