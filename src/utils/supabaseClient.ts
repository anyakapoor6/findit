// utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient() {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error(
			'Supabase environment variables are missing. ' +
			'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
		);
	}

	return createClient(supabaseUrl, supabaseAnonKey);
}
