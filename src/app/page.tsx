"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ListingCard from '../components/ListingCard';
import { fetchListings } from '../lib/listings';
import type { Listing } from '../lib/types';
import LoadingSpinner from '../components/LoadingSpinner';
import styled from 'styled-components';

const Heading = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #111;
`;
const Subheading = styled.p`
  font-size: 1.25rem;
  color: #222;
  margin-bottom: 2rem;
  max-width: 40rem;
  margin-left: auto;
  margin-right: auto;
`;
const FilterBar = styled.div`
  background: rgba(255,255,255,0.95);
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #dbeafe;
  margin-bottom: 1rem;
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;
const FilterInput = styled.input`
  border: 1px solid #bbb;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  width: 100%;
  color: #111;
  font-size: 1rem;
  background: #fff;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px #bfdbfe;
  }
  @media (min-width: 768px) {
    width: 33%;
  }
`;
const FilterSelect = styled.select`
  border: 1px solid #bbb;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  width: 100%;
  color: #111;
  font-size: 1rem;
  background: #fff;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px #bfdbfe;
  }
  @media (min-width: 768px) {
    width: 25%;
  }
`;
const SectionHeading = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #111;
`;

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
    <section style={{ minHeight: '80vh', background: 'linear-gradient(to bottom, #f9fafb, #e0e7ef 30%)', padding: '2rem 0' }}>
      <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1.5rem', display: 'block' }}>
        <div style={{ textAlign: 'center' }}>
          <Heading>Welcome to FindIt</Heading>
          <Subheading>
            FindIt is a cross-platform Lost & Found platform. Report lost or found items, browse listings, and help reunite people with their belongings.
          </Subheading>
        </div>
        {/* Search & Filter UI */}
        <FilterBar>
          <FilterInput
            type="text"
            placeholder="Search by keyword..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <FilterSelect
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </FilterSelect>
          <FilterInput
            type="text"
            placeholder="Filter by location..."
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </FilterBar>
        <hr style={{ borderColor: '#dbeafe', marginBottom: '2rem' }} />
        <div>
          <SectionHeading>Recent Listings</SectionHeading>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <LoadingSpinner size="md" text="Loading listings..." />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', background: '#fff', borderRadius: '0.5rem', border: '1px solid #eee' }}>
              <p style={{ color: '#dc2626', fontSize: '1.125rem', marginBottom: '1rem' }}>{error}</p>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-center">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="animate-fade-in">
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0', background: '#fff', borderRadius: '0.5rem', border: '1px solid #eee' }}>
              <p style={{ color: '#666', fontSize: '1.125rem', marginBottom: '1rem' }}>No listings match your search.</p>
              <Link
                href="/create-listing"
                style={{ display: 'inline-block', background: '#2563eb', color: '#fff', padding: '0.75rem 2rem', borderRadius: '0.375rem', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}
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
