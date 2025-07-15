import HomePageClientWrapper from '../components/HomePageClientWrapper';
import { Suspense } from 'react';
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
  return <HomePageClientWrapper />;
}
