'use client';

import { useState, useEffect } from 'react';
import { Upload, X, Edit, Trash2, Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getAllDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestore';
import { uploadImage, deleteImage } from '@/lib/firebase/storage';

export default function AdminBannersPage() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        imageUrl: '',
        link: '',
        order: 0,
        active: true,
    });

    useEffect(() => {
        loadBanners();
    }, []);

    async function loadBanners() {
        const { data } = await getAllDocuments('banners', {
            orderByField: 'order',
            orderDirection: 'asc',
        });
        setBanners(data || []);
        setLoading(false);
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            let imageUrl = formData.imageUrl;

            // Upload new image if selected
            if (imageFile) {
                const { url, error } = await uploadImage(imageFile, 'banners/');
                if (error) {
                    alert('Failed to upload image: ' + error);
                    setUploading(false);
                    return;
                }
                imageUrl = url;
            }

            const bannerData = {
                ...formData,
                imageUrl,
            };

            if (editingId) {
                await updateDocument('banners', editingId, bannerData);
            } else {
                await createDocument('banners', bannerData);
            }

            loadBanners();
            resetForm();
            alert(editingId ? 'Banner updated successfully' : 'Banner created successfully');
        } catch (error) {
            alert('Error saving banner: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (banner) => {
        setFormData({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            imageUrl: banner.imageUrl || '',
            link: banner.link || '',
            order: banner.order || 0,
            active: banner.active !== false,
        });
        setImagePreview(banner.imageUrl || '');
        setEditingId(banner.id);
        setShowForm(true);
    };

    const handleDelete = async (id, imageUrl) => {
        if (!confirm('Are you sure you want to delete this banner?')) return;

        const { error } = await deleteDocument('banners', id);
        if (!error) {
            // Optionally delete image from storage
            if (imageUrl) {
                await deleteImage(imageUrl);
            }
            setBanners(banners.filter(b => b.id !== id));
            alert('Banner deleted successfully');
        }
    };

    const resetForm = () => {
        setFormData({ title: '', subtitle: '', imageUrl: '', link: '', order: 0, active: true });
        setImageFile(null);
        setImagePreview('');
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Homepage Banners</h1>
                    <p className="text-neutral-600 mt-1">Manage hero banners and promotional slides</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? 'Cancel' : 'Add Banner'}
                </Button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-card p-6 mb-6">
                    <h2 className="font-semibold text-lg mb-4">
                        {editingId ? 'Edit Banner' : 'Add New Banner'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">Banner Image</label>
                            {imagePreview && (
                                <div className="relative mb-4 rounded-lg overflow-hidden bg-neutral-100">
                                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview('');
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50">
                                <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                                <span className="text-sm text-neutral-600">Click to upload banner image</span>
                                <span className="text-xs text-neutral-400 mt-1">Recommended: 1920x600px</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <Input
                            label="Banner Title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="New Collection Arrival"
                        />

                        <Input
                            label="Subtitle (Optional)"
                            value={formData.subtitle}
                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                            placeholder="Shop the latest designs"
                        />

                        <Input
                            label="Link URL (Optional)"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            placeholder="/products?category=new"
                            helperText="Where users will go when clicking the banner"
                        />

                        <Input
                            label="Display Order"
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                            helperText="Lower numbers appear first"
                        />

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="active"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                className="w-5 h-5 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <label htmlFor="active" className="text-sm font-medium text-neutral-700">
                                Active (Show on website)
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={resetForm} disabled={uploading}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={uploading} className="flex-1">
                                {editingId ? 'Update Banner' : 'Create Banner'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Banners List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-lg shadow-card p-8 text-center">
                        <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : banners.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-card p-8 text-center">
                        <p className="text-neutral-500">No banners yet. Create your first banner!</p>
                    </div>
                ) : (
                    banners.map((banner) => (
                        <div key={banner.id} className="bg-white rounded-lg shadow-card overflow-hidden">
                            <div className="flex flex-col sm:flex-row">
                                <div className="w-full sm:w-48 h-32 bg-neutral-100 flex-shrink-0">
                                    {banner.imageUrl ? (
                                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                            No image
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">{banner.title || 'Untitled'}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${banner.active ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'
                                                    }`}>
                                                    {banner.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            {banner.subtitle && (
                                                <p className="text-neutral-600 mb-2">{banner.subtitle}</p>
                                            )}
                                            <div className="text-sm text-neutral-500">
                                                {banner.link && <p>Link: {banner.link}</p>}
                                                <p>Order: {banner.order}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleEdit(banner)}
                                                className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(banner.id, banner.imageUrl)}
                                                className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
