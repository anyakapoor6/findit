import { createSupabaseClient } from '../utils/supabaseClient';
const supabase = createSupabaseClient();
import type { Match } from './types';
import { NotificationOrchestrator } from './notifications';

export async function getUserMatches(userId: string): Promise<Match[]> {
	try {
		const { data, error } = await supabase
			.rpc('get_user_matches', { user_id: userId });

		if (error) {
			console.error('Error fetching user matches:', error);
			return [];
		}

		return data || [];
	} catch (error) {
		console.error('Error fetching user matches:', error);
		return [];
	}
}

export async function getMatchesForListing(listingId: string): Promise<Match[]> {
	try {
		const { data, error } = await supabase
			.from('matches')
			.select(`
        id as match_id,
        listing_id,
        matched_listing_id,
        score,
        match_reasons,
        created_at,
        listing:listings!listing_id(
          title as listing_title,
          status as listing_status,
          category as listing_category,
          subcategory as listing_subcategory,
          location as listing_location,
          created_at as listing_created_at,
          image_url as listing_image_url,
          description as listing_description,
          extra_details as listing_extra_details,
          user_id as listing_user_id
        ),
        matched_listing:listings!matched_listing_id(
          title as matched_listing_title,
          status as matched_listing_status,
          category as matched_listing_category,
          subcategory as matched_listing_subcategory,
          location as matched_listing_location,
          created_at as matched_listing_created_at,
          image_url as matched_listing_image_url,
          description as matched_listing_description,
          extra_details as matched_listing_extra_details,
          user_id as matched_listing_user_id
        )
      `)
			.eq('listing_id', listingId)
			.order('score', { ascending: false });

		if (error) {
			console.error('Error fetching matches for listing:', error);
			return [];
		}

		return (data || []).map((match: any) => ({
			match_id: match.match_id,
			listing_id: match.listing_id,
			listing_title: match.listing.listing_title,
			listing_status: match.listing.listing_status,
			listing_category: match.listing.listing_category,
			listing_subcategory: match.listing.listing_subcategory,
			listing_location: match.listing.listing_location,
			listing_created_at: match.listing.listing_created_at,
			listing_image_url: match.listing.listing_image_url,
			listing_description: match.listing.listing_description,
			listing_extra_details: match.listing.listing_extra_details,
			listing_user_id: match.listing.user_id,
			matched_listing_id: match.matched_listing_id,
			matched_listing_title: match.matched_listing.matched_listing_title,
			matched_listing_status: match.matched_listing.matched_listing_status,
			matched_listing_category: match.matched_listing.matched_listing_category,
			matched_listing_subcategory: match.matched_listing.matched_listing_subcategory,
			matched_listing_location: match.matched_listing.matched_listing_location,
			matched_listing_created_at: match.matched_listing.matched_listing_created_at,
			matched_listing_image_url: match.matched_listing.matched_listing_image_url,
			matched_listing_description: match.matched_listing.matched_listing_description,
			matched_listing_extra_details: match.matched_listing.matched_listing_extra_details,
			matched_listing_user_id: match.matched_listing.user_id,
			score: match.score,
			match_reasons: match.match_reasons || []
		}));
	} catch (error) {
		console.error('Error fetching matches for listing:', error);
		return [];
	}
}

export async function deleteMatch(matchId: string): Promise<boolean> {
	try {
		const { error } = await supabase
			.from('matches')
			.delete()
			.eq('id', matchId);

		if (error) {
			console.error('Error deleting match:', error);
			return false;
		}

		return true;
	} catch (error) {
		console.error('Error deleting match:', error);
		return false;
	}
}

// Function to manually trigger match finding for a listing (useful for testing)
export async function triggerMatchFinding(listingId: string): Promise<boolean> {
	try {
		const { error } = await supabase
			.rpc('find_matches_for_listing', { new_listing_id: listingId });

		if (error) {
			console.error('Error triggering match finding:', error);
			return false;
		}

		return true;
	} catch (error) {
		console.error('Error triggering match finding:', error);
		return false;
	}
}

// Function to get match statistics for a user
export async function getMatchStats(userId: string): Promise<{
	totalMatches: number;
	highConfidenceMatches: number;
	recentMatches: number;
}> {
	try {
		const matches = await getUserMatches(userId);

		const now = new Date();
		const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		return {
			totalMatches: matches.length,
			highConfidenceMatches: matches.filter(m => m.score >= 0.6).length,
			recentMatches: matches.filter(m => new Date(m.listing_created_at) >= sevenDaysAgo).length
		};
	} catch (error) {
		console.error('Error getting match stats:', error);
		return {
			totalMatches: 0,
			highConfidenceMatches: 0,
			recentMatches: 0
		};
	}
}

// Call this after a new match is created
export async function notifyUsersOfMatch(match: Match, user1Prefs: any, user2Prefs: any) {
	// Notify the owner of the first listing
	await NotificationOrchestrator.sendMatchNotifications(match, user1Prefs);
	// Notify the owner of the matched listing (swap listing/matched_listing fields for their perspective)
	const swappedMatch = {
		...match,
		listing_id: match.matched_listing_id,
		listing_title: match.matched_listing_title,
		listing_status: match.matched_listing_status,
		listing_category: match.matched_listing_category,
		listing_subcategory: match.matched_listing_subcategory,
		listing_location: match.matched_listing_location,
		listing_created_at: match.matched_listing_created_at,
		listing_user_id: match.matched_listing_user_id,
		matched_listing_id: match.listing_id,
		matched_listing_title: match.listing_title,
		matched_listing_status: match.listing_status,
		matched_listing_category: match.listing_category,
		matched_listing_subcategory: match.listing_subcategory,
		matched_listing_location: match.listing_location,
		matched_listing_created_at: match.listing_created_at,
		matched_listing_user_id: match.listing_user_id,
		score: match.score,
		match_reasons: match.match_reasons,
	};
	await NotificationOrchestrator.sendMatchNotifications(swappedMatch, user2Prefs);
} 