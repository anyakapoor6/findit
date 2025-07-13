import type { Listing } from '../lib/types';
import styled, { css } from 'styled-components';
import { getUserProfile } from '../lib/users';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabaseClient';
import { createPortal } from 'react-dom';
import { uploadListingImage } from '../lib/storage';
import { FaPencilAlt } from 'react-icons/fa';

interface ListingCardProps {
	listing: Listing;
	onView?: (listing: Listing) => void;
	onEdit?: (listing: Listing) => void;
	onDelete?: (listing: Listing) => void;
	showActions?: boolean;
	onStatusChange?: () => void;
}

const CARD_WIDTH = '300px';
const CARD_HEIGHT = '470px';

const InitialsBox = styled.div`
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  background: #2563eb;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  z-index: 2;
`;

const Card = styled.div<{ $isLost: boolean; $isResolved: boolean }>`
  border-radius: 1.25rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border: 2px solid;
  padding: 1.5rem;
  width: ${CARD_WIDTH};
  height: ${CARD_HEIGHT};
  min-width: ${CARD_WIDTH};
  min-height: ${CARD_HEIGHT};
  max-width: ${CARD_WIDTH};
  max-height: ${CARD_HEIGHT};
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background: ${({ $isLost, $isResolved }) => $isResolved ? '#fce7f3' : $isLost ? '#fef2f2' : '#f0fdf4'};
  border-color: ${({ $isLost, $isResolved }) => $isResolved ? '#fbcfe8' : $isLost ? '#fecaca' : '#bbf7d0'};
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
  cursor: pointer;
  &:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,0.13);
    transform: scale(1.04);
  }
`;

const Placeholder = styled.div`
  width: 180px;
  height: 180px;
  margin: 0 auto 2rem auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  border: 1.5px dashed #d1d5db;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 2.5rem;
`;
const ImageBox = styled.div`
  width: 180px;
  height: 180px;
  margin: 0 auto 2rem auto;
  overflow: hidden;
  border-radius: 1rem;
  border: 1.5px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
`;
const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;
const TitleTagsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  min-width: 0;
  flex: 1;
`;
const Title = styled.h3`
  font-size: 1.35rem;
  font-weight: 800;
  color: #111;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
`;
const Status = styled.span<{ $isLost: boolean; $isResolved: boolean }>`
  padding: 0.3rem 1rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  border: 1.5px solid;
  ${({ $isLost, $isResolved }) => $isResolved ? `
    background: #fbcfe8;
    color: #be185d;
    border-color: #f472b6;
  ` : $isLost ? `
    background: #fecaca;
    color: #b91c1c;
    border-color: #fca5a5;
  ` : `
    background: #bbf7d0;
    color: #166534;
    border-color: #4ade80;
  `}
`;
const Description = styled.p`
  color: #222;
  font-size: 1.08rem;
  margin-bottom: 1.1rem;
  min-height: 2.5em;
  font-weight: 500;
`;
const Info = styled.div`
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 0.7rem;
`;
const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.2rem;
`;
const InfoLabel = styled.span`
  font-weight: 700;
  color: #111;
`;
const InfoValue = styled.span`
  color: #444;
  font-weight: 500;
`;
const Actions = styled.div`
  display: flex;
  gap: 0.7rem;
  padding-top: 1rem;
  border-top: 1.5px solid #e5e7eb;
  margin-top: auto;
`;
const ActionButton = styled.button`
  flex: 1;
  padding: 0.7rem 0;
  border-radius: 0.5rem;
  font-size: 1.08rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background 0.18s;
  &.view { background: #2563eb; color: #fff; }
  &.view:hover { background: #1d4ed8; }
  &.edit { background: #f1f5f9; color: #222; border: 1.5px solid #bbb; }
  &.edit:hover { background: #e0e7ef; }
  &.delete { background: #fee2e2; color: #b91c1c; border: 1.5px solid #fca5a5; }
  &.delete:hover { background: #fecaca; }
`;
const PlaceholderText = styled.div`
  margin-top: 0.75rem;
  color: #888;
  font-size: 1rem;
  text-align: center;
`;

const TagRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin: 0.3rem 0 0.7rem 0;
  flex-wrap: wrap;
`;
const Tag = styled.span<{ $type: string }>`
  display: inline-block;
  padding: 0.28em 0.95em;
  border-radius: 1.2em;
  font-size: 0.98rem;
  font-weight: 600;
  background: ${({ $type }) =>
		$type === 'electronics' ? '#e0f2fe' :
			$type === 'bags' ? '#fef9c3' :
				$type === 'pets' ? '#fce7f3' :
					$type === 'keys' ? '#dcfce7' :
						$type === 'jewelry' ? '#ede9fe' :
							$type === 'clothing' ? '#e0e7ff' :
								$type === 'documents' ? '#fee2e2' :
									$type === 'toys' ? '#ffedd5' : // light orange
										'#f3f4f6'};
  color: ${({ $type }) =>
		$type === 'electronics' ? '#0369a1' :
			$type === 'bags' ? '#b45309' :
				$type === 'pets' ? '#be185d' :
					$type === 'keys' ? '#166534' :
						$type === 'jewelry' ? '#6d28d9' :
							$type === 'clothing' ? '#3730a3' :
								$type === 'documents' ? '#b91c1c' :
									$type === 'toys' ? '#ea580c' : // dark orange
										'#444'};
  border: none;
`;

// Placeholder for ClaimModal (to be implemented)
function ClaimModal({ open, onClose, listingId }: { open: boolean, onClose: () => void, listingId: string }) {
	const [description, setDescription] = useState('');
	const [whereLost, setWhereLost] = useState('');
	const [contents, setContents] = useState('');
	const [file, setFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setFile(file);
			const reader = new FileReader();
			reader.onload = (e) => {
				setImagePreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		try {
			if (!description.trim() || !whereLost.trim()) {
				throw new Error('Please fill in all required fields.');
			}
			// Get current user
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) throw new Error('You must be signed in to submit a claim.');
			let proof_image_url = '';
			if (file) {
				proof_image_url = await uploadListingImage(file, user.id);
			}
			// Insert claim
			const { data: claim, error: claimError } = await supabase
				.from('claims')
				.insert({
					listing_id: listingId,
					claimant_id: user.id,
					description,
					where_lost: whereLost,
					contents,
					proof_image_url,
					status: 'pending',
				})
				.select()
				.single();
			if (claimError) throw claimError;
			// Get listing to find owner
			const { data: listing } = await supabase
				.from('listings')
				.select('user_id')
				.eq('id', listingId)
				.single();
			// Insert notification for owner
			if (listing && listing.user_id) {
				await supabase.from('notifications').insert({
					user_id: listing.user_id,
					type: 'claim_submitted',
					message: 'A new claim was submitted for your found item.',
					listing_id: listingId,
					claim_id: claim.id,
				});
			}
			setSuccess(true);
			setTimeout(() => {
				setSuccess(false);
				onClose();
			}, 1500);
		} catch (err: any) {
			setError(err.message || 'Failed to submit claim.');
		} finally {
			setLoading(false);
		}
	};

	if (!open) return null;
	return createPortal(
		<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', color: '#111' }}>
				<h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16, color: '#111' }}>Claim Listing</h2>
				{success ? (
					<div style={{ color: '#059669', fontWeight: 600, textAlign: 'center', margin: '2rem 0' }}>Claim submitted!</div>
				) : (
					<form onSubmit={handleSubmit}>
						<div style={{ marginBottom: 12 }}>
							<label style={{ fontWeight: 600, color: '#111' }}>Describe unique features or marks *</label>
							<textarea
								value={description}
								onChange={e => setDescription(e.target.value)}
								required
								rows={3}
								style={{ width: '100%', border: '1px solid #bbb', borderRadius: 8, padding: 8, marginTop: 4, color: '#111' }}
							/>
						</div>
						<div style={{ marginBottom: 12 }}>
							<label style={{ fontWeight: 600, color: '#111' }}>Where did you lose it? *</label>
							<input
								value={whereLost}
								onChange={e => setWhereLost(e.target.value)}
								required
								style={{ width: '100%', border: '1px solid #bbb', borderRadius: 8, padding: 8, marginTop: 4, color: '#111' }}
							/>
						</div>
						<div style={{ marginBottom: 12 }}>
							<label style={{ fontWeight: 600, color: '#111' }}>What is inside? (optional)</label>
							<input
								value={contents}
								onChange={e => setContents(e.target.value)}
								style={{ width: '100%', border: '1px solid #bbb', borderRadius: 8, padding: 8, marginTop: 4, color: '#111' }}
							/>
						</div>
						<div style={{ marginBottom: 12 }}>
							<label style={{ fontWeight: 600, color: '#111' }}>Proof of ownership (optional image)</label>
							<div style={{ color: '#b91c1c', fontWeight: 600, fontSize: '0.98rem', margin: '6px 0 8px 0' }}>
								Highly recommended: Upload a photo or document as proof of ownership. Claims without proof are more likely to be rejected by the item finder.
							</div>
							<input type="file" accept="image/*" onChange={handleFileChange} />
							{imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: 120, marginTop: 8, borderRadius: 8 }} />}
						</div>
						{error && <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>{error}</div>}
						<div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
							<button type="submit" disabled={loading} style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 0', fontWeight: 700, fontSize: '1.08rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
								{loading ? 'Submitting...' : 'Submit Claim'}
							</button>
							<button type="button" onClick={onClose} style={{ flex: 1, background: '#f1f5f9', color: '#111', border: '1px solid #bbb', borderRadius: 8, padding: '0.7rem 0', fontWeight: 600, fontSize: '1.08rem', cursor: 'pointer' }}>
								Cancel
							</button>
						</div>
					</form>
				)}
			</div>
		</div>,
		document.body
	);
}

const ClaimButton = styled.button`
  width: 100%;
  margin-top: 0.7rem;
  background: #22c55e;
  color: #fff;
  font-size: 1.13rem;
  font-weight: 700;
  border: none;
  border-radius: 0.5rem;
  padding: 0.85rem 0;
  box-shadow: 0 2px 8px rgba(34,197,94,0.10);
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s;
  &:hover {
    background: #16a34a;
    box-shadow: 0 4px 16px rgba(34,197,94,0.13);
  }
