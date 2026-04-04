'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import Button from '@/components/ui/Button';
import { Filter, SlidersHorizontal, X } from 'lucide-react';

export default function ProductsClient({ initialCategory, initialProducts }) {
    const [products, setProducts] = useState(initialProducts || []);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        sortBy: 'newest',
    });

    // Helper to sort and filter the loaded products dynamically without refetching
    useEffect(() => {
        let filtered = [...(initialProducts || [])];

        // Apply Category Filter (Case Insensitive)
        if (initialCategory) {
            filtered = filtered.filter(p => p.category?.toLowerCase() === initialCategory.toLowerCase());
        }

        // Apply price filters
        if (filters.minPrice) {
            filtered = filtered.filter(p => p.price >= parseInt(filters.minPrice));
        }
        if (filters.maxPrice) {
            filtered = filtered.filter(p => p.price <= parseInt(filters.maxPrice));
        }

        // Apply Status Filter
        filtered = filtered.filter(p => p.is_active !== false);

        // Sorting
        filtered.sort((a, b) => {
            if (filters.sortBy === 'priceLow') return a.price - b.price;
            if (filters.sortBy === 'priceHigh') return b.price - a.price;
            if (filters.sortBy === 'popular') return (b.sales_count || 0) - (a.sales_count || 0);
            // newest is default
            return new Date(b.created_at) - new Date(a.created_at);
        });

        setProducts(filtered);
    }, [initialProducts, initialCategory, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({ minPrice: '', maxPrice: '', sortBy: 'newest' });
        setShowFilters(false);
    };

    return (
        <div className="container-custom py-6">
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 mb-2">
                    {initialCategory ? initialCategory.charAt(0).toUpperCase() + initialCategory.slice(1) : 'All Products'}
                </h1>
                <p className="text-neutral-600">
                    {products.length} products found
                </p>
            </div>

            {/* Filters & Sort Bar */}
            <div className="flex items-center justify-between mb-6 gap-4">
                {/* Filter Button (Mobile) */}
                <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex-1 sm:flex-none"
                >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                </Button>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-neutral-600" />
                    <select
                        value={filters.sortBy}
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="newest">Newest First</option>
                        <option value="priceLow">Price: Low to High</option>
                        <option value="priceHigh">Price: High to Low</option>
                        <option value="popular">Most Popular</option>
                    </select>
                </div>
            </div>

            {/* Filter Panel (Mobile Drawer) */}
            {showFilters && (
                <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowFilters(false)}>
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold">Filters</h2>
                            <button onClick={() => setShowFilters(false)}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Price Range */}
                        <div className="mb-6">
                            <h3 className="font-semibold mb-3">Price Range</h3>
                            <div className="flex gap-3">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.minPrice}
                                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg"
                                />
                                <span className="self-center">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button variant="outline" fullWidth onClick={handleClearFilters}>
                                Clear All
                            </Button>
                            <Button fullWidth onClick={() => setShowFilters(false)}>
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-neutral-500 mb-4">No products found matching your criteria.</p>
                    <Button onClick={handleClearFilters}>Clear Filters</Button>
                </div>
            )}
        </div>
    );
}
