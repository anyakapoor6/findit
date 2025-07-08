'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addListing } from '../../lib/listings';
import { getCurrentUser } from '../../lib/auth';
import { uploadListingImage } from '../../lib/storage';
import type { CreateListingData } from '../../lib/types';
import LoadingSpinner from '../../components/LoadingSpinner';

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
	const [user, setUser] = useState<any>(null);

	useEffect(() => {
		const checkAuth = async () => {
			const currentUser = await getCurrentUser();
			if (!currentUser) {
				router.push('/auth');
				return;
			}
			setUser(currentUser);
		};
		checkAuth();
	}, [router]);

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
		} catch (err: any) {
			setError(err.message || 'Failed to create listing');
		} finally {
			setLoading(false);
		}
	};

	if (!user) {
		return (
			<div className="flex justify-center items-center min-h-[60vh]">
				<LoadingSpinner size="lg" text="Checking authentication..." />
			</div>
		);
	}

	return (
		<div className="max-w-md mx-auto px-4">
			<div className="bg-white rounded-lg shadow-md p-8">
				<h1 className="text-3xl font-bold mb-6 text-center">Create New Listing</h1>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Status */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
						<select
							name="status"
							value={formData.status}
							onChange={handleInputChange}
							className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						>
							<option value="lost">Lost Item</option>
							<option value="found">Found Item</option>
						</select>
					</div>

					{/* Title */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
						<input
							type="text"
							name="title"
							value={formData.title}
							onChange={handleInputChange}
							placeholder="Brief description of the item"
							className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					{/* Description */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
						<textarea
							name="description"
							value={formData.description}
							onChange={handleInputChange}
							placeholder="Detailed description of the item"
							rows={4}
							className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					{/* Location */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
						<input
							type="text"
							name="location"
							value={formData.location}
							onChange={handleInputChange}
							placeholder="Where the item was lost/found"
							className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					{/* Date */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
						<input
							type="date"
							name="date"
							value={formData.date}
							onChange={handleInputChange}
							className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							required
						/>
					</div>

					{/* Image Upload */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Item Image (Optional)
						</label>

						{!imagePreview ? (
							<div className="w-40 sm:w-56 mx-auto border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
								<input
									type="file"
									accept="image/*"
									onChange={handleFileChange}
									className="hidden"
									id="image-upload"
								/>
								<label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center space-y-2">
									<svg
										className="w-8 h-8 text-gray-400 inline-block"
										style={{ width: '2rem', height: '2rem', minWidth: '2rem', minHeight: '2rem' }}
										stroke="currentColor"
										fill="none"
										viewBox="0 0 48 48"
									>
										<path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
									</svg>
									<div className="text-gray-600">
										<span className="font-medium">Click to upload</span> or drag and drop
									</div>
									<p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
								</label>
							</div>
						) : (
							<div className="space-y-4">
								<div className="flex justify-center">
									<div className="relative w-32 h-32 sm:w-48 sm:h-48">
										<img
											src={imagePreview}
											alt="Preview"
											className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-lg border-2 border-gray-200"
										/>
										<button
											type="button"
											onClick={removeImage}
											className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-red-600 transition-colors text-xs sm:text-sm font-bold"
										>
											×
										</button>
									</div>
								</div>
								<p className="text-sm text-gray-500 text-center">
									Selected: {selectedFile?.name}
								</p>
							</div>
						)}
					</div>

					{/* Error Message */}
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
							{error}
						</div>
					)}

					{/* Buttons */}
					<div className="flex gap-4">
						<button
							type="submit"
							disabled={loading}
							className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{loading ? 'Creating...' : 'Create Listing'}
						</button>
						<button
							type="button"
							onClick={() => router.back()}
							className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
