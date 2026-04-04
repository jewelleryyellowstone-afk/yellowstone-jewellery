'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import Button from '@/components/ui/Button';
import { getProducts } from '@/lib/supabase/db';

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';

    const [searchQuery, setSearchQuery] = useState(query);
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load all products on mount
    useEffect(() => {
        async function loadProducts() {
            setLoading(true);
            const { data } = await getProducts([], {
                orderByField: 'created_at',
                orderDirection: 'desc',
                limitCount: 200,
            });
            const active = (data || []).filter(p => p.is_active !== false);
            setAllProducts(active);
            setLoading(false);
        }
        loadProducts();
    }, []);

    // Filter products when query or allProducts changes
    useEffect(() => {
        if (!query.trim()) {
            setProducts(allProducts);
            return;
        }
        const q = query.toLowerCase();
        const filtered = allProducts.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        );
        setProducts(filtered);
    }, [query, allProducts]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            router.push('/search');
        }
    };

    return (
        <div className="container-custom py-6">
            {/* Search Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 mb-4">
                    Search Products
                </h1>
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="search"
                            placeholder="Search for jewellery..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); router.push('/search'); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <Button type="submit">
                        Search
                    </Button>
                </form>
            </div>

            {/* Results */}
            {query && (
                <p className="text-neutral-600 mb-6">
                    {loading
                        ? 'Searching...'
                        : `${products.length} result${products.length !== 1 ? 's' : ''} for "${query}"`}
                </p>
            )}

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
            ) : query ? (
                <div className="text-center py-16">
                    <Search className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-neutral-900 mb-2">No results found</h2>
                    <p className="text-neutral-500 mb-6">
                        We couldn&apos;t find anything for &quot;{query}&quot;. Try a different search term.
                    </p>
                    <Button href="/products">Browse All Products</Button>
                </div>
            ) : (
                <div className="text-center py-16">
                    <Search className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-neutral-900 mb-2">Start Searching</h2>
                    <p className="text-neutral-500">
                        Search for earrings, necklaces, bangles, rings and more.
                    </p>
                </div>
            )}

            {/* Popular Searches */}
            {!query && !loading && (
                <div className="mt-12">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4">Popular Searches</h2>
                    <div className="flex flex-wrap gap-3">
                        {['Earrings', 'Necklaces', 'Bangles', 'Rings', 'Bridal', 'Anklets', 'Mangalsutra'].map(term => (
                            <Link
                                key={term}
                                href={`/search?q=${term.toLowerCase()}`}
                                className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-sm text-neutral-700 hover:border-primary-500 hover:text-primary-600 transition-colors"
                            >
                                {term}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="container-custom py-12 text-center">Loading search...</div>}>
            <SearchContent />
        </Suspense>
    );
}
