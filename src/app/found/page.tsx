import ListingCard from '../../components/ListingCard';
import { fetchListingsByStatus } from '../../lib/listings';
import type { Listing } from '../../lib/types';

async function getFoundListings(): Promise<Listing[]> {
	try {
		return await fetchListingsByStatus('found');
	} catch (error) {
		console.error('Error fetching found listings:', error);
		return [];
	}
}

export default async function FoundPage() {
	const listings = await getFoundListings();

	return (
		<section className="space-y-8">
			<div className="text-center">
				<h1 className="text-4xl font-bold mb-4 text-green-600">Found Items</h1>
				<p className="text-lg text-gray-700 mb-8 max-w-xl mx-auto">
					Browse items that have been found. Help reunite found items with their owners.
				</p>
			</div>

			<div>
				<h2 className="text-2xl font-semibold mb-6">Recent Found Items</h2>
				{listings.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{listings.map((listing) => (
							<ListingCard key={listing.id} listing={listing} />
						))}
					</div>
				) : (
					<div className="text-center py-12 bg-white rounded-lg border">
						<p className="text-gray-500 text-lg">No found items reported yet.</p>
					</div>
				)}
			</div>
		</section>
	);
} 