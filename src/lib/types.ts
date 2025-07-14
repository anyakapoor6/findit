export type ListingStatus = 'lost' | 'found' | 'resolved';

export interface Listing {
	id: string;
	title: string;
	description: string;
	status: ListingStatus;
	location: string;
	location_lat?: number;
	location_lng?: number;
	date: string; // ISO string
	image_url?: string;
	user_id: string;
	created_at: string;
	item_type?: string;
	item_subtype?: string;
	extra_details?: Record<string, string>;
}

export interface CreateListingData {
	title: string;
	description: string;
	status: ListingStatus;
	location: string;
	location_lat?: number;
	location_lng?: number;
	date: string;
	image_url?: string;
	item_type?: string;
	item_subtype?: string;
}

export interface User {
	id: string;
	email: string;
	created_at: string;
}

export interface Profile {
	id: string;
	email: string;
	name?: string;
	created_at: string;
	updated_at: string;
	phone_number?: string;
	notify_nearby?: boolean;
	notify_claims?: boolean;
	notify_matches?: boolean;
	location_address?: string;
	location_lat?: number;
	location_lng?: number;
}

export interface AuthState {
	user: User | null;
	loading: boolean;
}

export interface Match {
	match_id: string;
	listing_id: string;
	listing_title: string;
	listing_status: string;
	listing_category: string;
	listing_subcategory: string;
	listing_location: string;
	listing_created_at: string;
	listing_image_url?: string;
	listing_description?: string;
	listing_extra_details?: Record<string, string>;
	listing_user_id: string;
	matched_listing_id: string;
	matched_listing_title: string;
	matched_listing_status: string;
	matched_listing_category: string;
	matched_listing_subcategory: string;
	matched_listing_location: string;
	matched_listing_created_at: string;
	matched_listing_image_url?: string;
	matched_listing_description?: string;
	matched_listing_extra_details?: Record<string, string>;
	matched_listing_user_id: string;
	score: number;
	match_reasons: string[];
}

export interface MatchNotification {
	id: string;
	user_id: string;
	match_id: string;
	listing_id: string;
	matched_listing_id: string;
	notification_type: 'match_found' | 'match_updated';
	sent_via: 'web' | 'email' | 'sms';
	sent_at: string;
	read_at?: string;
}

export type NotificationType =
	| 'claim'
	| 'match'
	| 'nearby'
	| 'claim_update'
	| 'claim_accepted'
	| 'claim_rejected'
	| 'claim_on_listing'
	| 'claim_submitted'
	| 'contact'; 