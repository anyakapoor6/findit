import { Suspense } from 'react';
import ProfilePageContent from './ProfilePageContent';

export default function ProfilePage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<ProfilePageContent />
		</Suspense>
	);
} 