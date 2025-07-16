"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { getCurrentUser } from '../lib/auth';
import { getUserMatches, getMatchStats } from '../lib/matches';
import type { Match, User, ListingStatus } from '../lib/types';
import ListingCard from './ListingCard';
import LoadingSpinner from './LoadingSpinner';
import SignInModal from './SignInModal';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  
  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
  }
`;
const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #111;
  text-align: center;
`;
const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
  text-align: center;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;
const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
`;
const StatCard = styled.div`
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border: 1px solid #dbeafe;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;
const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #2563eb;
  margin-bottom: 0.5rem;
`;
const StatLabel = styled.div`
  font-size: 1rem;
  color: #666;
  font-weight: 500;
`;
const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #111;
`;
const MatchGroup = styled.div`
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border: 1px solid #dbeafe;
`;
const MatchHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;
const MatchScore = styled.div<{ $score: number }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${({ $score }) =>
		$score >= 0.8 ? '#059669' :
			$score >= 0.6 ? '#d97706' :
				'#dc2626'
	};
`;
const ScoreBar = styled.div<{ $score: number }>`
  width: 60px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  &::after {
    content: '';
    display: block;
    width: ${({ $score }) => $score * 100}%;
    height: 100%;
    background: ${({ $score }) =>
		$score >= 0.8 ? '#10b981' :
			$score >= 0.6 ? '#f59e0b' :
				'#ef4444'
	};
    transition: width 0.3s ease;
  }
`;
const MatchReasons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;
const ReasonTag = styled.span`
  background: #f3f4f6;
  color: #374151;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
`;
const ListingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;
const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
`;
const EmptyStateTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #111;
`;
const EmptyStateText = styled.p`
  font-size: 1.125rem;
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
`;
const CreateListingButton = styled.button`
  background: #2563eb;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #1d4ed8;
  }
`;

const MatchLayout = styled.div`
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    gap: 2.5rem;
  }
`;

const MatchCard = styled.div`
  width: 100%;
  max-width: 300px;
`;

const MatchCenter = styled.div`
  width: 100%;
  max-width: 220px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

// Filter out matches for resolved listings and only show matches with the same category
const filterValidMatches = (matches: Match[]): Match[] => {
	return matches.filter(m =>
		m.listing_status !== 'resolved' &&
		m.matched_listing_status !== 'resolved' &&
		m.listing_category === m.matched_listing_category
	);
}

