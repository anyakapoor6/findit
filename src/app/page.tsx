"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ListingCard from '../components/ListingCard';
import { fetchListings } from '../lib/listings';
import type { Listing } from '../lib/types';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchListings();
        setListings(data);
      } catch (err: any) {
        setError('Failed to load listings.');
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, []);

  // Filtered listings
  const filteredListings = listings.filter(listing => {
    const matchesKeyword =
      search === '' ||
      listing.title.toLowerCase().includes(search.toLowerCase()) ||
      listing.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      status === 'all' || listing.status === status;
    const matchesLocation =
      location === '' || listing.location.toLowerCase().includes(location.toLowerCase());
    return matchesKeyword && matchesStatus && matchesLocation;
  });

  return (
    <section className="min-h-[80vh] bg-gradient-to-b from-gray-50 to-blue-50/30 py-8">
      <div className="max-w-4xl mx-auto px-2 sm:px-6 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-blue-600">Welcome to FindIt</h1>
          <p className="text-lg text-gray-700 mb-8 max-w-xl mx-auto">
            FindIt is a cross-platform Lost & Found platform. Report lost or found items, browse listings, and help reunite people with their belongings.
          </p>
        </div>

        {/* Search & Filter UI */}
        <div className="bg-white/90 rounded-xl shadow-md p-4 flex flex-col md:flex-row gap-4 items-center justify-between border border-blue-100">
          <input
            type="text"
            placeholder="Search by keyword..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-1/3 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-1/4 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
          <input
            type="text"
            placeholder="Filter by location..."
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-1/3 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-6">Recent Listings</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" text="Loading listings..." />
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-red-500 text-lg mb-4">{error}</p>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border">
              <p className="text-gray-500 text-lg mb-4">No listings match your search.</p>
              <Link
                href="/create-listing"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Your First Listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
