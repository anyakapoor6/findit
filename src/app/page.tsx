"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import ListingCard from '../components/ListingCard';
import { fetchListings } from '../lib/listings';
import type { Listing, User } from '../lib/types';
import LoadingSpinner from '../components/LoadingSpinner';
import styled from 'styled-components';
import SignInModal from '../components/SignInModal';
import { getCurrentUser } from '../lib/auth';
import { useRouter, useSearchParams } from 'next/navigation';

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
const ListingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  justify-content: center;
  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const ITEM_TYPES = [
  { value: 'electronics', label: 'Electronics', subtypes: ['Phone', 'Laptop', 'Tablet', 'Headphones', 'Other'] },
  { value: 'bags', label: 'Bags', subtypes: ['Backpack', 'Handbag', 'Suitcase', 'Wallet', 'Other'] },
  { value: 'pets', label: 'Pets', subtypes: ['Breed', 'Color', 'Collar/microchip', 'Size', 'Behavior', 'Other'] },
  { value: 'keys', label: 'Keys', subtypes: ['Car Key', 'House Key', 'Other'] },
  { value: 'jewelry', label: 'Jewelry', subtypes: ['Ring', 'Necklace', 'Watch', 'Other'] },
  { value: 'clothing', label: 'Clothing', subtypes: ['Jacket', 'Shirt', 'Shoes', 'Other'] },
  { value: 'documents', label: 'Documents', subtypes: ['ID', 'Passport', 'Card', 'Other'] },
  { value: 'toys', label: 'Toys', subtypes: ['Action Figure', 'Doll', 'Plushie', 'Other'] },
  { value: 'other', label: 'Other', subtypes: ['Other'] },
];

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const userRef = useRef<User | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync filter state with URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (status !== 'all') params.set('status', status);
    if (location) params.set('location', location);
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (date) params.set('date', date);
    const url = params.toString() ? `/?${params.toString()}` : '/';
    window.history.replaceState(null, '', url);
  }, [search, status, location, category, subcategory, date]);

  // On mount, read filters from URL
  useEffect(() => {
    if (!searchParams) return;
    setSearch(searchParams.get('q') || '');
    setStatus(searchParams.get('status') || 'all');
    setLocation(searchParams.get('location') || '');
    setCategory(searchParams.get('category') || '');
    setSubcategory(searchParams.get('subcategory') || '');
    setDate(searchParams.get('date') || '');
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchListings();
        setListings(data);
      } catch {
        setError('Failed to load listings.');
      } finally {
        setLoading(false);
      }
    };
    loadListings();

    // Listen for listing-deleted event
    const handleListingDeleted = () => {
      loadListings();
    };
    window.addEventListener('listing-deleted', handleListingDeleted);
    return () => {
      window.removeEventListener('listing-deleted', handleListingDeleted);
    };
  }, []);

  useEffect(() => {
    // Check user once on mount
    const checkUser = async () => {
      const user = await getCurrentUser();
      userRef.current = user;
      setUserChecked(true);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!userChecked) return;
    if (userRef.current) return;
    // Only attach scroll listener for non-signed-in users
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowSignIn(true);
        window.removeEventListener('scroll', handleScroll);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [userChecked]);

  const handleSignInSuccess = () => {
    setShowSignIn(false);
    setTimeout(() => window.location.reload(), 100);
  };

  // Filtered listings
  const filteredListings = listings.filter(listing => {
    if (listing.status === 'resolved') return false;
    const matchesKeyword =
      !search ||
      (listing.title && listing.title.toLowerCase().includes(search.toLowerCase())) ||
      (listing.description && listing.description.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus =
      !status || status === 'all' || listing.status === status;
    const matchesLocation =
      !location || (listing.location && listing.location.toLowerCase().includes(location.toLowerCase()));
    const matchesCategory =
      !category || listing.item_type === category;
    const matchesSubcategory =
      !subcategory || listing.item_subtype === subcategory;
    const dbDate = listing.date ? listing.date.slice(0, 10) : '';
    const matchesDate =
      !date || dbDate === date;
    return matchesKeyword && matchesStatus && matchesLocation && matchesCategory && matchesSubcategory && matchesDate;
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
            placeholder="Location..."
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <FilterSelect
            value={category}
            onChange={e => {
              setCategory(e.target.value);
              setSubcategory('');
            }}
          >
            <option value="">All Categories</option>
            {ITEM_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={subcategory}
            onChange={e => setSubcategory(e.target.value)}
            disabled={!category}
          >
            <option value="">All Subcategories</option>
            {ITEM_TYPES.find(t => t.value === category)?.subtypes.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </FilterSelect>
          <FilterInput
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ minWidth: 120 }}
          />
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setStatus('all');
              setLocation('');
              setCategory('');
              setSubcategory('');
              setDate('');
            }}
            style={{
              background: '#f1f5f9',
              color: '#2563eb',
              border: '1px solid #dbeafe',
              borderRadius: '0.5rem',
              padding: '0.5rem 1.2rem',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              marginLeft: 8,
              minWidth: 120
            }}
          >
            Clear Filters
          </button>
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
            <ListingsGrid>
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </ListingsGrid>
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
      <SignInModal
        open={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSignIn={handleSignInSuccess}
      />
    </section>
  );
}
