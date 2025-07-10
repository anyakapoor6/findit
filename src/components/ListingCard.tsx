import type { Listing } from '../lib/types';
import styled, { css } from 'styled-components';
import { getUserProfile } from '../lib/users';
import { useEffect, useState } from 'react';

interface ListingCardProps {
	listing: Listing;
	onView?: (listing: Listing) => void;
	onEdit?: (listing: Listing) => void;
	onDelete?: (listing: Listing) => void;
	showActions?: boolean;
}

const CARD_WIDTH = '320px';
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

const Card = styled.div<{ $isLost: boolean }>`
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
  background: ${({ $isLost }) => ($isLost ? '#fef2f2' : '#f0fdf4')};
  border-color: ${({ $isLost }) => ($isLost ? '#fecaca' : '#bbf7d0')};
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
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
const Title = styled.h3`
  font-size: 1.35rem;
  font-weight: 800;
  color: #111;
  margin: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const Status = styled.span<{ $isLost: boolean }>`
  padding: 0.3rem 1rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  box-shadow: 0 1px 3px rgba(0,0,0,0.07);
  border: 1.5px solid;
  ${({ $isLost }) => $isLost ? css`
    background: #fecaca;
    color: #b91c1c;
    border-color: #fca5a5;
  ` : css`
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

export default function ListingCard({
	listing,
	onView,
	onEdit,
	onDelete,
	showActions = false
}: ListingCardProps) {
	const isLost = listing.status === 'lost';
	const [initials, setInitials] = useState<string>('');

	useEffect(() => {
		async function fetchInitials() {
			const profile = await getUserProfile(listing.user_id);
			if (profile && profile.name) {
				const parts = profile.name.trim().split(' ');
				const initials = parts.length === 1
					? parts[0][0]
					: parts[0][0] + parts[parts.length - 1][0];
				setInitials(initials.toUpperCase());
			} else if (profile && profile.email) {
				setInitials(profile.email[0].toUpperCase());
			} else {
				setInitials('?');
			}
		}
		fetchInitials();
	}, [listing.user_id]);

	return (
		<Card $isLost={isLost}>
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
				<Title title={listing.title}>{listing.title}</Title>
				<Status $isLost={isLost}>{listing.status}</Status>
			</CardHeader>
			<Description>{listing.description}</Description>
			<Info>
				<InfoRow>
					<InfoLabel>Location:</InfoLabel>
					<InfoValue title={listing.location}>{listing.location}</InfoValue>
				</InfoRow>
				<InfoRow>
					<InfoLabel>Date:</InfoLabel>
					<InfoValue>{new Date(listing.date).toLocaleDateString()}</InfoValue>
				</InfoRow>
			</Info>
			{showActions && (
				<Actions>
					{onView && (
						<ActionButton className="view" onClick={() => onView(listing)}>
							View Details
						</ActionButton>
					)}
					{onEdit && (
						<ActionButton className="edit" onClick={() => onEdit(listing)}>
							Edit
						</ActionButton>
					)}
					{onDelete && (
						<ActionButton className="delete" onClick={() => onDelete(listing)}>
							Delete
						</ActionButton>
					)}
				</Actions>
			)}
		</Card>
	);
} 