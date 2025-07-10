'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { getCurrentUser, signOut } from '../../lib/auth';
import { getUserProfile, updateUserProfile } from '../../lib/users';
import { fetchUserListings } from '../../lib/listings';
import { Profile, Listing, User } from '../../lib/types';
import ListingCard from '../../components/ListingCard';
import SignInModal from '../../components/SignInModal';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  color: #111;
  margin-bottom: 2rem;
  text-align: center;
`;

const ProfileCard = styled.div`
  background: #fff;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  color: #111;
  margin-bottom: 1rem;
`;

// Removed unused Form component

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #111;
  &:focus {
    outline: none;
    border-color: #2563eb;
  }
`;

const Button = styled.button`
  background: #2563eb;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #1d4ed8;
  }
  &:disabled {
    opacity: 0.5;
  }
`;

const SignOutButton = styled(Button)`
  background: #dc2626;
  &:hover {
    background: #b91c1c;
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #111;
`;

const InfoValue = styled.span`
  color: #666;
`;

const Message = styled.p<{ error?: boolean }>`
  margin-top: 1rem;
  text-align: center;
  color: ${({ error }) => (error ? '#dc2626' : '#2563eb')};
  font-size: 1rem;
`;

const ListingsGridWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const ListingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
  min-width: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  font-size: 1.1rem;
  padding: 2rem;
`;

const CreateListingButton = styled(Button)`
  margin-top: 1rem;
  background: #059669;
  &:hover {
    background: #047857;
  }
`;

export default function ProfilePage() {
	const [user, setUser] = useState<User | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [userListings, setUserListings] = useState<Listing[]>([]);
	const [loading, setLoading] = useState(true);
	const [name, setName] = useState('');
	const [message, setMessage] = useState('');
	const [showNamePrompt, setShowNamePrompt] = useState(false);
	const [showSignIn, setShowSignIn] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const checkAuth = async () => {
			const currentUser = await getCurrentUser();
			if (!currentUser) {
				setShowSignIn(true);
				setLoading(false);
				return;
			}
			setUser(currentUser);

			// Get user profile
			const userProfile = await getUserProfile(currentUser.id);
			setProfile(userProfile);
			if (userProfile) {
				setName(userProfile.name || '');
				if (!userProfile.name) setShowNamePrompt(true);
			}

			// Get user's listings
			try {
				const listings = await fetchUserListings(currentUser.id);
				setUserListings(listings);
			} catch (error: unknown) {
				console.error('Error fetching user listings:', error);
			}

			setLoading(false);
		};

		checkAuth();
	}, [router]);

	const handleSetName = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;
		if (!name.trim()) {
			setMessage('Name is required.');
			return;
		}
		setLoading(true);
		setMessage('');
		try {
			const updatedProfile = await updateUserProfile(user.id, { name: name.trim() });
			if (updatedProfile) {
				setProfile(updatedProfile);
				setShowNamePrompt(false);
				setMessage('');
			} else {
				setMessage('Failed to set name. Please try again.');
			}
		} catch {
			setMessage('An error occurred while setting your name.');
		}
		setLoading(false);
	};

	const handleSignOut = async () => {
		await signOut();
		router.push('/');
	};

	const handleCreateListing = () => {
		router.push('/create-listing');
	};

	const handleSignInSuccess = () => {
		setShowSignIn(false);
		setLoading(true);
		// Re-run the auth/profile check
		setTimeout(() => window.location.reload(), 100);
	};

	if (loading) {
		return (
			<Container>
				<Title>Loading...</Title>
			</Container>
		);
	}

	if (showSignIn) {
		return (
			<SignInModal
				open={showSignIn}
				onClose={() => router.push('/')}
				onSignIn={handleSignInSuccess}
			/>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<Container>
			<Title>Profile</Title>
			<ProfileCard>
				<SectionTitle>Account Information</SectionTitle>
				<InfoRow>
					<InfoLabel>Name:</InfoLabel>
					{showNamePrompt ? (
						<form onSubmit={handleSetName} style={{ display: 'flex', width: '100%', gap: '1rem', alignItems: 'center' }}>
							<Input
								type="text"
								placeholder="Full Name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								style={{ flex: 1 }}
								required
							/>
							<Button type="submit" disabled={loading} style={{ minWidth: 120 }}>
								{loading ? 'Saving...' : 'Save'}
							</Button>
						</form>
					) : (
						<InfoValue>{profile?.name || 'Not set'}</InfoValue>
					)}
				</InfoRow>
				<InfoRow>
					<InfoLabel>Email:</InfoLabel>
					<InfoValue>{user.email}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Member Since:</InfoLabel>
					<InfoValue>{new Date(user.created_at).toLocaleDateString()}</InfoValue>
				</InfoRow>
				{message && <Message error={message.includes('Failed') || message.includes('error')}>{message}</Message>}
			</ProfileCard>

			<ProfileCard>
				<SectionTitle>Your Listings ({userListings.length})</SectionTitle>
				{userListings.length === 0 ? (
					<EmptyState>
						<p>You haven&apos;t created any listings yet.</p>
						<CreateListingButton onClick={handleCreateListing}>
							Create Your First Listing
						</CreateListingButton>
					</EmptyState>
				) : (
					<>
						<CreateListingButton onClick={handleCreateListing}>
							Create New Listing
						</CreateListingButton>
						<ListingsGridWrapper>
							<ListingsGrid>
								{userListings.map(listing => (
									<ListingCard key={listing.id} listing={listing} />
								))}
							</ListingsGrid>
						</ListingsGridWrapper>
					</>
				)}
			</ProfileCard>

			<ProfileCard>
				<SectionTitle>Account Actions</SectionTitle>
				<SignOutButton onClick={handleSignOut}>
					Sign Out
				</SignOutButton>
			</ProfileCard>
		</Container>
	);
} 