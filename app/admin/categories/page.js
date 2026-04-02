'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getAllDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestore';
import { uploadImage } from '@/lib/firebase/storage';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        order: 0,
        image: null,
        imageFile: null,
        imagePreview: null
    });

    useEffect(() => {
        loadCategories();
    }, []);

    async function loadCategories() {
        try {
            const { data, error } = await getAllDocuments('categories', {
                orderByField: 'order',
                orderDirection: 'asc',
            });
            if (error) {
                console.error('Error loading categories:', error);
                alert('Failed to load categories: ' + error);
            }
            setCategories(data || []);
        } catch (err) {
            console.error('Unexpected error loading categories:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let imageUrl = formData.image;

            // Upload new image if selected
            if (formData.imageFile) {
                const { url, error: uploadError } = await uploadImage(formData.imageFile, 'categories/');
                if (uploadError) {
                    alert('Failed to upload image: ' + uploadError);
                    return;
                }
                imageUrl = url;
            }

            const categoryData = {
                name: formData.name,
                description: formData.description,
                order: formData.order,
                image: imageUrl
            };

            if (editingId) {
                // Update existing category
                const { error } = await updateDocument('categories', editingId, categoryData);
                if (!error) {
                    loadCategories();
                    resetForm();
                    alert('Category updated successfully');
                } else {
                    alert('Failed to update category: ' + error);
                }
            } else {
                // Create new category
                const { error } = await createDocument('categories', categoryData);
                if (!error) {
                    loadCategories();
                    resetForm();
                    alert('Category created successfully');
                } else {
                    alert('Failed to create category: ' + error);
                }
            }
        } catch (err) {
            console.error('Error submitting category:', err);
            alert('An unexpected error occurred: ' + err.message);
        }
    };

    const handleEdit = (category) => {
        setFormData({
            name: category.name,
            description: category.description || '',
            order: category.order || 0,
            image: category.image || null,
            imagePreview: category.image || null,
            imageFile: null
        });
        setEditingId(category.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        const { error } = await deleteDocument('categories', id);
        if (!error) {
            setCategories(categories.filter(c => c.id !== id));
            alert('Category deleted successfully');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', order: 0, image: null, imageFile: null, imagePreview: null });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Categories</h1>
                    <p className="text-neutral-600 mt-1">Manage product categories</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? 'Cancel' : 'Add Category'}
                </Button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-card p-6 mb-6">
                    <h2 className="font-semibold text-lg mb-4">
                        {editingId ? 'Edit Category' : 'Add New Category'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Category Image</label>
                                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 text-center hover:bg-neutral-50 transition-colors relative group">
                                    {formData.imagePreview ? (
                                        <div className="relative aspect-square mb-2 mx-auto w-full max-w-[200px] overflow-hidden rounded-lg">
                                            <img
                                                src={formData.imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, imageFile: null, imagePreview: null }))}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block py-8">
                                            <div className="mx-auto w-12 h-12 text-neutral-400 mb-2">
                                                <Plus className="w-12 h-12" />
                                            </div>
                                            <span className="text-sm text-neutral-500">Click to upload</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                imageFile: file,
                                                                imagePreview: ev.target.result
                                                            }));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <Input
                                    label="Category Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Earrings"
                                    required
                                />

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description of this category"
                                        rows={3}
                                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>

                                <Input
                                    label="Display Order"
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    helperText="Lower numbers appear first"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-neutral-100">
                            <Button type="button" variant="outline" onClick={resetForm}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingId ? 'Update Category' : 'Create Category'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Categories List */}
            <div className="bg-white rounded-lg shadow-card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-neutral-500">No categories yet. Create your first category!</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {categories.map((category) => (
                                <tr key={category.id} className="hover:bg-neutral-50">
                                    <td className="px-6 py-4 text-sm text-neutral-600">
                                        {category.order || 0}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-neutral-900">{category.name}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-neutral-600">
                                        {category.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
                                                className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
