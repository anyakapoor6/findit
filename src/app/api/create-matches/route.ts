import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
	try {
		const { listingId } = await request.json();

		if (!listingId) {
			return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
		}

		console.log(`🔍 Triggering matching for listing: ${listingId}`);

		// Call the database function to find matches
		const { error } = await supabase
			.rpc('find_matches_for_listing', { new_listing_id: listingId });

		if (error) {
			console.error('❌ Error calling matching function:', error);
			return NextResponse.json({ error: 'Failed to trigger matching' }, { status: 500 });
		}

		console.log(`✅ Matching triggered successfully for listing: ${listingId}`);

		return NextResponse.json({ success: true });

	} catch (error) {
		console.error('❌ Error in create-matches API:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
