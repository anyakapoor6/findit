import Link from 'next/link';

export default function Navbar() {
	return (
		<nav className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b shadow-sm">
			<div className="max-w-5xl mx-auto px-2 sm:px-6 py-3 flex items-center justify-between">
				<Link href="/" className="text-2xl font-bold text-blue-600 tracking-tight">FindIt</Link>
				<div className="flex gap-2 sm:gap-4 items-center">
					<Link href="/" className="px-3 py-2 rounded-md hover:bg-blue-50 transition-colors">Home</Link>
					<Link href="/lost" className="px-3 py-2 rounded-md hover:bg-blue-50 transition-colors">Lost</Link>
					<Link href="/found" className="px-3 py-2 rounded-md hover:bg-blue-50 transition-colors">Found</Link>
					<Link href="/create-listing" className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold shadow hover:bg-blue-700 transition-colors">Create Listing</Link>
					<Link href="/auth" className="px-3 py-2 rounded-md hover:bg-blue-50 transition-colors">Sign In</Link>
				</div>
			</div>
		</nav>
	);
} 