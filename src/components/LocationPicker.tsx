import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { loadGoogleMapsScript } from '../utils/loadGoogleMapsScript';

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 10px;
  align-items: stretch;
  
  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
`;

const LocationInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #bbb;
  font-size: 1.1rem;
  min-width: 0;
`;

const LocationButton = styled.button`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  min-width: fit-content;
`;

const ButtonText = styled.span`
  font-size: 1rem;
  color: white;
  
  @media (max-width: 640px) {
    display: none;
  }
`;

const ButtonIcon = styled.span`
  font-size: 1rem;
  color: white;
  
  @media (min-width: 641px) {
    display: none;
  }
`;

interface LocationPickerProps {
	value: { address: string; lat: number | undefined; lng: number | undefined };
	onChange: (value: { address: string; lat: number | undefined; lng: number | undefined }) => void;
	label?: string;
	required?: boolean;
}

const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange, label = 'Location', required }) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const mapRef = useRef<HTMLDivElement>(null);
	// Use 'any' for Google Maps objects to avoid TypeScript errors
	const [map, setMap] = useState<any>(null);
	const [marker, setMarker] = useState<any>(null);

	// Load Google Maps script and initialize map/marker
	useEffect(() => {
		let isMounted = true;
		let currentMarker: any = null;
		let currentMap: any = null;
		let autocomplete: any = null;

		loadGoogleMapsScript(MAPS_API_KEY as string, ['places']).then(() => {
			// MOVED: Early return logic inside the effect to avoid breaking hooks order
			if (isMounted && inputRef.current && mapRef.current) {
				const google = (window as any).google;
				// MOVED: Early return logic inside the effect to avoid breaking hooks order
				if (google?.maps?.places) {
					// Initialize autocomplete
					autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
						types: ['geocode'],
						componentRestrictions: { country: 'us' },
					});
					autocomplete.addListener('place_changed', () => {
						const place = autocomplete.getPlace();
						// MOVED: Early return logic inside the effect to avoid breaking hooks order
						if (place.geometry && currentMap && currentMarker) {
							const lat = place.geometry.location.lat();
							const lng = place.geometry.location.lng();
							onChange({ address: place.formatted_address || '', lat, lng });
							currentMap.setCenter({ lat, lng });
							currentMap.setZoom(15);
							currentMarker.setPosition({ lat, lng });
						}
					});

					// Initialize map only once
					if (!map) {
						const gmap = new google.maps.Map(mapRef.current, {
							center: value.lat !== undefined && value.lng !== undefined ? { lat: value.lat, lng: value.lng } : { lat: 37.7749, lng: -122.4194 },
							zoom: value.lat !== undefined && value.lng !== undefined ? 15 : 10,
							mapTypeControl: false,
							streetViewControl: false,
						});
						currentMap = gmap;
						setMap(gmap);

						// Create only one marker
						const gmarker = new google.maps.Marker({
							map: gmap,
							position: value.lat !== undefined && value.lng !== undefined ? { lat: value.lat, lng: value.lng } : undefined,
							draggable: true,
						});
						currentMarker = gmarker;
						setMarker(gmarker);

						gmarker.addListener('dragend', () => {
							const pos = gmarker.getPosition();
							if (pos) {
								onChange({ address: value.address, lat: pos.lat(), lng: pos.lng() });
							}
						});
					}
				}
			}
		});

		// Cleanup function
		return () => {
			isMounted = false;
			if (currentMarker) {
				currentMarker.setMap(null);
			}
			if (autocomplete && (window as any).google?.maps?.event) {
				(window as any).google.maps.event.clearInstanceListeners(autocomplete);
			}
		};
		// eslint-disable-next-line
	}, []);

	// Update marker position if value changes
	useEffect(() => {
		if (marker && value.lat !== undefined && value.lng !== undefined) {
			marker.setPosition({ lat: value.lat, lng: value.lng });
			if (map) map.setCenter({ lat: value.lat, lng: value.lng });
		}
	}, [value.lat, value.lng, marker, map]);

	return (
		<div style={{ marginBottom: 20 }}>
			{label && (
				<label style={{ fontWeight: 600, marginBottom: 6, display: 'block', color: '#111' }}>
					{label}
				</label>
			)}
			<InputContainer>
				<LocationInput
					ref={inputRef}
					type="text"
					placeholder="Start typing an address..."
					value={value.address}
					onChange={e => onChange({ ...value, address: e.target.value })}
					required={required}
				/>
				<LocationButton
					type="button"
					onClick={() => {
						if (navigator.geolocation) {
							navigator.geolocation.getCurrentPosition(
								(position) => {
									const { latitude, longitude } = position.coords;
									// Reverse geocode to get address
									const geocoder = new (window as any).google.maps.Geocoder();
									geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any, status: any) => {
										if (status === 'OK' && results[0]) {
											onChange({
												address: results[0].formatted_address,
												lat: latitude,
												lng: longitude
											});
										}
									});
								},
								(error) => {
									console.error('Geolocation error:', error);
								}
							);
						}
					}}
					title="Use my current location"
				>
					<span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📍</span>
					<ButtonText>Use my current location</ButtonText>
					<ButtonIcon>📍</ButtonIcon>
				</LocationButton>
			</InputContainer>
			<div ref={mapRef} style={{ width: '100%', height: 220, borderRadius: 10, border: '1px solid #dbeafe' }} />
			{typeof value.lat === 'number' && typeof value.lng === 'number' && (
				<div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
					Selected: {value.address} ({value.lat.toFixed(5)}, {value.lng.toFixed(5)})
				</div>
			)}
		</div>
	);
};

export default LocationPicker; 