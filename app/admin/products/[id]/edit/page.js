'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, X, ArrowLeft, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getDocument, updateDocument, getAllDocuments } from '@/lib/supabase/db';
import { uploadMultipleImages, deleteMultipleImages } from '@/lib/cloudinary/upload';

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        original_price: '',
        category: '',
        stock: '',
        featured: false,
        is_active: true,
    });

    useEffect(() => {
        loadProduct();
        loadCategories();
    }, [params.id]);

    async function loadProduct() {
        const { data, error } = await getDocument('products', params.id);
        if (data) {
            setFormData({
                name: data.name || '',
                description: data.description || '',
                price: data.price?.toString() || '',
                original_price: data.original_price?.toString() || '',
                category: data.category || '',
                stock: data.stock?.toString() || '',
                featured: data.featured || false,
                is_active: data.is_active !== undefined ? data.is_active : true,
            });
            setExistingImages(data.images || []);
        }
        setLoading(false);
    }

    async function loadCategories() {
        const { data } = await getAllDocuments('categories');
        setCategories(data || []);
    }

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles(prev => [...prev, ...files]);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreviews(prev => [...prev, e.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeNewImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Upload new images
            let newImageUrls = [];
            if (imageFiles.length > 0) {
                const { urls, error } = await uploadMultipleImages(imageFiles, 'products/');
                if (error) {
                    alert('Failed to upload images: ' + error);
                    setSaving(false);
                    return;
                }
                newImageUrls = urls;
            }

            // Combine existing and new images
            const allImages = [...existingImages, ...newImageUrls];

            // Update product
            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                original_price: formData.original_price ? parseFloat(formData.original_price) : parseFloat(formData.price),
                category: formData.category,
                stock: parseInt(formData.stock),
                featured: formData.featured,
                is_active: formData.is_active,
                images: allImages,
            };

            const { error } = await updateDocument('products', params.id, productData);

            if (error) {
                alert('Failed to update product: ' + error);
            } else {
                alert('Product updated successfully!');
                router.push('/admin/products');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-neutral-600">Loading product...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Edit Product</h1>
                    <p className="text-neutral-600 mt-1">Update product information</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Images */}
                <div className="bg-white rounded-lg shadow-card p-6">
                    <h2 className="font-semibold text-lg mb-4">Product Images</h2>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                        <div>
                            <p className="text-sm text-neutral-600 mb-2">Current Images</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                {existingImages.map((url, index) => (
                                    <div key={index} className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden group">
                                        <img src={url} alt={`Existing ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(index)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Images */}
                    {imagePreviews.length > 0 && (
                        <div>
                            <p className="text-sm text-neutral-600 mb-2">New Images</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden group">
                                        <img src={preview} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeNewImage(index)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                        <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                        <span className="text-sm text-neutral-600">Add more images</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-card p-6 space-y-4">
                    <h2 className="font-semibold text-lg mb-4">Basic Information</h2>

                    <Input
                        label="Product Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                        >
                            <option value="">Select a category</option>
                            <option value="Earrings">Earrings</option>
                            <option value="Necklaces">Necklaces</option>
                            <option value="Bangles">Bangles</option>
                            <option value="Rings">Rings</option>
                            <option value="Bridal">Bridal</option>
                            <option value="Festive">Festive</option>
                        </select>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-lg shadow-card p-6 space-y-4">
                    <h2 className="font-semibold text-lg mb-4">Pricing</h2>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                            label="Sale Price"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                        />

                        <Input
                            label="Original Price (Optional)"
                            type="number"
                            value={formData.original_price}
                            onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                        />
                    </div>
                </div>

                {/* Inventory */}
                <div className="bg-white rounded-lg shadow-card p-6 space-y-4">
                    <h2 className="font-semibold text-lg mb-4">Inventory</h2>

                    <Input
                        label="Stock Quantity"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        required
                    />

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 text-green-600 border-neutral-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-neutral-700">
                            Active Status
                            <span className="block text-xs text-neutral-500 font-normal">Enable to show this product to customers</span>
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="featured"
                            checked={formData.featured}
                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                            className="w-5 h-5 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="featured" className="text-sm font-medium text-neutral-700">
                            Mark as Featured Product
                        </label>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" loading={saving} className="flex-1">
                        Update Product
                    </Button>
                </div>
            </form>
        </div>
    );
}
