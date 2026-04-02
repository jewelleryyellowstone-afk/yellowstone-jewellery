'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import Button from '@/components/ui/Button';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { getProducts } from '@/lib/firebase/firestore';

function ProductsContent() {
    const searchParams = useSearchParams();
    const category = searchParams.get('category');

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        sortBy: 'newest',
    });

    useEffect(() => {
        loadProducts();
    }, [category, filters.sortBy]);

    async function loadProducts() {
        setLoading(true);

        // Build filters array
        // We will filter by category client-side to ensure case-insensitive matching
        const filterArray = [];

        // Sort options
        const sortOptions = {
            newest: { orderByField: 'createdAt', orderDirection: 'desc' },
            priceLow: { orderByField: 'price', orderDirection: 'asc' },
            priceHigh: { orderByField: 'price', orderDirection: 'desc' },
            popular: { orderByField: 'salesCount', orderDirection: 'desc' },
        };

        const { data } = await getProducts(filterArray, {
            ...sortOptions[filters.sortBy],
            limitCount: 100, // Increase limit to fetch enough products for checking
        });

        let filtered = data || [];

        // Apply Category Filter Client-Side (Case Insensitive)
        if (category) {
            filtered = filtered.filter(p => p.category?.toLowerCase() === category.toLowerCase());
        }

        // Apply price filters client-side
        if (filters.minPrice) {
            filtered = filtered.filter(p => p.price >= parseInt(filters.minPrice));
        }
        if (filters.maxPrice) {
            filtered = filtered.filter(p => p.price <= parseInt(filters.maxPrice));
        }

        // Apply Status Filter Client-Side (Legacy Support)
        // Show product if isActive is true OR undefined (legacy), hide ONLY if explicitly false
        filtered = filtered.filter(p => p.isActive !== false);

        setProducts(filtered);
        setLoading(false);
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        loadProducts();
        setShowFilters(false);
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
                    {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Products'}
                </h1>
                <p className="text-neutral-600">
                    {loading ? 'Loading...' : `${products.length} products found`}
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
                            <Button fullWidth onClick={handleApplyFilters}>
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="skeleton aspect-square rounded-lg"></div>
                    ))}
                </div>
            ) : products.length > 0 ? (
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

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="container-custom py-12 text-center">Loading...</div>}>
            <ProductsContent />
        </Suspense>
    );
}
