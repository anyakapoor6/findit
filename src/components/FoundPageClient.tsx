"use client";
import ListingCard from './ListingCard';
import type { Listing } from '../lib/types';
import styled from 'styled-components';

const Heading = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #111;
  text-align: center;
`;
const Subheading = styled.p`
  font-size: 1.25rem;
  color: #222;
  margin-bottom: 2rem;
  max-width: 40rem;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
`;
const SectionHeading = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #111;
`;
const EmptyText = styled.p`
  color: #666;
  font-size: 1.125rem;
`;

export default function FoundPageClient({ listings }: { listings: Listing[] }) {
	return (
		<section style={{ marginBottom: '2rem' }}>
			<div>
				<Heading>Found Items</Heading>
				<Subheading>
					Browse items that have been found. Help reunite found items with their owners.
				</Subheading>
			</div>
			<div>
				<SectionHeading>Recent Found Items</SectionHeading>
				{listings.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{listings.map((listing) => (
							<ListingCard key={listing.id} listing={listing} />
						))}
					</div>
				) : (
					<div style={{ textAlign: 'center', padding: '3rem 0', background: '#fff', borderRadius: '0.5rem', border: '1px solid #eee' }}>
						<EmptyText>No found items reported yet.</EmptyText>
					</div>
				)}
			</div>
		</section>
	);
} 