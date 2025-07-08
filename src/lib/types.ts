export type ListingStatus = 'lost' | 'found';

export interface Listing {
	id: string;
	title: string;
	description: string;
	status: ListingStatus;
	location: string;
	date: string; // ISO string
	image_url?: string;
	user_id: string;
	created_at: string;
}

export interface CreateListingData {
	title: string;
	description: string;
	status: ListingStatus;
	location: string;
	date: string;
	image_url?: string;
}

export interface User {
	id: string;
	email: string;
	created_at: string;
}

export interface AuthState {
	user: User | null;
	loading: boolean;
} 