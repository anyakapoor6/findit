import type { Listing } from '../lib/types';
import styled, { css } from 'styled-components';
import { getUserProfile } from '../lib/users';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '../utils/supabaseClient';
import { createPortal } from 'react-dom';
import { uploadListingImage } from '../lib/storage';
import { FaPencilAlt } from 'react-icons/fa';
import { sendEmailNotification } from '../lib/notifications';
import type { NotificationType } from '../lib/types';

const supabase = createSupabaseClient();

interface ListingCardProps {
	listing: Listing;
	onView?: (listing: Listing) => void;
	onEdit?: (listing: Listing) => void;
	onDelete?: (listing: Listing) => void;
	showActions?: boolean;
	onStatusChange?: () => void;
}

// FIXED: Clean, consistent card dimensions
const CARD_WIDTH = '300px';
const CARD_HEIGHT = '560px'; // Increased for better content spacing

// FIXED: Helper function to get emoji for category and subcategory
function getEmojiForCategory(category?: string, subcategory?: string): string {
	if (!category) return '❓';

	const categoryEmojis: Record<string, string> = {
		'pets': '🐾',
		'electronics': '💻',
		'keys': '🔑',
		'bags': '👜',
		'jewelry': '💍',
		'clothing': '👕',
		'documents': '📄',
		'toys': '🧸',
		'other': '❓'
	};

	const subcategoryEmojis: Record<string, Record<string, string>> = {
		'pets': {
			'dog': '🐶',
			'cat': '🐱',
			'bird': '🐦',
			'other': '🐾'
		},
		'electronics': {
			'phone': '📱',
			'laptop': '💻',
			'tablet': '📱',
			'headphones': '🎧',
			'other': '💻'
		},
		'keys': {
			'house key': '🔑',
			'car key': '🚗',
			'other': '🔑'
		},
		'bags': {
			'backpack': '🎒',
			'handbag': '👜',
			'suitcase': '💼',
			'wallet': '👛',
			'other': '👜'
		},
		'jewelry': {
			'ring': '💍',
			'necklace': '📿',
			'watch': '⌚',
			'other': '💍'
		},
		'clothing': {
			'jacket': '🧥',
			'shirt': '👕',
			'shoes': '👟',
			'other': '👕'
		},
		'documents': {
			'id': '🆔',
			'passport': '🛂',
			'card': '💳',
			'other': '📄'
		},
		'toys': {
			'action figure': '🤖',
			'doll': '🧸',
			'plushie': '🧸',
			'other': '🧸'
		}
	};

	// If subcategory is provided and exists, use it
	if (subcategory && subcategoryEmojis[category.toLowerCase()]?.[subcategory.toLowerCase()]) {
		return subcategoryEmojis[category.toLowerCase()][subcategory.toLowerCase()];
	}

	// Otherwise use category emoji
	return categoryEmojis[category.toLowerCase()] || '❓';
}

// FIXED: Clean, consistent styled components
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
  justify-content: flex-start;
  background: ${({ $isLost, $isResolved }) => $isResolved ? '#fce7f3' : $isLost ? '#fef2f2' : '#f0fdf4'};
  border-color: ${({ $isLost, $isResolved }) => $isResolved ? '#fbcfe8' : $isLost ? '#fecaca' : '#bbf7d0'};
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  z-index: 1;
  
  &:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,0.13);
    transform: scale(1.02);
  }
`;

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

// FIXED: Image section with consistent sizing
const ImageContainer = styled.div`
  width: 100%;
  height: 200px;
  margin-bottom: 1.5rem;
  border-radius: 1rem;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: #f8f9fa;
  color: #9ca3af;
  border: 1.5px dashed #d1d5db;
`;

const PlaceholderEmoji = styled.span`
  font-size: 3rem;
  line-height: 1;
  margin-bottom: 0.5rem;
  display: block;
`;

const PlaceholderText = styled.div`
  color: #9ca3af;
  font-size: 0.875rem;
  text-align: center;
  font-weight: 500;
