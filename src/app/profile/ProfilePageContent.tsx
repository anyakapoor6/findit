'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styled from 'styled-components';
import { getCurrentUser, signOut } from '../../lib/auth';
import { getUserProfile, updateUserProfile, getUserPreferences, upsertUserPreferences, UserPreferences } from '../../lib/users';
import { fetchUserListings } from '../../lib/listings';
import { Profile, Listing, User, NotificationType } from '../../lib/types';
import ListingCard from '../../components/ListingCard';
import SignInModal from '../../components/SignInModal';
import { createSupabaseClient } from '../../utils/supabaseClient';
import EditListingModal from '../../components/EditListingModal';
import LocationPicker from '../../components/LocationPicker';
import { sendEmailNotification } from '../../lib/notifications';
import NotificationPreferences from '../../components/NotificationPreferences';
import NotificationHistory from '../../components/NotificationHistory';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
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

const TabBar = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: nowrap;
  overflow-x: auto;
  gap: 0.5rem;
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

const ToggleSwitch = styled.label<{ $checked?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  cursor: pointer;
  font-size: 1.08rem;
  font-weight: 500;
  margin-bottom: 0.7rem;
  color: ${({ $checked }) => $checked ? '#111' : '#888'};
  input {
    accent-color: #2563eb;
    width: 1.3em;
    height: 1.3em;
  }
`;

const Warning = styled.div`
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 0.7rem 1rem;
  margin-bottom: 1rem;
  font-size: 1.01rem;
`;

export default function ProfilePageContent() {
	const [user, setUser] = useState<User | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [userListings, setUserListings] = useState<Listing[]>([]);
	const [loading, setLoading] = useState(true);
	const [name, setName] = useState('');
	const [message, setMessage] = useState('');
	const [showNamePrompt, setShowNamePrompt] = useState(false);
	const [showSignIn, setShowSignIn] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();
	const tabOptions = [
		{ key: 'profile', label: 'Profile' },
		{ key: 'userClaims', label: 'Claims' },
		{ key: 'claims', label: 'Claims on My Listings' },
	] as const;
	type TabKey = typeof tabOptions[number]['key'];
	const [activeTab, setActiveTab] = useState<TabKey>(() => {
		const tab = searchParams?.get('tab');
		if (tabOptions.some(t => t.key === tab)) return tab as TabKey;
		return 'profile';
	});
	useEffect(() => {
		const tab = searchParams?.get('tab');
		if (tabOptions.some(t => t.key === tab)) setActiveTab(tab as TabKey);
		// eslint-disable-next-line
	}, [searchParams]);
	const [myClaims, setMyClaims] = useState<any[]>([]);
	const [claimsLoading, setClaimsLoading] = useState(false);
	const [phone, setPhone] = useState('');
	const [editingPhone, setEditingPhone] = useState(false);
	const [editingName, setEditingName] = useState(false);
	const [editingEmail, setEditingEmail] = useState(false);
	const [email, setEmail] = useState('');
	const [editingListing, setEditingListing] = useState<Listing | null>(null);
	const [mounted, setMounted] = useState(false);
	const [finderProfiles, setFinderProfiles] = useState<Record<string, any>>({});
	const [prefs, setPrefs] = useState<UserPreferences | null>(null);
	const [prefsLoading, setPrefsLoading] = useState(true);
	const [prefsError, setPrefsError] = useState('');
	const [notifyNearby, setNotifyNearby] = useState(true);
	const [notifyClaims, setNotifyClaims] = useState(true);
	const [notifyMatches, setNotifyMatches] = useState(true);
	const [locationData, setLocationData] = useState<{ address: string; lat: number | undefined; lng: number | undefined }>({ address: '', lat: undefined, lng: undefined });
	const [savingPrefs, setSavingPrefs] = useState(false);
	const supabase = createSupabaseClient();
	const fetchFinderProfile = useCallback(async (userId: string) => {
		if (finderProfiles[userId]) return finderProfiles[userId];
		const profile = await getUserProfile(userId);
		setFinderProfiles(prev => ({ ...prev, [userId]: profile }));
		return profile;
	}, [finderProfiles]);
	useEffect(() => { setMounted(true); }, []);

	useEffect(() => {
		// MOVED: Early return logic inside the effect to avoid breaking hooks order
		if (user) {
			setPrefsLoading(true);
			getUserPreferences(user.id).then((data) => {
				setPrefs(data || {
					user_id: user.id,
					show_phone_on_claim: true,
					show_email_on_claim: true,
				});
				setPrefsLoading(false);
			}).catch(() => {
				setPrefsError('Could not load contact preferences.');
				setPrefsLoading(false);
			});
		}
	}, [user]);

	useEffect(() => {
		if (profile) {
			setNotifyNearby(profile.notify_nearby !== false); // default true
			setNotifyClaims(profile.notify_claims !== false); // default true
			setNotifyMatches(profile.notify_matches !== false); // default true
			setLocationData({
				address: profile.location_address || '',
				lat: profile.location_lat,
				lng: profile.location_lng,
			});
		}
	}, [profile]);

	const handleEditListing = (listing: Listing) => {
		setEditingListing(listing);
	};

	const handleListingDeleted = async (deletedId: string) => {
		setEditingListing(null);
		// Refetch listings from backend to ensure sync
		if (user) {
			const listings = await fetchUserListings(user.id);
			setUserListings(listings);
		} else {
			setUserListings(userListings.filter(listing => listing.id !== deletedId));
		}
		window.dispatchEvent(new CustomEvent('listing-deleted', { detail: { id: deletedId } }));
	};

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
				setPhone(userProfile.phone_number || '');
				setEmail(user?.email || '');
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
			// MOVED: Early return logic inside the effect to avoid breaking hooks order
			if (user && activeTab === 'claims') {
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
		}
		fetchClaims();
	}, [activeTab, user]);

	// Add state for user claims
	const [userClaims, setUserClaims] = useState<any[]>([]);
	const [userClaimsLoading, setUserClaimsLoading] = useState(false);

	// Fetch claims made by the user
	useEffect(() => {
		async function fetchUserClaims() {
			// MOVED: Early return logic inside the effect to avoid breaking hooks order
			if (user && activeTab === 'userClaims') {
				setUserClaimsLoading(true);
				// Get all claims where the user is the claimant
				const { data: claims, error } = await supabase
					.from('claims')
					.select('*, listing:listings(*)')
					.eq('claimant_id', user.id)
					.order('created_at', { ascending: false });
				if (!error && claims) {
					setUserClaims(claims);
				} else {
					setUserClaims([]);
				}
				setUserClaimsLoading(false);
			}
		}
		fetchUserClaims();
	}, [activeTab, user]);

	useEffect(() => {
		if (activeTab === 'userClaims' && userClaims.length > 0) {
			userClaims.forEach(claim => {
				if (claim.listing?.user_id && !finderProfiles[claim.listing.user_id]) {
					fetchFinderProfile(claim.listing.user_id);
				}
			});
		}
	}, [activeTab, userClaims, finderProfiles, fetchFinderProfile]);

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
				setEditingName(false);
				setMessage('');
			} else {
				setMessage('Failed to set name. Please try again.');
			}
		} catch {
			setMessage('An error occurred while setting your name.');
		}
		setLoading(false);
	};

	const handleUpdateName = async (e: React.FormEvent) => {
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
				setEditingName(false);
				setMessage('');
				// Update user state to reflect the new name
				setUser(prevUser => prevUser ? { ...prevUser } : null);
			} else {
				setMessage('Failed to update name. Please try again.');
			}
		} catch {
			setMessage('An error occurred while updating your name.');
		}
		setLoading(false);
	};

	const handleUpdateEmail = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) return;
		if (!email.trim()) {
			setMessage('Email is required.');
			return;
		}
		setLoading(true);
		setMessage('');
		try {
			// Update email in Supabase auth
			const { error: authError } = await supabase.auth.updateUser({ email: email.trim() });
			if (authError) {
				setMessage('Failed to update email. Please try again.');
				setLoading(false);
				return;
			}

			// Update email in users table
			const updatedProfile = await updateUserProfile(user.id, { email: email.trim() });
			if (updatedProfile) {
				setProfile(updatedProfile);
				// Update the user state to reflect the new email
				setUser(prevUser => prevUser ? { ...prevUser, email: email.trim() } : null);
				setEditingEmail(false);
				setMessage('Email updated successfully! Please check your email to confirm the change.');
			} else {
				setMessage('Failed to update email in profile. Please try again.');
			}
		} catch {
			setMessage('An error occurred while updating your email.');
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
		// Send email notification to claimant
		const notificationType: NotificationType = action === 'accepted' ? 'claim_accepted' : 'claim_rejected';
		await sendEmailNotification({
			user_id: claim.claimant_id,
			type: notificationType,
			message: action === 'accepted'
				? `Your claim for "${claim.listingTitle}" was accepted! The owner will contact you soon.`
				: `Your claim for "${claim.listingTitle}" was rejected by the item finder.`,
			listing_title: claim.listingTitle,
			claim_status: action,
		});
		setMyClaims((prev) => prev.map(c => c.id === claim.id ? { ...c, status: action } : c));
	};

	const handleListingUpdated = async (updatedListing: Listing) => {
		setEditingListing(null);
		const updatedUserListings = userListings.map(listing =>
			listing.id === updatedListing.id ? updatedListing : listing
		);
		setUserListings(updatedUserListings);
		// Optionally, update the profile object if needed
		setProfile(prev => prev ? { ...prev, listings: updatedUserListings } : null);
	};

	const handleTogglePref = async (key: 'show_phone_on_claim' | 'show_email_on_claim', value: boolean) => {
		if (!prefs) return;
		// Enforce at least one enabled
		if (!value && !prefs[(key === 'show_phone_on_claim' ? 'show_email_on_claim' : 'show_phone_on_claim')]) {
			setPrefsError('At least one contact method must be enabled so people can reach you when claims are accepted.');
			return;
		}
		setPrefsError('');
		const newPrefs = { ...prefs, [key]: value };
		setPrefs(newPrefs);
		await upsertUserPreferences(prefs.user_id, newPrefs);
	};

	const handleStatusChange = async () => {
		if (user) {
			const listings = await fetchUserListings(user.id);
			setUserListings(listings);
		}
	};

	const handleSaveLocationPrefs = async () => {
		setSavingPrefs(true);
		const updates: any = {
			id: user?.id,
			notify_nearby: notifyNearby,
			notify_claims: notifyClaims,
			notify_matches: notifyMatches,
			location_lat: locationData.lat,
			location_lng: locationData.lng,
			location_address: locationData.address,
		};
		const { error } = await supabase.from('users').update(updates).eq('id', user?.id);
		setSavingPrefs(false);
		if (!error) setMessage('Preferences updated!');
		else setMessage('Failed to update preferences.');
	};

	if (loading && mounted) {
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
			<TabBar>
				{tabOptions.map(tab => (
					<TabButton
						key={tab.key}
						className={activeTab === tab.key ? 'active' : ''}
						onClick={() => setActiveTab(tab.key)}
					>
						{tab.label}
					</TabButton>
				))}
			</TabBar>
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
							) : editingName ? (
								<form onSubmit={handleUpdateName} style={{ display: 'flex', width: '100%', gap: '1rem', alignItems: 'center' }}>
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
									<Button type="button" onClick={() => { setEditingName(false); setName(profile?.name || ''); }} style={{ background: '#f1f5f9', color: '#2563eb', minWidth: 80 }}>Cancel</Button>
								</form>
							) : (
								<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
									<InfoValue>{profile?.name || <span style={{ color: '#bbb' }}>Not set</span>}</InfoValue>
									<Button type="button" onClick={() => setEditingName(true)} style={{ background: '#f1f5f9', color: '#2563eb', minWidth: 80, fontWeight: 500, fontSize: '0.98rem', padding: '0.4rem 1rem' }}>
										{profile?.name ? 'Edit' : 'Add'}
									</Button>
								</div>
							)}
						</InfoRow>
						<InfoRow>
							<InfoLabel>Email:</InfoLabel>
							{editingEmail ? (
								<form onSubmit={handleUpdateEmail} style={{ display: 'flex', width: '100%', gap: '1rem', alignItems: 'center' }}>
									<Input
										type="email"
										placeholder="Email Address"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										style={{ flex: 1 }}
										required
									/>
									<Button type="submit" disabled={loading} style={{ minWidth: 120 }}>
										{loading ? 'Saving...' : 'Save'}
									</Button>
									<Button type="button" onClick={() => { setEditingEmail(false); setEmail(user?.email || ''); }} style={{ background: '#f1f5f9', color: '#2563eb', minWidth: 80 }}>Cancel</Button>
								</form>
							) : (
								<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
									<InfoValue>{user?.email}</InfoValue>
									<Button type="button" onClick={() => setEditingEmail(true)} style={{ background: '#f1f5f9', color: '#2563eb', minWidth: 80, fontWeight: 500, fontSize: '0.98rem', padding: '0.4rem 1rem' }}>
										Edit
									</Button>
								</div>
							)}
						</InfoRow>
						<InfoRow>
							<InfoLabel>Phone:</InfoLabel>
							{editingPhone ? (
								<form
									onSubmit={async e => {
										e.preventDefault();
										setLoading(true);
										setMessage('');
										const updated = await updateUserProfile(user.id, { phone_number: phone });
										if (updated) {
											setProfile(updated);
											setEditingPhone(false);
											setMessage('');
										} else {
											setMessage('Failed to update phone number.');
										}
										setLoading(false);
									}}
									style={{ display: 'flex', width: '100%', gap: '1rem', alignItems: 'center' }}
								>
									<Input
										type="tel"
										placeholder="Phone Number"
										value={phone}
										onChange={e => setPhone(e.target.value)}
										pattern="[0-9+\-() ]*"
										maxLength={20}
										style={{ flex: 1 }}
									/>
									<Button type="submit" disabled={loading} style={{ minWidth: 120 }}>
										{loading ? 'Saving...' : 'Save'}
									</Button>
									<Button type="button" onClick={() => { setEditingPhone(false); setPhone(profile?.phone_number || ''); }} style={{ background: '#f1f5f9', color: '#2563eb', minWidth: 80 }}>Cancel</Button>
								</form>
							) : (
								<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
									<InfoValue>{profile?.phone_number || <span style={{ color: '#bbb' }}>Not set</span>}</InfoValue>
									<Button type="button" onClick={() => setEditingPhone(true)} style={{ background: '#f1f5f9', color: '#2563eb', minWidth: 80, fontWeight: 500, fontSize: '0.98rem', padding: '0.4rem 1rem' }}>
										{profile?.phone_number ? 'Edit' : 'Add'}
									</Button>
								</div>
							)}
						</InfoRow>
						<div style={{ color: '#888', fontSize: '0.97rem', marginTop: 4, marginBottom: 8 }}>
							Phone number is only shown when your claim is accepted.
						</div>
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
											<ListingCard key={listing.id} listing={listing} onEdit={() => handleEditListing(listing)} showActions={false} onStatusChange={handleStatusChange} />
										))}
									</ListingsGrid>
								</ListingsGridWrapper>
							</>
						)}
					</ProfileCard>

					<ProfileCard>
						<SectionTitle>Contact Preferences</SectionTitle>
						{prefsLoading ? (
							<div style={{ color: '#888', marginBottom: 12 }}>Loading preferences...</div>
						) : (
							<>
								<ToggleSwitch $checked={!!prefs?.show_phone_on_claim}>
									<input
										type="checkbox"
										checked={!!prefs?.show_phone_on_claim}
										onChange={e => handleTogglePref('show_phone_on_claim', e.target.checked)}
									/>
									Show my phone number after a claim is accepted
									<span style={{ color: '#888', fontSize: '0.97rem', marginLeft: 8 }}>
										({profile?.phone_number || 'Not set'})
									</span>
								</ToggleSwitch>
								<ToggleSwitch $checked={!!prefs?.show_email_on_claim}>
									<input
										type="checkbox"
										checked={!!prefs?.show_email_on_claim}
										onChange={e => handleTogglePref('show_email_on_claim', e.target.checked)}
									/>
									Show my email address after a claim is accepted
									<span style={{ color: '#888', fontSize: '0.97rem', marginLeft: 8 }}>
										({user?.email})
									</span>
								</ToggleSwitch>
								{prefsError && <Warning>{prefsError}</Warning>}
							</>
						)}
						<div style={{ color: '#888', fontSize: '0.97rem', marginTop: 4 }}>
							At least one contact method must be enabled so people can reach you when claims are accepted.
						</div>
					</ProfileCard>

					<ProfileCard>
						<SectionTitle>Notification Preferences</SectionTitle>
						<ToggleSwitch $checked={notifyNearby}>
							<input
								type="checkbox"
								checked={notifyNearby}
								onChange={e => setNotifyNearby(e.target.checked)}
							/>
							Notify me about new lost/found items near my location
						</ToggleSwitch>
						<ToggleSwitch $checked={notifyMatches}>
							<input
								type="checkbox"
								checked={notifyMatches}
								onChange={e => setNotifyMatches(e.target.checked)}
							/>
							Notify me about AI matches for my listings
						</ToggleSwitch>
						<ToggleSwitch $checked={notifyClaims}>
							<input
								type="checkbox"
								checked={notifyClaims}
								onChange={e => setNotifyClaims(e.target.checked)}
							/>
							Notify me about claims on my listings
						</ToggleSwitch>
						{notifyNearby && (
							<div style={{ marginBottom: 16 }}>
								<LocationPicker
									value={locationData}
									onChange={setLocationData}
									label="Your Location"
									required={false}
								/>
								{(!locationData.lat || !locationData.lng) && (
									<div style={{ color: '#dc2626', fontSize: '0.98rem', marginTop: 4 }}>
										Please set your location to receive nearby notifications.
									</div>
								)}
							</div>
						)}
						<Button onClick={handleSaveLocationPrefs} disabled={savingPrefs}>
							{savingPrefs ? 'Saving...' : 'Save Preferences'}
						</Button>
					</ProfileCard>

					<ProfileCard>
						<SectionTitle>Account Actions</SectionTitle>
						<SignOutButton onClick={handleSignOut}>
							Sign Out
						</SignOutButton>
					</ProfileCard>
				</>
			)}
			{/* User Claims Tab */}
			{activeTab === 'userClaims' && (
				<ClaimsSection>
					<h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '18px' }}>Claims You've Made</h2>
					{userClaimsLoading ? (
						<div style={{ color: '#888', padding: '2rem', textAlign: 'center' }}>Loading claims...</div>
					) : userClaims.length === 0 ? (
						<div style={{ color: '#888', padding: '2rem', textAlign: 'center' }}>You haven't made any claims yet.</div>
					) : userClaims.map(claim => (
						<ClaimCard key={claim.id}>
							<div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
								<span style={{ fontWeight: 600, fontSize: '1.08rem' }}>{claim.listing?.title || 'Listing'}</span>
								<ClaimStatus $status={claim.status?.toUpperCase()} style={{
									background: claim.status === 'accepted' ? '#bbf7d0' : claim.status === 'rejected' ? '#fee2e2' : undefined,
									color: claim.status === 'accepted' ? '#166534' : claim.status === 'rejected' ? '#b91c1c' : undefined,
									borderColor: claim.status === 'accepted' ? '#4ade80' : claim.status === 'rejected' ? '#fca5a5' : undefined
								}}>{claim.status?.toUpperCase()}</ClaimStatus>
							</div>
							<div style={{ fontSize: '0.98rem', marginBottom: 6 }}><b>Finder:</b> {finderProfiles[claim.listing?.user_id]?.email || claim.listing?.user_id}</div>
							<div style={{ fontSize: '0.98rem', marginBottom: 6 }}><b>Features/Marks:</b> {claim.description}</div>
							<div style={{ fontSize: '0.98rem', marginBottom: 6 }}><b>Where lost:</b> {claim.where_lost}</div>
							{claim.contents && <div style={{ fontSize: '0.98rem', marginBottom: 6 }}><b>Contents:</b> {claim.contents}</div>}
							{claim.proof_image_url && <div style={{ margin: '0.7rem 0' }}><img src={claim.proof_image_url} alt="Proof" style={{ maxWidth: 120, borderRadius: 8 }} /></div>}
							{claim.status === 'accepted' && claim.listing && (
								<div style={{ color: '#059669', fontWeight: 600, margin: '0.7rem 0' }}>
									Contact the finder: {finderProfiles[claim.listing.user_id]?.email || claim.listing.user_id}
								</div>
							)}
						</ClaimCard>
					))}
				</ClaimsSection>
			)}
			{/* Claims Tab */}
			{activeTab === 'claims' && (
				<ClaimsSection>
					<h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '18px' }}>Claims on My Listings</h2>
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
			{editingListing && (
				<EditListingModal
					listing={editingListing}
					onClose={() => setEditingListing(null)}
					onSave={handleListingUpdated}
					onDelete={handleListingDeleted}
				/>
			)}
		</Container>
	);
} 