let googleMapsScriptLoadingPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(apiKey: string, libraries: string[] = ['places']): Promise<void> {
	if (typeof window === 'undefined') return Promise.resolve();
	if ((window as any).google?.maps) return Promise.resolve();
	if (googleMapsScriptLoadingPromise) return googleMapsScriptLoadingPromise;

	googleMapsScriptLoadingPromise = new Promise((resolve, reject) => {
		const script = document.createElement('script');
		const libParam = libraries.length ? `&libraries=${libraries.join(',')}` : '';
		script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${libParam}`;
		script.async = true;
		script.onload = () => {
			if ((window as any).google?.maps) {
				resolve();
			} else {
				reject(new Error('Google Maps script loaded but google.maps is not available.'));
			}
		};
		script.onerror = (err) => reject(err);
		document.body.appendChild(script);
	});

	return googleMapsScriptLoadingPromise;
} 