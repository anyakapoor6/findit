import ListingCard from '../../components/ListingCard';
import { fetchListingsByStatus } from '../../lib/listings';
import type { Listing } from '../../lib/types';

async function getLostListings(): Promise<Listing[]> {
	try {
		return await fetchListingsByStatus('lost');
	} catch (error) {
		console.error('Error fetching lost listings:', error);
		return [];
	}
}

export default async function LostPage() {
	const listings = await getLostListings();

	return (
		<section className="space-y-8">
			<div className="text-center">
				<h1 className="text-4xl font-bold mb-4 text-red-600">Lost Items</h1>
				<p className="text-lg text-gray-700 mb-8 max-w-xl mx-auto">
					Browse items that have been reported as lost. Help reunite people with their belongings.
				</p>
			</div>

			<div>
				<h2 className="text-2xl font-semibold mb-6">Recent Lost Items</h2>
				{listings.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{listings.map((listing) => (
							<ListingCard key={listing.id} listing={listing} />
						))}
					</div>
				) : (
					<div className="text-center py-12 bg-white rounded-lg border">
						<p className="text-gray-500 text-lg">No lost items reported yet.</p>
					</div>
				)}
			</div>
		</section>
	);
} 