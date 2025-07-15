import LostPageClient from '../../components/LostPageClient';
import { fetchListingsByStatus } from '../../lib/listings';
import type { Listing } from '../../lib/types';

export default async function LostPage() {
	let listings: Listing[] = [];
	try {
		listings = await fetchListingsByStatus('lost');
	} catch (error) {
		console.error('Error fetching lost listings:', error);
	}
	return <LostPageClient listings={listings} />;
} 