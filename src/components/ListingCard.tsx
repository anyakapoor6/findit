import type { Listing } from '../lib/types';

interface ListingCardProps {
	listing: Listing;
	onView?: (listing: Listing) => void;
	onEdit?: (listing: Listing) => void;
	onDelete?: (listing: Listing) => void;
	showActions?: boolean;
}

export default function ListingCard({
	listing,
	onView,
	onEdit,
	onDelete,
	showActions = false
}: ListingCardProps) {
	const isLost = listing.status === 'lost';
	const cardColor = isLost ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
	const statusColor = isLost
		? 'bg-red-200 text-red-800 border border-red-300'
		: 'bg-green-200 text-green-800 border border-green-300';

	return (
		<div className={`rounded-2xl shadow-lg border p-6 hover:shadow-xl hover:scale-[1.04] transition-transform max-w-[17rem] mx-auto flex flex-col ${cardColor} animate-fade-in`}>
			{listing.image_url && (
				<div className="mb-4 flex justify-center">
					<div className="w-full max-w-[11rem] h-28 sm:h-32 overflow-hidden rounded-lg border shadow-sm">
						<img
							src={listing.image_url}
							alt={listing.title}
							className="w-full h-full object-cover"
						/>
					</div>
				</div>
			)}
			<div className="flex items-center justify-between mb-2">
				<h3 className="text-lg font-bold text-gray-900 truncate" title={listing.title}>{listing.title}</h3>
				<span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${statusColor}`}>{listing.status}</span>
			</div>
			<p className="text-gray-700 text-sm mb-3 line-clamp-3 min-h-[2.5em]">{listing.description}</p>
			<div className="space-y-1 text-xs text-gray-600 mb-2">
				<div className="flex items-center gap-1">
					<span className="font-medium">Location:</span>
					<span className="truncate" title={listing.location}>{listing.location}</span>
				</div>
				<div className="flex items-center gap-1">
					<span className="font-medium">Date:</span>
					<span>{new Date(listing.date).toLocaleDateString()}</span>
				</div>
			</div>
			{showActions && (
				<div className="flex gap-2 pt-4 border-t mt-auto">
					{onView && (
						<button
							onClick={() => onView(listing)}
							className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
						>
							View Details
						</button>
					)}
					{onEdit && (
						<button
							onClick={() => onEdit(listing)}
							className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
						>
							Edit
						</button>
					)}
					{onDelete && (
						<button
							onClick={() => onDelete(listing)}
							className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
						>
							Delete
						</button>
					)}
				</div>
			)}
		</div>
	);
} 