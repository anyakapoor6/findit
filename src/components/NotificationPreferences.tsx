'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getUserProfile, updateUserProfile } from '../lib/users';
import type { Profile } from '../lib/types';

const Container = styled.div`
  background: #fff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border: 1px solid #dbeafe;
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #111;
`;

const PreferenceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
  
  &:last-child {
    border-bottom: none;
  }
`;

const PreferenceLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PreferenceTitle = styled.span`
  font-weight: 600;
  color: #111;
`;

const PreferenceDescription = styled.span`
  font-size: 0.875rem;
  color: #666;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: #2563eb;
  }
  
  &:checked + span:before {
    transform: translateX(26px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
`;

const SaveButton = styled.button`
  background: #2563eb;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 1rem;
  
  &:hover {
    background: #1d4ed8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  color: #059669;
  font-weight: 600;
  margin-top: 0.5rem;
  font-size: 0.875rem;
`;

interface NotificationPreferencesProps {
	userId: string;
}

export default function NotificationPreferences({ userId }: NotificationPreferencesProps) {
	const [preferences, setPreferences] = useState({
		notify_matches: true,
		notify_claims: true,
		notify_nearby: false
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	useEffect(() => {
		const loadPreferences = async () => {
			try {
				const profile = await getUserProfile(userId);
				if (profile) {
					setPreferences({
						notify_matches: profile.notify_matches ?? true,
						notify_claims: profile.notify_claims ?? true,
						notify_nearby: profile.notify_nearby ?? false
					});
				}
			} catch (error) {
				console.error('Error loading preferences:', error);
			} finally {
				setLoading(false);
			}
		};

		if (userId) {
			loadPreferences();
		}
	}, [userId]);

	const handleToggle = (key: keyof typeof preferences) => {
		setPreferences(prev => ({
			...prev,
			[key]: !prev[key]
		}));
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			await updateUserProfile(userId, preferences);
			setShowSuccess(true);
			setTimeout(() => setShowSuccess(false), 3000);
		} catch (error) {
			console.error('Error saving preferences:', error);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <Container>Loading preferences...</Container>;
	}

	return (
		<Container>
			<Title>Notification Preferences</Title>

			<PreferenceItem>
				<PreferenceLabel>
					<PreferenceTitle>Match Notifications</PreferenceTitle>
					<PreferenceDescription>
						Get notified when we find potential matches for your listings
					</PreferenceDescription>
				</PreferenceLabel>
				<Toggle>
					<ToggleInput
						type="checkbox"
						checked={preferences.notify_matches}
						onChange={() => handleToggle('notify_matches')}
					/>
					<ToggleSlider />
				</Toggle>
			</PreferenceItem>

			<PreferenceItem>
				<PreferenceLabel>
					<PreferenceTitle>Claim Notifications</PreferenceTitle>
					<PreferenceDescription>
						Get notified when someone claims your found items
					</PreferenceDescription>
				</PreferenceLabel>
				<Toggle>
					<ToggleInput
						type="checkbox"
						checked={preferences.notify_claims}
						onChange={() => handleToggle('notify_claims')}
					/>
					<ToggleSlider />
				</Toggle>
			</PreferenceItem>

			<PreferenceItem>
				<PreferenceLabel>
					<PreferenceTitle>Nearby Notifications</PreferenceTitle>
					<PreferenceDescription>
						Get notified about lost/found items in your area
					</PreferenceDescription>
				</PreferenceLabel>
				<Toggle>
					<ToggleInput
						type="checkbox"
						checked={preferences.notify_nearby}
						onChange={() => handleToggle('notify_nearby')}
					/>
					<ToggleSlider />
				</Toggle>
			</PreferenceItem>

			<SaveButton onClick={handleSave} disabled={saving}>
				{saving ? 'Saving...' : 'Save Preferences'}
			</SaveButton>

			{showSuccess && (
				<SuccessMessage>Preferences saved successfully!</SuccessMessage>
			)}
		</Container>
	);
} 