'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addListing } from '../../lib/listings';
import { getCurrentUser } from '../../lib/auth';
import { uploadListingImage } from '../../lib/storage';
import type { CreateListingData, User } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';
import styled from 'styled-components';
// Removed unused Link import
import SignInModal from '../../components/SignInModal';
import LocationPicker from '../../components/LocationPicker';

const PageContainer = styled.div`
  min-height: 80vh;
  background: linear-gradient(to bottom, #e0e7ef 30%, #fff 100%);
  padding: 2.5rem 0.5rem;
`;
const FormContainer = styled.div`
  max-width: 36rem;
  margin: 0 auto;
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
  padding: 2.5rem 2rem;
  border: 1px solid #dbeafe;
`;
const Heading = styled.h1`
  font-size: 2.25rem;
  font-weight: 800;
  color: #111;
  margin-bottom: 2rem;
  text-align: center;
`;
const Label = styled.label`
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
  margin-bottom: 0.5rem;
`;
const StyledInput = styled.input`
  width: 100%;
  border: 1px solid #bbb;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
  color: #111;
  background: #fff;
  margin-bottom: 1rem;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px #bfdbfe;
  }
`;
const StyledSelect = styled.select`
  width: 100%;
  border: 1px solid #bbb;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
  color: #111;
  background: #fff;
  margin-bottom: 1rem;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px #bfdbfe;
  }
`;
const StyledTextArea = styled.textarea`
  width: 100%;
  border: 1px solid #bbb;
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
  color: #111;
  background: #fff;
  margin-bottom: 1rem;
  resize: vertical;
  min-height: 100px;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px #bfdbfe;
  }
`;
const SubmitButton = styled.button`
  width: 100%;
  background: #2563eb;
  color: #fff;
  padding: 0.9rem 0;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 1.2rem;
  border: none;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  transition: background 0.2s;
  &:hover {
    background: #1d4ed8;
  }
  &:disabled {
    opacity: 0.5;
  }
`;
const ErrorMsg = styled.p`
  color: #111;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  margin-top: 1rem;
`;
const UploadBox = styled.div`
  width: 100%;
  border: 2px dashed #bbb;
  border-radius: 0.75rem;
  padding: 1.5rem 1rem;
  text-align: center;
  background: #f1f5f9;
  margin-bottom: 1rem;
`;
const UploadLabel = styled.label`
  cursor: pointer;
  color: #2563eb;
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
`;
const UploadedImage = styled.img`
  display: block;
  margin: 0.5rem auto 1rem auto;
  max-width: 180px;
  max-height: 180px;
  border-radius: 0.75rem;
  border: 2px solid #dbeafe;
`;
const RemoveButton = styled.button`
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  padding: 0.25rem 0.75rem;
  font-size: 1rem;
  margin-top: 0.5rem;
  cursor: pointer;
  &:hover { background: #b91c1c; }
`;
// Removed unused styled components

async function triggerEmbedding(listingId: string, imageUrl: string, item_type: string, item_subtype: string) {
	if (!imageUrl) return;
	await fetch('/api/generate-embedding', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ listingId, imageUrl, item_type, item_subtype })
	});
}

// Placeholder for fetching user notification preferences
async function getUserNotificationPrefs(userId: string) {
	// TODO: Replace with real preferences fetch
	return { webNotifications: true };
}

