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
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [user, setUser] = useState<User | null>(null);
	const [showSignIn, setShowSignIn] = useState(false);

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

	const removeImage = () => {
		setSelectedFile(null);
		setImagePreview('');
		setFormData(prev => ({ ...prev, image_url: '' }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError('');

		try {
			if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
				throw new Error('Please fill in all required fields');
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
				image_url: imageUrl
			};

			await addListing(listingData);
			router.push('/');
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to create listing';
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

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
					{/* Description */}
					<div>
						<Label>Description *</Label>
						<StyledTextArea
							name="description"
							value={formData.description}
							onChange={handleInputChange}
							placeholder="Detailed description of the item"
							rows={4}
							required
						/>
					</div>
					{/* Location */}
					<div>
						<Label>Location *</Label>
						<StyledInput
							type="text"
							name="location"
							value={formData.location}
							onChange={handleInputChange}
							placeholder="Where the item was lost/found"
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
					{/* Image Upload */}
					<div>
						<Label>
							Item Image{formData.status === 'found' ? ' (Required for Found Items)' : ' (Optional)'}
						</Label>
						{!imagePreview ? (
							<UploadBox>
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