`;

const EditIconButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f1f5f9;
  border: none;
  border-radius: 50%;
  width: 2.2rem;
  height: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: 1.1rem;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  transition: background 0.18s;
  &:hover {
    background: #e0e7ef;
  }
`;

function formatDateUS(dateStr: string) {
	if (!dateStr) return '';
	// Use only the date part (YYYY-MM-DD)
	const [year, month, day] = dateStr.split('T')[0].split('-');
	if (!year || !month || !day) return '';
	return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
}

function ListingDetailsModal({ open, onClose, listing }: { open: boolean, onClose: () => void, listing: any }) {
	const [user, setUser] = useState<any>(null);
	const [resolving, setResolving] = useState(false);
	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			setUser(data.session?.user || null);
		});
		const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user || null);
		});
		return () => {
			listener?.subscription.unsubscribe();
		};
	}, []);

	const canResolve = user && listing.user_id === user.id && (listing.status === 'lost' || listing.status === 'found');

	const handleResolve = async () => {
		setResolving(true);
		await supabase.from('listings').update({ status: 'resolved' }).eq('id', listing.id);
		setResolving(false);
		onClose();
		// Optionally, trigger a refresh or callback
	};

	if (!open) return null;
	return (
		<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
			<div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, maxWidth: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', color: '#111', position: 'relative' }}>
				<button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: '#f1f5f9', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', fontWeight: 700 }}>Close</button>
				<h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{listing.title}</h2>
				<div style={{ marginBottom: 12 }}><b>Status:</b> {listing.status}</div>
				<div style={{ marginBottom: 12 }}><b>Category:</b> {listing.item_type}</div>
				<div style={{ marginBottom: 12 }}><b>Subcategory:</b> {listing.item_subtype}</div>
				<div style={{ marginBottom: 12 }}><b>Description:</b> {listing.description}</div>
				<div style={{ marginBottom: 12 }}><b>Location:</b> {listing.location}</div>
				<div style={{ marginBottom: 12 }}><b>Date:</b> {formatDateUS(listing.date)}</div>
				{listing.extra_details && (
					<div style={{ marginBottom: 12 }}>
						<b>Item Details:</b>
						<ul style={{ margin: '8px 0 0 0', padding: 0, listStyle: 'none' }}>
							{Object.entries(listing.extra_details).map(([key, value]) => (
								<li key={key}><b>{key.replace(/_/g, ' ')}:</b> {value as string}</li>
							))}
						</ul>
					</div>
				)}
				{canResolve && (
					<button
						onClick={handleResolve}
						disabled={resolving}
						style={{
							marginTop: 20,
							width: '100%',
							background: '#f472b6',
							color: '#fff',
							fontWeight: 700,
							fontSize: '1.1rem',
							border: 'none',
							borderRadius: 8,
							padding: '0.9rem 0',
							cursor: 'pointer',
							boxShadow: '0 2px 8px rgba(245,114,182,0.10)',
							transition: 'background 0.18s, box-shadow 0.18s',
							opacity: resolving ? 0.7 : 1
						}}
					>
						{resolving ? 'Marking as Resolved...' : 'Mark as Resolved'}
					</button>
				)}
			</div>
		</div>
	);
}