export default function CreateListingPage() {
	const router = useRouter();
	const [formData, setFormData] = useState<CreateListingData>({
		title: '',
		description: '',
		status: 'lost',
		location: '',
		date: new Date().toISOString().split('T')[0],
		image_url: ''
	});
	const [locationData, setLocationData] = useState<{ address: string; lat: number | undefined; lng: number | undefined }>({ address: '', lat: undefined, lng: undefined });
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [user, setUser] = useState<User | null>(null);
	const [showSignIn, setShowSignIn] = useState(false);
	const ITEM_TYPES = [
		{ value: 'electronics', label: 'Electronics', subtypes: ['Phone', 'Laptop', 'Tablet', 'Headphones', 'Other'] },
		{ value: 'bags', label: 'Bags', subtypes: ['Backpack', 'Handbag', 'Suitcase', 'Wallet', 'Other'] },
		{ value: 'pets', label: 'Pets', subtypes: ['Dog', 'Cat', 'Bird', 'Other'] },
		{ value: 'keys', label: 'Keys', subtypes: ['Car Key', 'House Key', 'Other'] },
		{ value: 'jewelry', label: 'Jewelry', subtypes: ['Ring', 'Necklace', 'Watch', 'Other'] },
		{ value: 'clothing', label: 'Clothing', subtypes: ['Jacket', 'Shirt', 'Shoes', 'Other'] },
		{ value: 'documents', label: 'Documents', subtypes: ['ID', 'Passport', 'Card', 'Other'] },
		{ value: 'toys', label: 'Toys', subtypes: ['Action Figure', 'Doll', 'Plushie', 'Other'] },
		{ value: 'other', label: 'Other', subtypes: ['Other'] },
	];
	const [selectedType, setSelectedType] = useState<string>('');
	const [selectedSubtype, setSelectedSubtype] = useState<string>('');
	const [customType, setCustomType] = useState('');
	const [customSubtype, setCustomSubtype] = useState('');
	// Map of category to extra fields
	const CATEGORY_FIELDS: Record<string, { label: string; name: string; type?: string; placeholder?: string; }[]> = {
		electronics: [
			{ label: 'Brand or model', name: 'brand_model' },
			{ label: 'Color', name: 'color' },
			{ label: 'Accessories or case details', name: 'accessories' },
			{ label: 'Any lock screen image or sticker?', name: 'lock_screen' },
		],
		bags: [
			{ label: 'Brand', name: 'brand' },
			{ label: 'Color or pattern', name: 'color_pattern' },
			{ label: 'Contents inside', name: 'contents' },
			{ label: 'Signs of wear/damage?', name: 'wear_damage' },
		],
		pets: [
			{ label: 'Breed', name: 'breed' },
			{ label: 'Color', name: 'color' },
			{ label: 'Collar/microchip info', name: 'collar_microchip' },
			{ label: 'Size (small, medium, large)', name: 'size' },
			{ label: 'Behavior traits', name: 'behavior' },
		],
		keys: [
			{ label: 'Number of keys', name: 'num_keys', type: 'number', placeholder: 'e.g. 3' },
			{ label: 'Keychain/fob description', name: 'keychain' },
			{ label: 'Any unique labels or logos?', name: 'labels_logos' },
		],
		jewelry: [
			{ label: 'Material (gold, silver, etc.)', name: 'material' },
			{ label: 'Engravings or inscriptions', name: 'engraving' },
			{ label: 'Size or fit notes (optional)', name: 'size_fit' },
		],
		clothing: [
			{ label: 'Brand and size', name: 'brand_size' },
			{ label: 'Color/pattern', name: 'color_pattern' },
			{ label: 'Notable logos, text, or tags', name: 'logos_tags' },
		],
		documents: [
			{ label: 'Type of document (passport, ID, etc.)', name: 'doc_type' },
			{ label: 'Issuing authority (e.g. state, school)', name: 'issuing_authority' },
			{ label: 'Holder name initials or partial info', name: 'holder_initials' },
		],
		toys: [
			{ label: 'Brand or character name', name: 'brand_character' },
			{ label: 'Color and size', name: 'color_size' },
			{ label: 'Any damage or accessories included?', name: 'damage_accessories' },
		],
		other: [
			{ label: 'Free-text description', name: 'other_details' },
			{ label: 'Any unique identifiers or features', name: 'unique_features' },
		],
	};
	const [extraFields, setExtraFields] = useState<Record<string, string>>({});

	useEffect(() => {
		const checkAuth = async () => {
			const currentUser = await getCurrentUser();
			if (!currentUser) {
				setShowSignIn(true);
				return;
			}
			setUser(currentUser);
		};
		checkAuth();
	}, [router]);

	const handleSignInSuccess = () => {
		setShowSignIn(false);
		// Re-run the auth/profile check
		setTimeout(() => window.location.reload(), 100);
	};

	// Show modal if not signed in
	if (showSignIn) {
		return (
			<SignInModal
				open={showSignIn}
				onClose={() => router.push('/')}
				onSignIn={handleSignInSuccess}
			/>
		);
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!file.type.startsWith('image/')) {
				setError('Please select an image file');
				return;
			}
			if (file.size > 5 * 1024 * 1024) {
				setError('Image size must be less than 5MB');
				return;
			}
			setSelectedFile(file);
			setError('');
			const reader = new FileReader();
			reader.onload = (e) => {
				setImagePreview(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const type = e.target.value;
		setSelectedType(type);
		setSelectedSubtype('');
		setCustomType('');
		setCustomSubtype('');
		setFormData(prev => ({ ...prev, item_type: type, item_subtype: '' }));
	};
	const handleSubtypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const subtype = e.target.value;
		setSelectedSubtype(subtype);
		setCustomSubtype('');
		setFormData(prev => ({ ...prev, item_subtype: subtype }));
	};

	const removeImage = () => {
		setSelectedFile(null);
		setImagePreview('');
		setFormData(prev => ({ ...prev, image_url: '' }));
	};

	const handleExtraFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setExtraFields(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			if (!formData.item_type || !formData.title.trim() || !formData.description.trim() || !locationData.address.trim() || !formData.date) {
				throw new Error('Please fill in all required fields');
			}
			if (locationData.lat === undefined || locationData.lng === undefined) {
				throw new Error('Please select a valid location on the map.');
			}
			if (formData.status === 'found' && !selectedFile) {
				throw new Error('A photo is required for found items.');
			}

			let imageUrl = '';
			if (selectedFile && user) {
				imageUrl = await uploadListingImage(selectedFile, user.id);
			}

			const listingData = {
				...formData,
				location: locationData.address,
				location_lat: locationData.lat,
				location_lng: locationData.lng,
				image_url: imageUrl,
				extra_details: Object.keys(extraFields).length > 0 ? extraFields : null
			};

			const newListing = await addListing(listingData);
			await triggerEmbedding(
				newListing.id,
				newListing.image_url || '',
				newListing.item_type || '',
				newListing.item_subtype || ''
			);

			// --- AI MATCHING & NOTIFICATIONS ---
			await fetch('/functions/v1/create-matches-for-listing', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ listingId: newListing.id }),
			});
			// --- END AI MATCHING & NOTIFICATIONS ---

			router.push('/');
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to create listing';
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setExtraFields({});
	}, [formData.item_type]);

	if (!user) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
				<LoadingSpinner size="lg" text="Checking authentication..." />
			</div>
		);
	}

	return (
		<PageContainer>
			<FormContainer>
				<Heading>Create New Listing</Heading>
				<form onSubmit={handleSubmit}>
					{/* Status */}
					<div>
						<Label>Status *</Label>
						<StyledSelect
							name="status"
							value={formData.status}
							onChange={handleInputChange}
							required
						>
							<option value="lost">Lost Item</option>
							<option value="found">Found Item</option>
						</StyledSelect>
					</div>
					{/* Category */}
					<div>
						<Label>Category *</Label>
						<StyledSelect
							name="item_type"
							value={formData.item_type || ''}
							onChange={handleTypeChange}
							required
						>
							<option value="" disabled>Select a category</option>
							{ITEM_TYPES.map(type => (
								<option key={type.value} value={type.value}>{type.label}</option>
							))}
						</StyledSelect>
						{formData.item_type === 'other' && (
							<StyledInput
								type="text"
								placeholder="Enter custom category"
								value={customType}
								onChange={e => {
									setCustomType(e.target.value);
									setFormData(prev => ({ ...prev, item_type: e.target.value }));
								}}
								required
								style={{ marginTop: 8 }}
							/>
						)}
					</div>
					{/* Subcategory */}
					<div>
						<Label>Subcategory</Label>
						<StyledSelect
							name="item_subtype"
							value={formData.item_subtype || ''}
							onChange={handleSubtypeChange}
							disabled={!formData.item_type || formData.item_type === 'other'}
						>
							<option value="">{formData.item_type && formData.item_type !== 'other' ? 'Select a subcategory' : 'Select a category first'}</option>
							{ITEM_TYPES.find(t => t.value === formData.item_type)?.subtypes.map(sub => (
								<option key={sub} value={sub}>{sub}</option>
							))}
						</StyledSelect>
						{((formData.item_type === 'other') || (formData.item_subtype === 'Other' && formData.item_type !== 'other')) && (
							<StyledInput
								type="text"
								placeholder="Enter custom subcategory"
								value={customSubtype}
								onChange={e => {
									setCustomSubtype(e.target.value);
									setFormData(prev => ({ ...prev, item_subtype: e.target.value }));
								}}
								required
								style={{ marginTop: 8 }}
							/>
						)}
					</div>
					{/* Title */}
					<div>
						<Label>Title *</Label>
						<StyledInput
							type="text"
							name="title"
							value={formData.title}
							onChange={handleInputChange}
							placeholder="Brief description of the item"
							required
						/>
					</div>
					{/* Location */}
					<div>
						<LocationPicker
							value={locationData}
							onChange={setLocationData}
							label="Location *"
							required
						/>
					</div>
					{/* Date */}
					<div>
						<Label>Date *</Label>
						<StyledInput
							type="date"
							name="date"
							value={formData.date}
							onChange={handleInputChange}
							required
						/>
					</div>
					{/* Item Details (category-specific) */}
					{formData.item_type && CATEGORY_FIELDS[formData.item_type] && (
						<div style={{ margin: '1.2rem 0 0.7rem 0', padding: '1rem', background: '#f8fafc', borderRadius: '0.7rem', border: '1px solid #e0e7ef' }}>
							<div style={{ fontWeight: 700, fontSize: '1.08rem', marginBottom: 8, color: '#2563eb' }}>Item Details</div>
							{CATEGORY_FIELDS[formData.item_type].map(field => (
								<div key={field.name} style={{ marginBottom: 10 }}>
									<Label>{field.label}</Label>
									<StyledInput
										type={field.type || 'text'}
										name={field.name}
										value={extraFields[field.name] || ''}
										onChange={handleExtraFieldChange}
										placeholder={field.placeholder || ''}
									/>
								</div>
							))}
						</div>
					)}
					{/* Extra Details/Description */}
					<div>
						<Label>Extra Details / Description *</Label>
						<StyledTextArea
							name="description"
							value={formData.description}
							onChange={handleInputChange}
							placeholder="Detailed description of the item"
							rows={4}
							required
						/>
					</div>
					{/* Image Upload */}
					<div>
						<Label>
							Item Image{formData.status === 'found' ? ' (Required for Found Items)' : ' (Optional)'}
						</Label>
						{!imagePreview && (
							<div style={{ color: '#2563eb', fontSize: '0.97rem', marginBottom: 6 }}>
								Adding a photo improves your chances of someone recognizing your item.
							</div>
						)}
						{!imagePreview ? (
							<UploadBox
								onDragOver={e => {
									e.preventDefault();
									e.stopPropagation();
								}}
								onDrop={e => {
									e.preventDefault();
									e.stopPropagation();
									if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
										const file = e.dataTransfer.files[0];
										if (!file.type.startsWith('image/')) {
											setError('Please select an image file');
											return;
										}
										if (file.size > 5 * 1024 * 1024) {
											setError('Image size must be less than 5MB');
											return;
										}
										setSelectedFile(file);
										setError('');
										const reader = new FileReader();
										reader.onload = (ev) => {
											setImagePreview(ev.target?.result as string);
										};
										reader.readAsDataURL(file);
									}
								}}
							>
								<input
									type="file"
									accept="image/*"
									onChange={handleFileChange}
									style={{ display: 'none' }}
									id="image-upload"
								/>
								<UploadLabel htmlFor="image-upload">
									Click to upload or drag and drop
								</UploadLabel>
								<div style={{ color: '#666', fontSize: '0.95rem' }}>PNG, JPG, GIF up to 5MB</div>
								{formData.status === 'found' && (
									<div style={{ color: '#dc2626', fontSize: '0.95rem', marginTop: '0.5rem' }}>
										* Required for found items
									</div>
								)}
								{formData.status === 'lost' && (
									<div style={{ color: '#2563eb', fontSize: '0.95rem', marginTop: '0.5rem' }}>
										Adding a picture helps others identify your lost item. If you don't have a photo, consider uploading a similar image from Google or the product website.
									</div>
								)}
							</UploadBox>
						) : (
							<UploadBox>
								<UploadedImage src={imagePreview} alt="Preview" />
								<RemoveButton type="button" onClick={removeImage}>Remove</RemoveButton>
								<div style={{ color: '#666', fontSize: '0.95rem', marginTop: '0.5rem' }}>Selected: {selectedFile?.name}</div>
							</UploadBox>
						)}
					</div>
					{/* Error Message */}
					{error && <ErrorMsg>{error}</ErrorMsg>}
					{/* Buttons */}
					<div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
						<SubmitButton type="submit" disabled={loading}>
							{loading ? 'Submitting...' : 'Create Listing'}
						</SubmitButton>
						<button
							type="button"
							onClick={() => router.back()}
							style={{ padding: '0.9rem 2rem', border: '1px solid #bbb', borderRadius: '0.5rem', background: '#f1f5f9', color: '#111', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer' }}
						>
							Cancel
						</button>
					</div>
				</form>
			</FormContainer>
		</PageContainer>
	);
}
