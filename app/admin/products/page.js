'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getAllDocuments, deleteDocument } from '@/lib/supabase/db';
import { formatPrice } from '@/lib/utils/format';

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        console.log('AdminProductsPage: Loading products...');
        try {
            const { data, error } = await getAllDocuments('products', {
                orderByField: 'created_at',
                orderDirection: 'desc',
                limitCount: 100,
            });

            if (error) {
                console.error('AdminProductsPage: Error fetching products:', error);
                alert('Failed to load products: ' + error);
                setProducts([]);
            } else {
                console.log('AdminProductsPage: Loaded products:', data?.length);
                setProducts(data || []);
            }
        } catch (err) {
            console.error('AdminProductsPage: Unexpected error:', err);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        const { error } = await deleteDocument('products', id);
        if (!error) {
            setProducts(products.filter(p => p.id !== id));
            alert('Product deleted successfully');
        } else {
            alert('Failed to delete product: ' + error);
        }
    }

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Products</h1>
                    <p className="text-neutral-600 mt-1">{products.length} total products</p>
                </div>
                <Link href="/admin/products/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                    </Button>
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-card p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                        <p className="mt-2 text-neutral-600">Loading products...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-neutral-500">No products found</p>
                        <Link href="/admin/products/new">
                            <Button className="mt-4">Add Your First Product</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                                                    {product.images && product.images[0] ? (
                                                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                                            <Eye className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-900">{product.name}</p>
                                                    <p className="text-sm text-neutral-500">ID: {product.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {product.category || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-neutral-900">{formatPrice(product.price)}</p>
                                                {product.original_price && product.original_price > product.price && (
                                                    <p className="text-xs text-neutral-500 line-through">{formatPrice(product.original_price)}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock === 0 ? 'bg-red-100 text-red-800' :
                                                product.stock <= 5 ? 'bg-orange-100 text-orange-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {product.stock} units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.featured ? 'bg-purple-100 text-purple-800' : 'bg-neutral-100 text-neutral-800'
                                                }`}>
                                                {product.featured ? 'Featured' : 'Regular'}
                                            </span>
                                            {!product.is_active && (product.is_active !== undefined) && (
                                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-200 text-neutral-600">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/products/${product.id}`} target="_blank">
                                                    <button className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </Link>
                                                <Link href={`/admin/products/${product.id}/edit`}>
                                                    <button className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
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
                    </div>
                )}
            </div>
        </div>
    );
}
