'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCategories } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCategories() {
            try {
                const { data } = await getCategories();
                setCategories(data || []);
            } catch (error) {
                console.error('Failed to load categories', error);
            } finally {
                setLoading(false);
            }
        }
        loadCategories();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="container-custom py-12">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-neutral-900 mb-8 text-center">
                Browse Categories
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {categories.length > 0 ? (
                    categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/products?category=${cat.name.toLowerCase()}`}
                            className="group block"
                        >
                            <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-100 shadow-sm group-hover:shadow-md transition-all">
                                {cat.image ? (
                                    <img
                                        src={cat.image}
                                        alt={cat.name}
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-400 font-medium">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            </div>
                            <h3 className="text-center font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
                                {cat.name}
                            </h3>
                        </Link>
                    ))
                ) : (
                    // Fallback if no dynamic categories yet
                    ['Earrings', 'Necklaces', 'Bangles', 'Rings', 'Bridal', 'Festive', 'Anklets', 'Mangalsutra'].map((catName) => (
                        <Link
                            key={catName}
                            href={`/products?category=${catName.toLowerCase()}`}
                            className="group block"
                        >
                            <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-100 shadow-sm group-hover:shadow-md transition-all flex items-center justify-center">
                                <span className="text-4xl font-light text-primary-200">{catName[0]}</span>
                            </div>
                            <h3 className="text-center font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
                                {catName}
                            </h3>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
