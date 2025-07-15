import FoundPageClient from '../../components/FoundPageClient';
import { fetchListingsByStatus } from '../../lib/listings';
import type { Listing } from '../../lib/types';

export default async function FoundPage() {
	let listings: Listing[] = [];
	try {
		listings = await fetchListingsByStatus('found');
	} catch (error) {
		console.error('Error fetching found listings:', error);
	}
	return <FoundPageClient listings={listings} />;
} 