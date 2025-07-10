"use client";
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getCurrentUser, signOut } from '../../lib/auth';
import { fetchListings } from '../../lib/listings';
import type { Listing } from '../../lib/types';
import ListingCard from '../../components/ListingCard';
import { useRouter } from 'next/navigation';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 1rem;
`;
const ProfileBox = styled.div`
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  padding: 2rem 2.5rem;
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;
const Heading = styled.h1`
  font-size: 2.2rem;
  font-weight: 800;
  color: #111;
  margin-bottom: 1.2rem;
`;
const Label = styled.span`
  font-weight: 700;
  color: #222;
  margin-right: 0.5rem;
`;
const Value = styled.span`
  color: #444;
  font-size: 1.1rem;
`;
const ListingsSection = styled.div`
  margin-top: 2.5rem;
`;
const ListingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;
const SignOutButton = styled.button`
  margin-top: 2rem;
  background: #dc2626;
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  border-radius: 0.5rem;
  padding: 0.7rem 2.2rem;
  cursor: pointer;
  transition: background 0.18s;
  &:hover { background: #b91c1c; }
`;

export default function ProfilePage() {
	const [user, setUser] = useState<any>(null);
	const [userListings, setUserListings] = useState<Listing[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const loadUser = async () => {
			const currentUser = await getCurrentUser();
			if (!currentUser) {
				router.push('/auth?redirect=/profile');
				return;
			}
			setUser(currentUser);
			const allListings = await fetchListings();
			setUserListings(allListings.filter(l => l.user_id === currentUser.id));
			setLoading(false);
		};
		loadUser();
	}, [router]);

	const handleSignOut = async () => {
		await signOut();
		router.push('/');
	};

	if (loading) {
		return <Container>Loading profile...</Container>;
	}

	return (
		<Container>
			<ProfileBox>
				<Heading>Profile</Heading>
				<div style={{ marginBottom: '0.7rem' }}>
					<Label>Email:</Label>
					<Value>{user?.email}</Value>
				</div>
				{/* Add more user details here if available */}
				<SignOutButton onClick={handleSignOut}>Sign Out</SignOutButton>
			</ProfileBox>
			<ListingsSection>
				<Heading style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Your Listings</Heading>
				{userListings.length === 0 ? (
					<div style={{ color: '#888', fontSize: '1.1rem' }}>You have not created any listings yet.</div>
				) : (
					<ListingsGrid>
						{userListings.map(listing => (
							<ListingCard key={listing.id} listing={listing} />
						))}
					</ListingsGrid>
				)}
			</ListingsSection>
		</Container>
	);
} 