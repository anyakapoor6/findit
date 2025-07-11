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
import { supabase } from '../../utils/supabaseClient';

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

const TabButton = styled.button`
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 0.5rem 0.5rem 0 0;
  background: #f1f5f9;
  color: #2563eb;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  margin-right: 0.5rem;
  border-bottom: 2px solid transparent;
  &.active {
    background: #fff;
    color: #111;
    border-bottom: 2px solid #2563eb;
  }
`;
const ClaimsSection = styled.div`
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid #dbeafe;
  color: #111;
`;
const ClaimCard = styled.div`
  border: 1.5px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.2rem 1rem;
  margin-bottom: 1.2rem;
  background: #f9fafb;
  color: #111;
`;
const ClaimStatus = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.3rem 1rem;
  border-radius: 999px;
  font-size: 0.98rem;
  font-weight: 700;
  margin-left: 0.5rem;
  background: ${({ $status }) => $status === 'pending' ? '#fef9c3' : $status === 'accepted' ? '#bbf7d0' : '#fee2e2'};
  color: ${({ $status }) => $status === 'pending' ? '#b45309' : $status === 'accepted' ? '#166534' : '#b91c1c'};
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
	const [activeTab, setActiveTab] = useState<'profile' | 'claims'>('profile');
	const [myClaims, setMyClaims] = useState<any[]>([]);
	const [claimsLoading, setClaimsLoading] = useState(false);

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

	// Fetch claims on my listings
	useEffect(() => {
		async function fetchClaims() {
			if (!user) return;
			setClaimsLoading(true);
			// Get all listings owned by user
			const { data: listings } = await supabase
				.from('listings')
				.select('id, title')
				.eq('user_id', user.id);
			if (!listings || listings.length === 0) {
				setMyClaims([]);
				setClaimsLoading(false);
				return;
			}
			const listingIds = listings.map((l: any) => l.id);
			// Get all claims for those listings
			const { data: claims } = await supabase
				.from('claims')
				.select('*, claimant:claimant_id(name, email)')
				.in('listing_id', listingIds)
				.order('created_at', { ascending: false });
			// Attach listing title
			const claimsWithTitle = (claims || []).map((c: any) => ({
				...c,
				listingTitle: listings.find((l: any) => l.id === c.listing_id)?.title || 'Listing',
			}));
			setMyClaims(claimsWithTitle);
			setClaimsLoading(false);
		}
		if (activeTab === 'claims') fetchClaims();
	}, [activeTab, user]);

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

	// Accept/Reject claim
	const handleClaimAction = async (claim: any, action: 'accepted' | 'rejected') => {
		await supabase.from('claims').update({ status: action }).eq('id', claim.id);
		// Notify claimant
		await supabase.from('notifications').insert({
			user_id: claim.claimant_id,
			type: action === 'accepted' ? 'claim_accepted' : 'claim_rejected',
			message: action === 'accepted'
				? 'Your claim was accepted! The owner will contact you soon.'
				: 'Your claim was rejected by the item finder.',
			listing_id: claim.listing_id,
			claim_id: claim.id,
		});
		setMyClaims((prev) => prev.map(c => c.id === claim.id ? { ...c, status: action } : c));
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
			{/* Tabs */}
			<div style={{ display: 'flex', marginBottom: '2rem' }}>
				<TabButton className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile</TabButton>
				<TabButton className={activeTab === 'claims' ? 'active' : ''} onClick={() => setActiveTab('claims')}>Claims on My Listings</TabButton>
			</div>
			{/* Profile Tab */}
			{activeTab === 'profile' && (
				<>
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
				</>
			)}
			{/* Claims Tab */}
			{activeTab === 'claims' && (
				<ClaimsSection>
					<h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 18 }}>Claims on My Listings</h2>
					{claimsLoading ? (
						<div style={{ color: '#888', padding: '2rem', textAlign: 'center' }}>Loading claims...</div>
					) : myClaims.length === 0 ? (
						<div style={{ color: '#888', padding: '2rem', textAlign: 'center' }}>No claims yet.</div>
					) : myClaims.map(claim => (
						<ClaimCard key={claim.id}>
							<div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
								<span style={{ fontWeight: 600, fontSize: '1.08rem' }}>{claim.listingTitle}</span>
								<ClaimStatus $status={claim.status}>{claim.status.toUpperCase()}</ClaimStatus>
							</div>
							<div style={{ fontSize: '0.98rem', marginBottom: 6 }}><b>Claimant:</b> {claim.claimant?.name || claim.claimant?.email || 'Unknown'}</div>
							<div style={{ fontSize: '0.98rem', marginBottom: 6 }}><b>Features/Marks:</b> {claim.description}</div>
							<div style={{ fontSize: '0.98rem', marginBottom: 6 }}><b>Where lost:</b> {claim.where_lost}</div>
							{claim.contents && <div style={{ fontSize: '0.98rem', marginBottom: 6 }}><b>Contents:</b> {claim.contents}</div>}
							{claim.proof_image_url && <div style={{ margin: '0.7rem 0' }}><img src={claim.proof_image_url} alt="Proof" style={{ maxWidth: 120, borderRadius: 8 }} /></div>}
							{claim.status === 'accepted' && (
								<div style={{ color: '#059669', fontWeight: 600, margin: '0.7rem 0' }}>
									Claimant contact: {claim.claimant?.email}
								</div>
							)}
							{claim.status === 'pending' && (
								<div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
									<button onClick={() => handleClaimAction(claim, 'accepted')} style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.2rem', fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer' }}>Accept</button>
									<button onClick={() => handleClaimAction(claim, 'rejected')} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.2rem', fontWeight: 600, fontSize: '1.05rem', cursor: 'pointer' }}>Reject</button>
								</div>
							)}
						</ClaimCard>
					))}
				</ClaimsSection>
			)}
		</Container>
	);
} 