'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createDocument, getAllDocuments } from '@/lib/firebase/firestore';
import { uploadMultipleImages } from '@/lib/firebase/storage';

export default function NewProductPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        category: '',
        stock: '',
        featured: false,
        isActive: true,
    });

    useEffect(() => {
        loadCategories();
    }, []);

    async function loadCategories() {
        const { data } = await getAllDocuments('categories');
        setCategories(data || []);
    }

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles(prev => [...prev, ...files]);

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreviews(prev => [...prev, e.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Upload images
            let imageUrls = [];
            if (imageFiles.length > 0) {
                const { urls, error } = await uploadMultipleImages(imageFiles, 'products/');
                if (error) {
                    alert('Failed to upload images: ' + error);
                    setLoading(false);
                    return;
                }
                imageUrls = urls;
            }

            // Create product
            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : parseFloat(formData.price),
                category: formData.category,
                stock: parseInt(formData.stock),
                featured: formData.featured,
                isActive: formData.isActive,
                images: imageUrls,
                salesCount: 0,
            };

            const { id, error } = await createDocument('products', productData);

            if (error) {
                alert('Failed to create product: ' + error);
            } else {
                alert('Product created successfully!');
                router.push('/admin/products');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            alert('An error occurred: ' + (error.message || error));
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold">Add New Product</h1>
                    <p className="text-neutral-600 mt-1">Create a new product listing</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Images */}
                <div className="bg-white rounded-lg shadow-card p-6">
                    <h2 className="font-semibold text-lg mb-4">Product Images</h2>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden group">
                                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors">
                        <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                        <span className="text-sm text-neutral-600">Click to upload images</span>
                        <span className="text-xs text-neutral-400 mt-1">PNG, JPG up to 5MB</span>
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
                        placeholder="e.g., Gold Plated Earrings"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe your product..."
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
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
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
                            placeholder="999"
                            helperText="The price customers will pay"
                            required
                        />

                        <Input
                            label="Original Price (Optional)"
                            type="number"
                            value={formData.originalPrice}
                            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                            placeholder="1499"
                            helperText="For showing discounts"
                        />
                    </div>

                    {formData.price && formData.originalPrice && parseFloat(formData.originalPrice) > parseFloat(formData.price) && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800">
                                💰 Discount: {Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.price)) / parseFloat(formData.originalPrice)) * 100)}% OFF
                            </p>
                        </div>
                    )}
                </div>

                {/* Inventory */}
                <div className="bg-white rounded-lg shadow-card p-6 space-y-4">
                    <h2 className="font-semibold text-lg mb-4">Inventory</h2>

                    <Input
                        label="Stock Quantity"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        placeholder="50"
                        helperText="Number of units available"
                        required
                    />

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 text-green-600 border-neutral-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-neutral-700">
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
                            <span className="block text-xs text-neutral-500 font-normal">Show on homepage and special sections</span>
                        </label>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" loading={loading} className="flex-1">
                        Create Product
                    </Button>
                </div>
            </form>
        </div>
    );
}