`;

// FIXED: Header with proper alignment
const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  gap: 0.75rem;
`;

const TitleSection = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h3`
  font-size: 1.35rem;
  font-weight: 800;
  color: #111;
  margin: 0 0 0.5rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
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
  flex-shrink: 0;
  white-space: nowrap;
  
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

// FIXED: Tags with proper spacing and alignment
const TagRow = styled.div`
  display: flex;
  gap: 0.4rem;
  row-gap: 0.3rem;
  margin: 0.5rem 0 0.75rem 0;
  flex-wrap: wrap;
  align-items: center;
  min-height: 2rem;
`;

const Tag = styled.span<{ $type: string }>`
  display: inline-block;
  padding: 0.25em 0.8em;
  border-radius: 1.2em;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${({ $type }) => getTagColors($type).bg};
  color: ${({ $type }) => getTagColors($type).color};
  border: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  white-space: nowrap;
  line-height: 1.2;
`;

// FIXED: Content sections with consistent spacing
const Description = styled.p`
  color: #222;
  font-size: 1rem;
  margin: 0 0 1rem 0;
  min-height: 2.4em;
  font-weight: 500;
  line-height: 1.4;
`;

const Info = styled.div`
  font-size: 1rem;
  color: #333;
  margin-bottom: 1rem;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
`;

const InfoLabel = styled.span`
  font-weight: 600;
  color: #111;
  display: flex;
  align-items: center;
  font-size: 1.1rem;
`;

const InfoValue = styled.span`
  color: #444;
  font-weight: 500;
  flex: 1;
`;

// FIXED: Buttons with consistent styling
const ClaimButton = styled.button`
  width: 100%;
  margin-top: 0.5rem;
  background: #22c55e;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 0;
  box-shadow: 0 2px 8px rgba(34,197,94,0.10);
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s;
  
  &:hover {
    background: #16a34a;
    box-shadow: 0 4px 16px rgba(34,197,94,0.13);
  }
