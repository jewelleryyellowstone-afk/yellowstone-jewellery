'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ShieldCheck, RotateCcw, Truck } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import Button from '@/components/ui/Button';
import { getProducts, getCategories, getDocument } from '@/lib/supabase/db';

export default function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [design, setDesign] = useState(null);

    useEffect(() => {
        async function loadData() {
            // Load featured/bestseller products
            // Load latest products (replacing 'featured' filter to show all)
            const { data: products } = await getProducts(
                [], // No filter, just get all/latest
                { limitCount: 8, orderByField: 'created_at', orderDirection: 'desc' }
            );

            // Load categories
            const { data: cats } = await getCategories();

            // Load design settings
            const { data: designSettings } = await getDocument('settings', 'design');

            setFeaturedProducts(products || []);
            setCategories(cats || []);
            if (designSettings) setDesign(designSettings);
            setLoading(false);
        }

        loadData();
    }, []);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            {/* Hero Section */}
            <section className="relative overflow-hidden min-h-[600px] flex items-center">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={design?.hero_image_url || "/hero-banner.jpg"}
                        alt="YellowStone Jewellery"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>

                <div className="container-custom relative z-10 section-spacing">
                    <div className="max-w-3xl mx-auto text-center text-white">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                            Elevate Your Style with
                            <span className="block text-primary-200 mt-2">Premium Jewellery</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-neutral-100 mb-8 max-w-2xl mx-auto">
                            Discover exquisite artificial jewellery for every occasion. Crafted with love, designed for you.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button size="lg" asChild>
                                <Link href="/products">Shop Now</Link>
                            </Button>
                            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-black" asChild>
                                <Link href="/categories">Browse Categories</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="container-custom section-spacing">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900">
                        Shop by Category
                    </h2>
                    <Link
                        href="/categories"
                        className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
                    >
                        View All
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="skeleton h-32 rounded-lg"></div>
                        ))}
                    </div>
                ) : categories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/products?category=${category.name.toLowerCase()}`}
                                className="group relative aspect-[4/5] sm:aspect-square rounded-2xl overflow-hidden bg-neutral-900 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                            >
                                {category.image ? (
                                    <img
                                        src={category.image}
                                        alt={category.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-neutral-800"></div>
                                )}

                                {/* Gradient Overlay - Animated */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>

                                {/* Border Ring Effect */}
                                <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 rounded-2xl transition-colors duration-300 z-10"></div>

                                {/* Content */}
                                <div className="absolute inset-0 flex flex-col justify-end p-6 z-20">
                                    <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                                        <h3 className="text-xl font-display font-bold text-white mb-1">
                                            {category.name}
                                        </h3>
                                        <div className="h-0.5 w-12 bg-primary-500 rounded-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:w-full"></div>

                                        <div className="flex items-center gap-2 text-sm font-medium text-white/90 opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75">
                                            <span>Explore</span>
                                            <ChevronRight className="w-4 h-4 text-primary-400" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-neutral-500">No categories found.</p>
                    </div>
                )}
            </section>

            {/* Best Sellers Section */}
            <section className="bg-white">
                <div className="container-custom section-spacing">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900">
                                New Arrivals
                            </h2>
                            <p className="text-neutral-600 mt-1">Our latest collection</p>
                        </div>
                        <Link
                            href="/products?sort=popular"
                            className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
                        >
                            View All
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="skeleton aspect-square rounded-lg"></div>
                            ))}
                        </div>
                    ) : featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-neutral-500">No products available yet.</p>
                            <Button className="mt-4" asChild>
                                <Link href="/products">Explore All Products</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Limited Offers Section */}
            <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                <div className="container-custom py-12">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                            Limited Time Offer
                        </h2>
                        <p className="text-lg mb-6 opacity-90">
                            Get up to 50% OFF on selected jewellery. Shop now before it's too late!
                        </p>
                        <Button size="lg" variant="secondary" asChild>
                            <Link href="/offers">Shop Offers</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Trust Badges */}
            <section className="container-custom py-12">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="w-8 h-8 text-primary-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Secure Payments</h3>
                        <p className="text-neutral-600 text-sm">
                            100% secure and encrypted transactions
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                            <RotateCcw className="w-8 h-8 text-primary-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Easy Returns</h3>
                        <p className="text-neutral-600 text-sm">
                            7-day hassle-free return policy
                        </p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                            <Truck className="w-8 h-8 text-primary-600" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Nationwide Delivery</h3>
                        <p className="text-neutral-600 text-sm">
                            Free shipping on orders above ₹999
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
