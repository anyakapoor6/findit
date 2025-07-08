import { supabase } from '../utils/supabaseClient';
import type { User, AuthState } from './types';

// Sign up with email and password
export async function signUp(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
	});

	if (error) {
		return { user: null, error: error.message };
	}

	return {
		user: data.user ? {
			id: data.user.id,
			email: data.user.email!,
			created_at: data.user.created_at
		} : null,
		error: null
	};
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		return { user: null, error: error.message };
	}

	return {
		user: data.user ? {
			id: data.user.id,
			email: data.user.email!,
			created_at: data.user.created_at
		} : null,
		error: null
	};
}

// Sign out
export async function signOut(): Promise<{ error: string | null }> {
	const { error } = await supabase.auth.signOut();
	return { error: error?.message || null };
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
	const { data: { user } } = await supabase.auth.getUser();

	if (!user) return null;

	return {
		id: user.id,
		email: user.email!,
		created_at: user.created_at
	};
}

// Listen to auth state changes
export function onAuthStateChange(callback: (authState: AuthState) => void) {
	return supabase.auth.onAuthStateChange(async (event, session) => {
		if (event === 'SIGNED_IN' && session?.user) {
			callback({
				user: {
					id: session.user.id,
					email: session.user.email!,
					created_at: session.user.created_at
				},
				loading: false
			});
		} else if (event === 'SIGNED_OUT') {
			callback({
				user: null,
				loading: false
			});
		} else {
			callback({
				user: null,
				loading: true
			});
		}
	});
} 