export default function ListingCard({
	listing,
	onView,
	onEdit,
	onDelete,
	showActions = false,
	onStatusChange
}: ListingCardProps) {
	const isLost = listing.status === 'lost';
	const isResolved = listing.status === 'resolved';
	const [initials, setInitials] = useState<string>('?');
	const [showClaimModal, setShowClaimModal] = useState(false);
	const [user, setUser] = useState<any>(null);
	const [showDetails, setShowDetails] = useState(false);
	const [resolving, setResolving] = useState(false);
	const router = useRouter();

	useEffect(() => {
		async function fetchInitials() {
			try {
				const profile = await getUserProfile(listing.user_id);
				if (profile) {
					if (profile.name) {
						const parts = profile.name.trim().split(' ');
						const initials = parts.length === 1
							? parts[0][0]
							: parts[0][0] + parts[parts.length - 1][0];
						setInitials(initials.toUpperCase());
					} else if (profile.email) {
						setInitials(profile.email[0].toUpperCase());
					} else {
						setInitials('?');
					}
				} else {
					setInitials('?');
				}
			} catch (err) {
				// fallback: show ? or first letter of user_id if it's an email
				if (listing.user_id && listing.user_id.includes('@')) {
					setInitials(listing.user_id[0].toUpperCase());
				} else {
					setInitials('?');
				}
				// Log error for debugging
				// eslint-disable-next-line no-console
				console.error('Failed to fetch profile for initials', err);
			}
		}
		fetchInitials();
	}, [listing.user_id]);

	useEffect(() => {
		// Use Supabase client-side auth to get the current user
		supabase.auth.getSession().then(({ data }) => {
			setUser(data.session?.user || null);
		});
		// Subscribe to auth changes
		const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user || null);
		});
		return () => {
			listener?.subscription.unsubscribe();
		};
	}, []);

	const canResolve = user && listing.user_id === user.id && (listing.status === 'lost' || listing.status === 'found');

	const handleResolve = async (e: React.MouseEvent) => {
		e.stopPropagation();
		setResolving(true);
		const { error } = await supabase.from('listings').update({ status: 'resolved' }).eq('id', listing.id);
		setResolving(false);
		if (error) {
			alert('Failed to mark as resolved: ' + error.message);
			console.error('Supabase error:', error);
			return;
		}
		if (onStatusChange) onStatusChange();
	};

	return (
		<>
			<Card $isLost={isLost} $isResolved={isResolved} onClick={() => setShowDetails(true)}>
				{listing.image_url ? (
					<ImageBox>
						<CardImage src={listing.image_url} alt={listing.title} />
					</ImageBox>
				) : (
					<Placeholder title="No image provided">
						<svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 16h.01M16 12h.01" /></svg>
						<PlaceholderText>No image</PlaceholderText>
					</Placeholder>
				)}
				<InitialsBox title="Listing owner initials">{initials}</InitialsBox>
				<CardHeader>
					<TitleTagsRow>
						<Title title={listing.title}>{listing.title}</Title>
						<TagRow style={{ margin: 0 }}>
							{listing.item_type && (
								<Tag $type={listing.item_type || 'other'}>{listing.item_type.charAt(0).toUpperCase() + listing.item_type.slice(1)}</Tag>
							)}
							{listing.item_subtype && (
								<Tag $type={listing.item_type || 'other'}>{listing.item_subtype.charAt(0).toUpperCase() + listing.item_subtype.slice(1)}</Tag>
							)}
						</TagRow>
					</TitleTagsRow>
					<Status $isLost={isLost} $isResolved={isResolved}>{listing.status.toUpperCase()}</Status>
				</CardHeader>
				<Description>{listing.description}</Description>
				<Info>
					<InfoRow>
						<InfoLabel>Location:</InfoLabel>
						<InfoValue title={listing.location}>{listing.location}</InfoValue>
					</InfoRow>
					<InfoRow>
						<InfoLabel>Date:</InfoLabel>
						<InfoValue>{formatDateUS(listing.date)}</InfoValue>
					</InfoRow>
				</Info>
				{/* Claim button for found listings, only for signed-in users who are not the owner, now directly below the date */}
				{listing.status === 'found' && user && user.id !== listing.user_id && (
					<ClaimButton onClick={e => { e.stopPropagation(); setShowClaimModal(true); }}>
						I think this is mine
					</ClaimButton>
				)}
				{/* Mark as Resolved button for creator if active, at the bottom of the card */}
				{canResolve && (
					<button
						onClick={handleResolve}
						disabled={resolving}
						style={{
							marginTop: 16,
							width: '100%',
							background: '#f472b6',
							color: '#fff',
							fontWeight: 700,
							fontSize: '1.1rem',
							border: 'none',
							borderRadius: 8,
							padding: '0.9rem 0',
							cursor: 'pointer',
							boxShadow: '0 2px 8px rgba(245,114,182,0.10)',
							transition: 'background 0.18s, box-shadow 0.18s',
							opacity: resolving ? 0.7 : 1
						}}
					>
						{resolving ? 'Marking as Resolved...' : 'Mark as Resolved'}
					</button>
				)}
				{onEdit && (
					<EditIconButton title="Edit Listing" onClick={e => { e.stopPropagation(); onEdit(listing); }}>
						<FaPencilAlt />
					</EditIconButton>
				)}
				<ClaimModal open={showClaimModal} onClose={() => setShowClaimModal(false)} listingId={listing.id} />
				{showActions && (
					<Actions>
						{onView && (
							<ActionButton className="view" onClick={e => { e.stopPropagation(); onView(listing); }}>
								View Details
							</ActionButton>
						)}
						{onEdit && (
							<ActionButton className="edit" onClick={e => { e.stopPropagation(); onEdit(listing); }}>
								Edit
							</ActionButton>
						)}
						{onDelete && (
							<ActionButton className="delete" onClick={e => { e.stopPropagation(); onDelete(listing); }}>
								Delete
							</ActionButton>
						)}
					</Actions>
				)}
			</Card>
			<ListingDetailsModal open={showDetails} onClose={() => setShowDetails(false)} listing={listing} />
		</>
	);
} 