export default function MatchesPageClient() {
	const [user, setUser] = useState<User | null>(null);
	const [matches, setMatches] = useState<Match[]>([]);
	const [loading, setLoading] = useState(true);
	const [showSignIn, setShowSignIn] = useState(false);
	const [stats, setStats] = useState({
		totalMatches: 0,
		highConfidenceMatches: 0,
		recentMatches: 0
	});
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
			setLoading(false);
		};
		checkAuth();
	}, []);

	useEffect(() => {
		const fetchMatches = async () => {
			// MOVED: Early return logic inside the effect to avoid breaking hooks order
			if (user) {
				try {
					const [matchesData, statsData] = await Promise.all([
						getUserMatches(user.id),
						getMatchStats(user.id)
					]);
					const filtered = filterValidMatches(matchesData);
					setMatches(filtered);
					setStats({
						totalMatches: filtered.length,
						highConfidenceMatches: filtered.filter(m => m.score >= 0.6).length,
						recentMatches: filtered.filter(m => {
							const now = new Date();
							const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
							return new Date(m.listing_created_at) >= sevenDaysAgo;
						}).length
					});
				} catch (error) {
					console.error('Error fetching matches:', error);
				}
			}
		};
		fetchMatches();
	}, [user]);

	const handleSignInSuccess = () => {
		setShowSignIn(false);
		setLoading(true);
		setTimeout(() => window.location.reload(), 100);
	};

	const handleCreateListing = () => {
		router.push('/create-listing');
	};

	// Group matches by any listing owned by the user (listing_id or matched_listing_id)
	type MatchWithOther = Match & { _other: 'matched' | 'listing' };
	const matchesByUserListing: Record<string, { listing: any; matches: MatchWithOther[] }> = {};
	if (user) {
		matches.forEach(match => {
			// If the user owns listing_id, group by listing_id
			if (match.listing_user_id === user.id) {
				if (!matchesByUserListing[match.listing_id]) {
					matchesByUserListing[match.listing_id] = {
						listing: {
							id: match.listing_id,
							title: match.listing_title,
							status: match.listing_status as ListingStatus,
							category: match.listing_category,
							subcategory: match.listing_subcategory,
							location: match.listing_location,
							created_at: match.listing_created_at
						},
						matches: []
					};
				}
				matchesByUserListing[match.listing_id].matches.push({
					...match,
					_other: 'matched'
				});
			}
			// If the user owns matched_listing_id, group by matched_listing_id
			else if (match.matched_listing_user_id === user.id) {
				if (!matchesByUserListing[match.matched_listing_id]) {
					matchesByUserListing[match.matched_listing_id] = {
						listing: {
							id: match.matched_listing_id,
							title: match.matched_listing_title,
							status: match.matched_listing_status as ListingStatus,
							category: match.matched_listing_category,
							subcategory: match.matched_listing_subcategory,
							location: match.matched_listing_location,
							created_at: match.matched_listing_created_at
						},
						matches: []
					};
				}
				matchesByUserListing[match.matched_listing_id].matches.push({
					...match,
					_other: 'listing'
				});
			}
		});
	}

	// MOVED: All conditional returns to the end after all hooks are called
	if (loading) {
		return (
			<Container>
				<LoadingSpinner />
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
			<Title>AI Matches</Title>
			<Subtitle>
				Smart suggestions for your lost and found items based on category, location, and timing
			</Subtitle>
			{/* Stats */}
			<StatsContainer>
				<StatCard>
					<StatNumber>{stats.totalMatches}</StatNumber>
					<StatLabel>Total Matches</StatLabel>
				</StatCard>
				<StatCard>
					<StatNumber>{stats.highConfidenceMatches}</StatNumber>
					<StatLabel>High Confidence</StatLabel>
				</StatCard>
				<StatCard>
					<StatNumber>{stats.recentMatches}</StatNumber>
					<StatLabel>This Week</StatLabel>
				</StatCard>
			</StatsContainer>
			{/* Matches */}
			{Object.keys(matchesByUserListing).length === 0 ? (
				<EmptyState>
					<EmptyStateTitle>No matches found yet</EmptyStateTitle>
					<EmptyStateText>
						Create your first listing to start getting AI-powered match suggestions.
						Our system will automatically find potential matches based on category, location, and timing.
					</EmptyStateText>
					<CreateListingButton onClick={handleCreateListing}>
						Create Your First Listing
					</CreateListingButton>
				</EmptyState>
			) : (
				Object.entries(matchesByUserListing).map(([listingId, { listing, matches: listingMatches }]) => (
					<MatchGroup key={listingId}>
						<MatchHeader>
							<div>
								<SectionTitle>Matches for "{listing.title}"</SectionTitle>
								<div style={{ color: '#666', fontSize: '0.875rem' }}>
									{listing.status === 'lost' ? 'Lost' : 'Found'}  {listing.category}
									{listing.subcategory && `  ${listing.subcategory}`}
									{listing.location && `  ${listing.location}`}
								</div>
							</div>
						</MatchHeader>
						{listingMatches.map((match) => {
							// Always show the user's listing on the left, the match on the right
							const isUserListingLeft = match.listing_user_id === user.id;
							const left = isUserListingLeft ? {
								id: match.listing_id,
								title: match.listing_title,
								status: match.listing_status as ListingStatus,
								item_type: match.listing_category,
								item_subtype: match.listing_subcategory,
								location: match.listing_location,
								created_at: match.listing_created_at,
								description: match.listing_description || '',
								user_id: match.listing_user_id,
								image_url: match.listing_image_url || undefined,
								date: match.listing_created_at,
								extra_details: match.listing_extra_details || undefined
							} : {
								id: match.matched_listing_id,
								title: match.matched_listing_title,
								status: match.matched_listing_status as ListingStatus,
								item_type: match.matched_listing_category,
								item_subtype: match.matched_listing_subcategory,
								location: match.matched_listing_location,
								created_at: match.matched_listing_created_at,
								description: match.matched_listing_description || '',
								user_id: match.matched_listing_user_id,
								image_url: match.matched_listing_image_url || undefined,
								date: match.matched_listing_created_at,
								extra_details: match.matched_listing_extra_details || undefined
							};
							const right = isUserListingLeft ? {
								id: match.matched_listing_id,
								title: match.matched_listing_title,
								status: match.matched_listing_status as ListingStatus,
								item_type: match.matched_listing_category,
								item_subtype: match.matched_listing_subcategory,
								location: match.matched_listing_location,
								created_at: match.matched_listing_created_at,
								description: match.matched_listing_description || '',
								user_id: match.matched_listing_user_id,
								image_url: match.matched_listing_image_url || undefined,
								date: match.matched_listing_created_at,
								extra_details: match.matched_listing_extra_details || undefined
							} : {
								id: match.listing_id,
								title: match.listing_title,
								status: match.listing_status as ListingStatus,
								item_type: match.listing_category,
								item_subtype: match.listing_subcategory,
								location: match.listing_location,
								created_at: match.listing_created_at,
								description: match.listing_description || '',
								user_id: match.listing_user_id,
								image_url: match.listing_image_url || undefined,
								date: match.listing_created_at,
								extra_details: match.listing_extra_details || undefined
							};
							return (
								<MatchLayout key={match.match_id}>
									{/* User's listing */}
									<MatchCard>
										<ListingCard listing={left} showActions={false} />
									</MatchCard>
									{/* Match score and reasons in the center */}
									<MatchCenter>
										<MatchScore $score={match.score} style={{ fontSize: '1.3rem', marginBottom: 8 }}>
											<ScoreBar $score={match.score} />
											{Math.round(match.score * 100)}% Match
										</MatchScore>
										{match.match_reasons.length > 0 && (
											<MatchReasons style={{ justifyContent: 'center' }}>
												{match.match_reasons.map((reason, index) => (
													<ReasonTag key={index}>{reason}</ReasonTag>
												))}
											</MatchReasons>
										)}
									</MatchCenter>
									{/* Matching listing */}
									<MatchCard>
										<ListingCard listing={right} showActions={false} />
									</MatchCard>
								</MatchLayout>
							);
						})}
					</MatchGroup>
				))
			)}
		</Container>
	);
} 