import { createSupabaseClient } from '../utils/supabaseClient';
const supabase = createSupabaseClient();
import type { Match } from './types';
import { NotificationOrchestrator } from './notifications';
import { getUserProfile } from './users';

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

		// After finding matches, trigger notifications for new matches
		await triggerNotificationsForNewMatches(listingId);

		return true;
	} catch (error) {
		console.error('Error triggering match finding:', error);
		return false;
	}
}

// Function to trigger notifications for new matches
async function triggerNotificationsForNewMatches(listingId: string): Promise<void> {
	try {
		// Get the new matches that were just created
		const { data: newMatches, error } = await supabase
			.from('matches')
			.select(`
				id,
				listing_id,
				matched_listing_id,
				score,
				match_reasons,
				created_at,
				listing:listings!listing_id(
					title,
					status,
					item_type,
					item_subtype,
					location,
					created_at,
					image_url,
					description,
					extra_details,
					user_id
				),
				matched_listing:listings!matched_listing_id(
					title,
					status,
					item_type,
					item_subtype,
					location,
					created_at,
					image_url,
					description,
					extra_details,
					user_id
				)
			`)
			.eq('listing_id', listingId)
			.gte('created_at', new Date(Date.now() - 60000).toISOString()) // Matches created in the last minute
			.order('score', { ascending: false });

		if (error) {
			console.error('Error fetching new matches:', error);
			return;
		}

		// Send notifications for each new match
		for (const matchData of (newMatches as any[]) || []) {
			const match: Match = {
				match_id: matchData.id,
				listing_id: matchData.listing_id,
				listing_title: matchData.listing.title,
				listing_status: matchData.listing.status,
				listing_category: matchData.listing.item_type,
				listing_subcategory: matchData.listing.item_subtype,
				listing_location: matchData.listing.location,
				listing_created_at: matchData.listing.created_at,
				listing_image_url: matchData.listing.image_url,
				listing_description: matchData.listing.description,
				listing_extra_details: matchData.listing.extra_details,
				listing_user_id: matchData.listing.user_id,
				matched_listing_id: matchData.matched_listing_id,
				matched_listing_title: matchData.matched_listing.title,
				matched_listing_status: matchData.matched_listing.status,
				matched_listing_category: matchData.matched_listing.item_type,
				matched_listing_subcategory: matchData.matched_listing.item_subtype,
				matched_listing_location: matchData.matched_listing.location,
				matched_listing_created_at: matchData.matched_listing.created_at,
				matched_listing_image_url: matchData.matched_listing.image_url,
				matched_listing_description: matchData.matched_listing.description,
				matched_listing_extra_details: matchData.matched_listing.extra_details,
				matched_listing_user_id: matchData.matched_listing.user_id,
				score: matchData.score,
				match_reasons: matchData.match_reasons || []
			};

			await notifyUsersOfMatch(match);
		}
	} catch (error) {
		console.error('Error triggering notifications for new matches:', error);
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
export async function notifyUsersOfMatch(match: Match) {
	try {
		// Get user preferences for both users
		const user1Profile = await getUserProfile(match.listing_user_id);
		const user2Profile = await getUserProfile(match.matched_listing_user_id);

		// Default preferences if profiles don't exist
		const user1Prefs = {
			email: user1Profile?.email,
			phone: user1Profile?.phone_number,
			webNotifications: user1Profile?.notify_matches ?? true,
			emailNotifications: user1Profile?.notify_matches ?? false,
			smsNotifications: false // Default to false for SMS
		};

		const user2Prefs = {
			email: user2Profile?.email,
			phone: user2Profile?.phone_number,
			webNotifications: user2Profile?.notify_matches ?? true,
			emailNotifications: user2Profile?.notify_matches ?? false,
			smsNotifications: false // Default to false for SMS
		};

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
	} catch (error) {
		console.error('Error notifying users of match:', error);
	}
} 