import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript } from '../utils/loadGoogleMapsScript';

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

	// Load Google Maps script only once using the utility
	useEffect(() => {
		let isMounted = true;
		loadGoogleMapsScript(MAPS_API_KEY as string, ['places']).then(() => {
			if (!isMounted) return;
			if (!inputRef.current || !mapRef.current) return;
			const google = (window as any).google;
			if (!google?.maps?.places) return;
			const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
				types: ['geocode'],
				componentRestrictions: { country: 'us' },
			});
			autocomplete.addListener('place_changed', () => {
				const place = autocomplete.getPlace();
				if (!place.geometry) return;
				const lat = place.geometry.location.lat();
				const lng = place.geometry.location.lng();
				onChange({ address: place.formatted_address || '', lat, lng });
				if (map) {
					map.setCenter({ lat, lng });
					map.setZoom(15);
				}
				if (marker) {
					marker.setPosition({ lat, lng });
				}
			});
			// Initialize map
			if (!map) {
				const gmap = new google.maps.Map(mapRef.current, {
					center: value.lat !== undefined && value.lng !== undefined ? { lat: value.lat, lng: value.lng } : { lat: 37.7749, lng: -122.4194 },
					zoom: value.lat !== undefined && value.lng !== undefined ? 15 : 10,
					mapTypeControl: false,
					streetViewControl: false,
				});
				setMap(gmap);
				const gmarker = new google.maps.Marker({
					map: gmap,
					position: value.lat !== undefined && value.lng !== undefined ? { lat: value.lat, lng: value.lng } : undefined,
					draggable: true,
				});
				setMarker(gmarker);
				gmarker.addListener('dragend', () => {
					const pos = gmarker.getPosition();
					if (pos) {
						onChange({ address: value.address, lat: pos.lat(), lng: pos.lng() });
					}
				});
			}
		});
		return () => { isMounted = false; };
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
			<div style={{ display: 'flex', gap: '0.5rem', marginBottom: 10, alignItems: 'center' }}>
				<input
					ref={inputRef}
					type="text"
					placeholder="Start typing an address..."
					value={value.address}
					onChange={e => onChange({ ...value, address: e.target.value })}
					required={required}
					style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #bbb', fontSize: '1.1rem' }}
				/>
				<button
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
					style={{
						padding: '0.75rem 1rem',
						borderRadius: 8,
						border: '1px solid #2563eb',
						background: '#2563eb',
						color: 'white',
						fontSize: '1rem',
						cursor: 'pointer',
						whiteSpace: 'nowrap',
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						fontWeight: 500
					}}
					title="Use my current location"
				>
					<span style={{ fontSize: '1.25rem', lineHeight: 1 }}>📍</span>
					<span style={{ fontSize: '1rem', color: 'white' }}>Use my current location</span>
				</button>
			</div>
			<div ref={mapRef} style={{ width: '100%', height: 220, borderRadius: 10, border: '1px solid #dbeafe' }} />
			{value.lat !== undefined && value.lng !== undefined && (
				<div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
					Selected: {value.address} ({value.lat.toFixed(5)}, {value.lng.toFixed(5)})
				</div>
			)}
		</div>
	);
};

export default LocationPicker; 