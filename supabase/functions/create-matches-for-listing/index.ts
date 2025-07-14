import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function toRad(deg) {
	return deg * Math.PI / 180;
}

serve(async (req) => {
	// Parse the request body
	const { listingId } = await req.json();

	// Get the service role key and URL from environment
	const supabaseUrl = Deno.env.get('SUPABASE_URL');
	const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

	// Create a Supabase client with service role
	const supabase = createClient(supabaseUrl, serviceRoleKey);

	// Call your match-finding logic
	const { error: matchError } = await supabase.rpc('find_matches_for_listing', {
		new_listing_id: listingId
	});

	if (matchError) {
		return new Response(JSON.stringify({ error: matchError.message }), { status: 500 });
	}

	// Fetch the new listing's location
	const { data: newListing, error: listingError } = await supabase
		.from('listings')
		.select('id, location_lat, location_lng')
		.eq('id', listingId)
		.single();
	if (listingError || !newListing || !newListing.location_lat || !newListing.location_lng) {
		return new Response(JSON.stringify({ error: 'Could not get new listing location.' }), { status: 500 });
	}

	// Fetch users within 10 miles who want nearby notifications
	// Haversine formula in SQL (miles)
	const { data: usersNearby, error: usersError } = await supabase.rpc('users_within_radius', {
		lat: newListing.location_lat,
		lng: newListing.location_lng,
		radius: 10
	});
	if (usersError) {
		return new Response(JSON.stringify({ error: usersError.message }), { status: 500 });
	}

	// Prepare notifications for users nearby
	const geoNotifications = (usersNearby || []).map((user: any) => ({
		user_id: user.id,
		type: 'nearby_listing',
		message: 'A new lost/found item was posted near you!',
		listing_id: listingId,
		is_read: false,
	}));

	// Fetch the new matches for this listing, joining to get user IDs
	const { data: matches, error: fetchError } = await supabase
		.from('matches')
		.select(`
      id,
      listing_id,
      matched_listing_id,
      listing:user_id!matches_listing_id_fkey(user_id),
      matched_listing:user_id!matches_matched_listing_id_fkey(user_id)
    `)
		.or(`listing_id.eq.${listingId},matched_listing_id.eq.${listingId}`);

	if (fetchError) {
		return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
	}

	// Prepare notifications for both users in each match
	const matchNotifications = [];
	for (const match of matches) {
		// Notification for the owner of the original listing
		if (match.listing && match.listing.user_id) {
			matchNotifications.push({
				user_id: match.listing.user_id,
				type: 'match_found',
				message: '🎉 We found a match for your listing!',
				listing_id: match.listing_id,
				is_read: false,
			});
		}
		// Notification for the owner of the matched listing
		if (match.matched_listing && match.matched_listing.user_id) {
			matchNotifications.push({
				user_id: match.matched_listing.user_id,
				type: 'match_found',
				message: '🎉 We found a match for your listing!',
				listing_id: match.matched_listing_id,
				is_read: false,
			});
		}
	}

	const notifications = [...geoNotifications, ...matchNotifications];

	if (notifications.length > 0) {
		const { error: notifError } = await supabase
			.from('notifications')
			.insert(notifications);

		if (notifError) {
			return new Response(JSON.stringify({ error: notifError.message }), { status: 500 });
		}
	}

	return new Response(JSON.stringify({ success: true }), { status: 200 });
}); 