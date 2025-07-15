import { createSupabaseClient } from '../utils/supabaseClient';
const supabase = createSupabaseClient();
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

export async function createUserProfile(userId: string, email: string, name?: string, phone?: string): Promise<Profile | null> {
	try {
		const { data, error } = await supabase
			.from('users')
			.insert({
				id: userId,
				email,
				name,
				phone_number: phone
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

export async function updateUserProfile(userId: string, updates: Partial<Profile> & { phone_number?: string }): Promise<Profile | null> {
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

export async function syncUserProfile(userId: string, email: string, name?: string, phone?: string): Promise<Profile | null> {
	try {
		// First try to get existing profile
		let profile = await getUserProfile(userId);

		if (!profile) {
			// Create new profile if it doesn't exist
			profile = await createUserProfile(userId, email, name, phone);
		} else {
			// Update existing profile with latest data
			profile = await updateUserProfile(userId, { email, name, phone_number: phone });
		}

		return profile;
	} catch (error) {
		console.error('Error syncing user profile:', error);
		return null;
	}
}

// User Preferences
export interface UserPreferences {
	user_id: string;
	show_phone_on_claim: boolean;
	show_email_on_claim: boolean;
	created_at?: string;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
	try {
		const { data, error } = await supabase
			.from('user_preferences')
			.select('*')
			.eq('user_id', userId)
			.single();
		if (error) {
			if (error.code === 'PGRST116') return null; // Not found
			console.error('Error fetching user preferences:', error);
			return null;
		}
		return data;
	} catch (error) {
		console.error('Error fetching user preferences:', error);
		return null;
	}
}

export async function upsertUserPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences | null> {
	try {
		const { data, error } = await supabase
			.from('user_preferences')
			.upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' })
			.select()
			.single();
		if (error) {
			console.error('Error upserting user preferences:', error);
			return null;
		}
		return data;
	} catch (error) {
		console.error('Error upserting user preferences:', error);
		return null;
	}
} 