'use client';
import { useEffect, useState, useRef } from 'react';
import { fetchListings } from '../../lib/listings';
import type { Listing } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import styled from 'styled-components';
import Link from 'next/link';
import { loadGoogleMapsScript } from '../../utils/loadGoogleMapsScript';

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 1rem;
`;

const Header = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #dbeafe;
`;

const Title = styled.h1`
  font-size: 2.25rem;
  font-weight: 800;
  color: #111;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #666;
  text-align: center;
  margin-bottom: 1rem;
`;

const Legend = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #555;
`;

const LegendDot = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$color};
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
`;

const MapContainer = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #dbeafe;
  height: calc(100vh - 200px);
  min-height: 500px;
`;

const InfoWindow = styled.div`
  padding: 1rem;
  max-width: 300px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const InfoTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
  margin-bottom: 0.5rem;
`;

const InfoDescription = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.75rem;
  line-height: 1.4;
`;

const InfoImage = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
`;

const ViewButton = styled(Link)`
  display: inline-block;
  background: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.2s;
  
  &:hover {
    background: #1d4ed8;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
  padding: 2rem;
`;

export default function MapPage() {
	const [listings, setListings] = useState<Listing[]>([]);
	const [loading, setLoading] = useState(true);
	const [scriptLoaded, setScriptLoaded] = useState(false);
	const mapRef = useRef<HTMLDivElement>(null);
	const [map, setMap] = useState<any>(null);
	const [markers, setMarkers] = useState<any[]>([]);
	const [infoWindow, setInfoWindow] = useState<any>(null);

	// Fetch listings
	useEffect(() => {
		const loadListings = async () => {
			try {
				const allListings = await fetchListings();
				// Filter out resolved listings
				const activeListings = allListings.filter(listing => listing.status !== 'resolved');
				setListings(activeListings);
			} catch (error) {
				console.error('Error loading listings:', error);
			} finally {
				setLoading(false);
			}
		};
		loadListings();
	}, []);

	// Initialize map
	useEffect(() => {
		let isMounted = true;
		loadGoogleMapsScript(MAPS_API_KEY as string, []).then(() => {
			if (!isMounted || !mapRef.current || !listings.length) return;

			const google = (window as any).google;

			// Calculate bounds to fit all markers
			const bounds = new google.maps.LatLngBounds();
			const validListings = listings.filter(listing => listing.location_lat && listing.location_lng);

			if (validListings.length === 0) return;

			// Initialize map
			const gmap = new google.maps.Map(mapRef.current, {
				zoom: 10,
				mapTypeControl: false,
				streetViewControl: false,
				fullscreenControl: false,
			});

			// Create info window
			const infoWin = new google.maps.InfoWindow();
			setInfoWindow(infoWin);

			// Create markers
			const newMarkers: any[] = [];

			validListings.forEach(listing => {
				if (!listing.location_lat || !listing.location_lng) return;

				const position = { lat: listing.location_lat, lng: listing.location_lng };
				bounds.extend(position);

				const marker = new google.maps.Marker({
					position,
					map: gmap,
					title: listing.title,
					icon: {
						path: google.maps.SymbolPath.CIRCLE,
						scale: 8,
						fillColor: listing.status === 'lost' ? '#dc2626' : '#16a34a',
						fillOpacity: 1,
						strokeColor: '#ffffff',
						strokeWeight: 2,
					},
				});

				// Create info window content
				const content = `
        <div style="padding: 1rem; max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <h3 style="font-size: 1.1rem; font-weight: 600; color: #111; margin-bottom: 0.5rem;">${listing.title}</h3>
          ${listing.image_url ? `<img src="${listing.image_url}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 0.75rem;" alt="${listing.title}" />` : ''}
          <p style="font-size: 0.9rem; color: #666; margin-bottom: 0.75rem; line-height: 1.4;">${listing.description}</p>
          <a href="/listing/${listing.id}" style="display: inline-block; background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none; font-size: 0.9rem; font-weight: 600;">View Details</a>
        </div>
      `;

				marker.addListener('click', () => {
					infoWin.setContent(content);
					infoWin.open(gmap, marker);
				});

				newMarkers.push(marker);
			});

			setMarkers(newMarkers);
			setMap(gmap);

			// Fit map to bounds
			if (validListings.length > 1) {
				gmap.fitBounds(bounds);
			} else {
				gmap.setCenter(bounds.getCenter());
				gmap.setZoom(15);
			}

			// Cleanup function
			return () => {
				newMarkers.forEach(marker => marker.setMap(null));
			};
		});
		return () => { isMounted = false; };
	}, [listings]);

	if (loading) {
		return (
			<PageContainer>
				<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
					<LoadingSpinner size="lg" text="Loading map..." />
				</div>
			</PageContainer>
		);
	}

	const lostCount = listings.filter(l => l.status === 'lost').length;
	const foundCount = listings.filter(l => l.status === 'found').length;
	const validListings = listings.filter(l => l.location_lat && l.location_lng);

	return (
		<PageContainer>
			<Header>
				<Title>FindIt Map</Title>
				<Subtitle>
					View all active lost and found items on the map
				</Subtitle>
				<Legend>
					<LegendItem>
						<LegendDot $color="#dc2626" />
						<span>Lost Items ({lostCount})</span>
					</LegendItem>
					<LegendItem>
						<LegendDot $color="#16a34a" />
						<span>Found Items ({foundCount})</span>
					</LegendItem>
				</Legend>
			</Header>

			<MapContainer>
				{validListings.length === 0 ? (
					<EmptyState>
						<div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
						<h3 style={{ marginBottom: '0.5rem', color: '#111' }}>No items on the map</h3>
						<p>No active listings have location data yet.</p>
						<Link href="/create-listing" style={{
							marginTop: '1rem',
							background: '#2563eb',
							color: 'white',
							padding: '0.75rem 1.5rem',
							borderRadius: '0.5rem',
							textDecoration: 'none',
							fontWeight: '600'
						}}>
							Create First Listing
						</Link>
					</EmptyState>
				) : (
					<div ref={mapRef} style={{ width: '100%', height: '100%' }} />
				)}
			</MapContainer>
		</PageContainer>
	);
} 