import { useState } from 'react';
import styled from 'styled-components';
import { updateListing } from '../lib/listings';
import type { Listing, CreateListingData } from '../lib/types';
import { uploadListingImage } from '../lib/storage';
import { deleteListing } from '../lib/listings';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
`;
const ModalContent = styled.div`
  background: #fff;
  border-radius: 1.2rem;
  padding: 2.5rem 2rem;
  min-width: 340px;
  max-width: 480px;
  max-height: 90vh;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  color: #111;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;
const Heading = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #111;
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
const CancelButton = styled.button`
  width: 100%;
  background: #f1f5f9;
  color: #222;
  padding: 0.9rem 0;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  margin-bottom: 0.5rem;
  transition: background 0.2s;
  &:hover {
    background: #e0e7ef;
  }
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
const DeleteButton = styled.button`
  width: 100%;
  background: #dc2626;
  color: #fff;
  padding: 0.9rem 0;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  margin-top: 0.5rem;
  transition: background 0.2s;
  &:hover {
    background: #b91c1c;
  }
`;

interface EditListingModalProps {
  listing: Listing;
  onClose: () => void;
  onSave: (updated: Listing) => void;
  onDelete?: (deletedId: string) => void;
}

export default function EditListingModal({ listing, onClose, onSave, onDelete }: EditListingModalProps) {
  const [formData, setFormData] = useState<CreateListingData>({
    title: listing.title,
    description: listing.description,
    status: listing.status,
    location: listing.location,
    date: listing.date.split('T')[0],
    image_url: listing.image_url || ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(listing.image_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.status === 'found' && !imagePreview) {
      setError('Found listings must have an image.');
      return;
    }
    setLoading(true);
    let imageUrl = formData.image_url;
    try {
      if (selectedFile) {
        imageUrl = await uploadListingImage(selectedFile, listing.user_id);
      }
      const updated = await updateListing(listing.id, {
        ...formData,
        image_url: imageUrl
      });
      onSave(updated);
    } catch (err: any) {
      setError('Failed to update listing.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;
    setDeleteLoading(true);
    try {
      await deleteListing(listing.id);
      if (onDelete) onDelete(listing.id);
      onClose();
    } catch (err) {
      setError('Failed to delete listing.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <Heading>Edit Listing</Heading>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="title">Title</Label>
          <StyledInput name="title" value={formData.title} onChange={handleInputChange} required />
          <Label htmlFor="description">Description</Label>
          <StyledTextArea name="description" value={formData.description} onChange={handleInputChange} required />
          <Label htmlFor="status">Status</Label>
          <StyledSelect name="status" value={formData.status} onChange={handleInputChange} required>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </StyledSelect>
          <Label htmlFor="location">Location</Label>
          <StyledInput name="location" value={formData.location} onChange={handleInputChange} required />
          <Label htmlFor="date">Date</Label>
          <StyledInput name="date" type="date" value={formData.date} onChange={handleInputChange} required />
          <Label>Image</Label>
          <UploadBox>
            <UploadLabel htmlFor="edit-listing-image">{imagePreview ? 'Change Image' : 'Upload Image'}</UploadLabel>
            <input id="edit-listing-image" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            {imagePreview && <UploadedImage src={imagePreview} alt="Preview" />}
            {imagePreview && <RemoveButton type="button" onClick={removeImage}>Remove</RemoveButton>}
          </UploadBox>
          {formData.status === 'found' && !imagePreview && (
            <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>
              Found listings must have an image.
            </div>
          )}
          {error && <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>{error}</div>}
          <SubmitButton type="submit" disabled={loading || (formData.status === 'found' && !imagePreview)}>{loading ? 'Saving...' : 'Save Changes'}</SubmitButton>
          <CancelButton type="button" onClick={onClose}>Cancel</CancelButton>
          <DeleteButton type="button" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete Listing'}
          </DeleteButton>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
} 