`;

const ResolveButton = styled.button`
  width: 100%;
  margin-top: 0.75rem;
  background: #f472b6;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 0;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(245,114,182,0.10);
  transition: background 0.18s, box-shadow 0.18s;
  
  &:hover {
    background: #ec4899;
    box-shadow: 0 4px 16px rgba(245,114,182,0.13);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
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
  font-size: 1rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: background 0.18s;
  
  &.view { 
    background: #2563eb; 
    color: #fff; 
  }
  &.view:hover { 
    background: #1d4ed8; 
  }
  &.edit { 
    background: #f1f5f9; 
    color: #222; 
    border: 1.5px solid #bbb; 
  }
  &.edit:hover { 
    background: #e0e7ef; 
  }
  &.delete { 
    background: #fee2e2; 
    color: #b91c1c; 
    border: 1.5px solid #fca5a5; 
  }
  &.delete:hover { 
    background: #fecaca; 
  }
`;

// FIXED: Color mappings for tags
const TAG_COLORS: Record<string, { bg: string; color: string }> = {
	electronics: { bg: '#e0f2fe', color: '#0369a1' },
	phone: { bg: '#dbeafe', color: '#2563eb' },
	laptop: { bg: '#e0e7ff', color: '#3730a3' },
	tablet: { bg: '#f1f5f9', color: '#0f172a' },
	headphones: { bg: '#f3e8ff', color: '#7c3aed' },
	bags: { bg: '#fef9c3', color: '#b45309' },
	backpack: { bg: '#fef08a', color: '#a16207' },
	handbag: { bg: '#f9fafb', color: '#be185d' },
	suitcase: { bg: '#ede9fe', color: '#6d28d9' },
	wallet: { bg: '#f1f5f9', color: '#0f172a' },
	pets: { bg: '#fce7f3', color: '#be185d' },
	dog: { bg: '#fef2f2', color: '#b91c1c' },
	cat: { bg: '#f3f4f6', color: '#0f172a' },
	bird: { bg: '#e0f2fe', color: '#0369a1' },
	keys: { bg: '#dcfce7', color: '#166534' },
	'house key': { bg: '#fef3c7', color: '#b45309' },
	'car key': { bg: '#fee2e2', color: '#b91c1c' },
	jewelry: { bg: '#ede9fe', color: '#6d28d9' },
	ring: { bg: '#fef9c3', color: '#a16207' },
	necklace: { bg: '#fce7f3', color: '#be185d' },
	watch: { bg: '#e0e7ff', color: '#3730a3' },
	clothing: { bg: '#e0e7ff', color: '#3730a3' },
	jacket: { bg: '#f1f5f9', color: '#0f172a' },
	shirt: { bg: '#fef9c3', color: '#b45309' },
	shoes: { bg: '#f3f4f6', color: '#0f172a' },
	documents: { bg: '#fee2e2', color: '#b91c1c' },
	id: { bg: '#e0e7ff', color: '#3730a3' },
	passport: { bg: '#fef9c3', color: '#a16207' },
	card: { bg: '#f3f4f6', color: '#0f172a' },
	toys: { bg: '#ffedd5', color: '#ea580c' },
	'action figure': { bg: '#f3f4f6', color: '#0f172a' },
	doll: { bg: '#fce7f3', color: '#be185d' },
	plushie: { bg: '#fef2f2', color: '#b91c1c' },
	other: { bg: '#f3f4f6', color: '#444' },
};

function getTagColors(type?: string) {
	if (!type) return TAG_COLORS.other;
	const key = type.toLowerCase();
	return TAG_COLORS[key] || TAG_COLORS.other;
}

// FIXED: Modal components with proper z-index hierarchy and containment
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
				.select('user_id, title')
				.eq('id', listingId)
				.single();
			// Insert notification for owner
			if (listing && listing.user_id) {
				await supabase.from('notifications').insert({
					user_id: listing.user_id,
					type: 'claim_submitted',
					message: `A new claim was submitted for your found item "${listing.title}".`,
					listing_id: listingId,
					claim_id: claim.id,
				});
				// Send email notification with listing title
				const notificationType: NotificationType = 'claim_submitted';
				await sendEmailNotification({
					user_id: listing.user_id,
					type: notificationType,
					message: `A new claim was submitted for your found item "${listing.title}".`,
					listing_title: listing.title
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
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				background: 'rgba(0,0,0,0.6)',
				zIndex: 9999,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backdropFilter: 'blur(4px)',
				padding: '20px'
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				style={{
					background: '#fff',
					borderRadius: 12,
					padding: 32,
					minWidth: 320,
					maxWidth: 500,
					width: '90vw',
					maxHeight: '90vh',
					overflowY: 'auto',
					boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
					color: '#111',
					border: '1px solid #e5e7eb',
					position: 'relative'
				}}
				onClick={(e) => e.stopPropagation()}
			>
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

function formatDateUS(dateStr: string) {
	if (!dateStr) return '';
	// Use only the date part (YYYY-MM-DD)
	const [year, month, day] = dateStr.split('T')[0].split('-');
	if (!year || !month || !day) return '';
	return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
}

function ListingDetailsModal({ open, onClose, listing }: { open: boolean, onClose: () => void, listing: any }) {
	const [resolving, setResolving] = useState(false);
	const [user, setUser] = useState<any>(null);

	useEffect(() => {
		// Get current user
		supabase.auth.getSession().then(({ data }) => {
			setUser(data.session?.user || null);
		});
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
	return createPortal(
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				background: 'rgba(0,0,0,0.6)',
				zIndex: 9998,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backdropFilter: 'blur(4px)',
				padding: '20px'
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				style={{
					background: '#fff',
					borderRadius: 12,
					padding: 32,
					minWidth: 320,
					maxWidth: 500,
					maxHeight: '90vh',
					overflowY: 'auto',
					boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
					color: '#111',
					position: 'relative',
					border: '1px solid #e5e7eb'
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<button onClick={onClose} style={{
					position: 'absolute',
					top: 12,
					right: 12,
					background: '#f1f5f9',
					border: 'none',
					borderRadius: 8,
					padding: 6,
					cursor: 'pointer',
					fontWeight: 700,
					fontSize: '1.1rem'
				}}>✕</button>
				<h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16 }}>{listing.title}</h2>
				<div style={{ marginBottom: 12 }}><b>Status:</b> {listing.status}</div>
				<div style={{ marginBottom: 12 }}><b>Category:</b> {listing.item_type}</div>
				<div style={{ marginBottom: 12 }}><b>Subcategory:</b> {listing.item_subtype || 'N/A'}</div>
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
		</div>,
		document.body
	);
}

function ShareSheet({ open, onClose, listing }: { open: boolean, onClose: () => void, listing: Listing }) {
	const [shared, setShared] = useState(false);
	const shareUrl = typeof window !== 'undefined' ? window.location.origin + `/found/${listing.id}` : '';
	const shareText = `Help spread the word! This item was just resolved on FindIt: ${listing.title} (${listing.location})`;

	const handleShare = async () => {
		if (navigator.share) {
			try {
				await navigator.share({
					title: 'FindIt - Resolved Item',
					text: shareText,
					url: shareUrl,
				});
				setShared(true);
				// Auto-close after sharing
				setTimeout(() => {
					onClose();
				}, 2000);
			} catch { }
		}
	};

	const handleCopy = async () => {
		await navigator.clipboard.writeText(shareUrl);
		setShared(true);
		// Auto-close after copying
		setTimeout(() => {
			onClose();
		}, 2000);
	};

	if (!open) return null;
	return createPortal(
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				background: 'rgba(0,0,0,0.6)',
				zIndex: 9997,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backdropFilter: 'blur(4px)',
				padding: '20px'
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				style={{
					background: '#18181b',
					color: '#fff',
					borderRadius: 16,
					padding: '2.2rem 2.2rem 1.5rem 2.2rem',
					maxWidth: 420,
					width: '90vw',
					maxHeight: '90vh',
					overflowY: 'auto',
					boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
					position: 'relative',
					border: '1px solid #27272a'
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<button onClick={onClose} style={{
					position: 'absolute',
					top: 12,
					right: 12,
					background: '#23232b',
					color: '#fff',
					border: 'none',
					borderRadius: 8,
					padding: 6,
					cursor: 'pointer',
					fontWeight: 700,
					fontSize: '1.1rem'
				}}>✕</button>
				<div style={{ fontWeight: 700, fontSize: '1.18rem', marginBottom: 8 }}>
					✨ Good News!
				</div>
				<div style={{ fontSize: '1.05rem', marginBottom: 14, lineHeight: 1.6 }}>
					We're so glad your listing was resolved — whether you found your item or reunited it with its owner!<br /><br />
					<b>Celebrate by sharing this moment with friends</b> and help more people discover FindIt. Every share helps someone else get closer to a happy ending too. <span style={{ color: '#3b82f6', fontSize: '1.1em' }}>💙</span>
				</div>
				{typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
					<button onClick={handleShare} style={{ width: '100%', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '1.1rem', border: 'none', borderRadius: 8, padding: '0.9rem 0', cursor: 'pointer', marginBottom: 10 }}>
						Share Now
					</button>
				) : (
					<button onClick={handleCopy} style={{ width: '100%', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '1.1rem', border: 'none', borderRadius: 8, padding: '0.9rem 0', cursor: 'pointer', marginBottom: 10 }}>
						Copy Share Link
					</button>
				)}
				{shared && <div style={{ color: '#059669', fontWeight: 600, marginTop: 8 }}>Thank you for sharing!</div>}
			</div>
		</div>,
		document.body
	);
}

function ImageViewModal({ open, onClose, imageUrl, title }: { open: boolean, onClose: () => void, imageUrl: string, title: string }) {
	if (!open) return null;

	return createPortal(
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				background: 'rgba(0,0,0,0.9)',
				zIndex: 10000,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backdropFilter: 'blur(8px)',
				padding: '20px'
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				style={{
					position: 'relative',
					maxWidth: '90vw',
					maxHeight: '90vh',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					background: '#fff',
					borderRadius: 12,
					padding: '24px',
					boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
					border: '1px solid #e5e7eb',
					overflow: 'hidden'
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<button onClick={onClose} style={{
					position: 'absolute',
					top: '12px',
					right: '12px',
					background: 'rgba(255,255,255,0.9)',
					color: '#111',
					border: '1px solid #e5e7eb',
					borderRadius: 8,
					padding: '8px 12px',
					cursor: 'pointer',
					fontWeight: 700,
					fontSize: '1.1rem',
					zIndex: 1
				}}>✕</button>
				<h3 style={{
					color: '#111',
					marginBottom: 16,
					fontSize: '1.2rem',
					fontWeight: 600,
					textAlign: 'center',
					maxWidth: '100%',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					whiteSpace: 'nowrap'
				}}>{title}</h3>
				<div style={{
					maxWidth: '100%',
					maxHeight: 'calc(90vh - 120px)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					overflow: 'hidden'
				}}>
					<img
						src={imageUrl}
						alt={title}
						style={{
							maxWidth: '100%',
							maxHeight: '100%',
							objectFit: 'contain',
							borderRadius: 8,
							boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
						}}
					/>
				</div>
			</div>
		</div>,
		document.body
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
	const [showShareSheet, setShowShareSheet] = useState(false);
	const [showFullLocation, setShowFullLocation] = useState(false);
	const [showImageView, setShowImageView] = useState(false);
	const condensedLocation = listing.location?.split(',')[0] || '';

	// FIXED: Ensure only one modal can be open at a time with proper state management
	const closeAllModals = () => {
		setShowDetails(false);
		setShowImageView(false);
		setShowClaimModal(false);
		setShowShareSheet(false);
	};

	useEffect(() => {
		if (showDetails) {
			setShowImageView(false);
			setShowClaimModal(false);
			setShowShareSheet(false);
		}
	}, [showDetails]);

	useEffect(() => {
		if (showImageView) {
			setShowDetails(false);
			setShowClaimModal(false);
			setShowShareSheet(false);
		}
	}, [showImageView]);

	useEffect(() => {
		if (showClaimModal) {
			setShowDetails(false);
			setShowImageView(false);
			setShowShareSheet(false);
		}
	}, [showClaimModal]);

	useEffect(() => {
		if (showShareSheet) {
			setShowDetails(false);
			setShowImageView(false);
			setShowClaimModal(false);
		}
	}, [showShareSheet]);

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
		closeAllModals();
		setShowShareSheet(true);
	};

	// FIXED: Proper event handlers with explicit stopPropagation and modal state management
	const handleImageClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// FIXED: Dispatch listing-clicked event for unauthenticated users to trigger sign-in
		if (!user) {
			window.dispatchEvent(new CustomEvent('listing-clicked'));
			return;
		}

		closeAllModals();
		setShowImageView(true);
	};

	const handleCardClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// FIXED: Dispatch listing-clicked event for unauthenticated users to trigger sign-in
		if (!user) {
			window.dispatchEvent(new CustomEvent('listing-clicked'));
			return;
		}

		closeAllModals();
		setShowDetails(true);
	};

	const handleClaimClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		closeAllModals();
		setShowClaimModal(true);
	};

	const handleLocationClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setShowFullLocation(!showFullLocation);
	};

	return (
		<Card
			$isLost={listing.status === 'lost'}
			$isResolved={listing.status === 'resolved'}
			onClick={handleCardClick}
		>
			{/* FIXED: Image section with proper event handling */}
			{listing.image_url ? (
				<ImageContainer onClick={handleImageClick}>
					<CardImage src={listing.image_url} alt={listing.title} />
				</ImageContainer>
			) : (
				<ImageContainer onClick={handleImageClick}>
					<Placeholder>
						<PlaceholderEmoji>{getEmojiForCategory(listing.item_type)}</PlaceholderEmoji>
						<PlaceholderText>No image available</PlaceholderText>
					</Placeholder>
				</ImageContainer>
			)}
			{/* FIXED: Title and Status badge in same row */}
			<CardHeader>
				<TitleSection>
					<Title>{listing.title}</Title>
					{/* FIXED: Tags below title with proper spacing */}
					<TagRow>
						{listing.item_type && (
							<Tag $type={listing.item_type}>
								{listing.item_type.charAt(0).toUpperCase() + listing.item_type.slice(1)}
							</Tag>
						)}
						{listing.item_subtype && (
							<Tag $type={listing.item_subtype}>
								{listing.item_subtype}
							</Tag>
						)}
					</TagRow>
				</TitleSection>
				<Status $isLost={listing.status === 'lost'} $isResolved={listing.status === 'resolved'}>
					{listing.status.toUpperCase()}
				</Status>
			</CardHeader>
			{/* Description */}
			<Description>{listing.description}</Description>
			{/* FIXED: Condensed Location with Show More and icons */}
			<Info>
				<InfoRow>
					<InfoLabel>
						📍
					</InfoLabel>
					<InfoValue>
						{showFullLocation ? (
							<>
								{listing.location}
								{listing.location && (
									<span
										style={{ color: '#2563eb', marginLeft: 8, cursor: 'pointer', fontWeight: 500, fontSize: '0.97rem' }}
										onClick={handleLocationClick}
									>
										Show less
									</span>
								)}
							</>
						) : (
							<>
								{condensedLocation}
								{listing.location && listing.location.length > condensedLocation.length && (
									<span
										style={{ color: '#2563eb', marginLeft: 8, cursor: 'pointer', fontWeight: 500, fontSize: '0.97rem' }}
										onClick={handleLocationClick}
									>
										Show more
									</span>
								)}
							</>
						)}
					</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>
						📅
					</InfoLabel>
					<InfoValue>{listing.date ? new Date(listing.date).toLocaleDateString() : ''}</InfoValue>
				</InfoRow>
			</Info>
			{/* Claim button for found listings, only for signed-in users who are not the owner, now directly below the date */}
			{listing.status === 'found' && user && user.id !== listing.user_id && (
				<ClaimButton onClick={handleClaimClick}>
					I think this is mine
				</ClaimButton>
			)}
			{/* Mark as Resolved button for creator if active, at the bottom of the card */}
			{canResolve && (
				<ResolveButton
					onClick={handleResolve}
					disabled={resolving}
				>
					{resolving ? 'Marking as Resolved...' : 'Mark as Resolved'}
				</ResolveButton>
			)}
			{onEdit && (
				<EditIconButton title="Edit Listing" onClick={e => { e.stopPropagation(); onEdit(listing); }}>
					<FaPencilAlt />
				</EditIconButton>
			)}
			{/* FIXED: Added initials avatar icon */}
			<InitialsBox>{initials}</InitialsBox>

			{/* FIXED: Modals with proper z-index and single modal enforcement */}
			{showClaimModal && (
				<ClaimModal open={showClaimModal} onClose={closeAllModals} listingId={listing.id} />
			)}
			{showDetails && (
				<ListingDetailsModal open={showDetails} onClose={closeAllModals} listing={listing} />
			)}
			{showShareSheet && (
				<ShareSheet open={showShareSheet} onClose={closeAllModals} listing={listing} />
			)}
			{showImageView && (
				<ImageViewModal open={showImageView} onClose={closeAllModals} imageUrl={listing.image_url || ''} title={listing.title} />
			)}

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
	);
} 