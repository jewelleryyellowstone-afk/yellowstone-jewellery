'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ui/ProductCard';
import { getProducts } from '@/lib/firebase/firestore';
import { Loader2, Tag } from 'lucide-react';

export default function OffersPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadOffers() {
            try {
                // Fetch all products and filter for those with discountPrice < price (simulated offer logic)
                // In a real app, you might Query specifically for 'onSale' == true
                const { data } = await getProducts();

                // Client-side filter for offers if backend flag doesn't exist
                // Assuming 'salePrice' or 'discountPrice' exists, or we just show random selection as "Offers" for MVP
                const offerProducts = data?.filter(p => p.salePrice && p.salePrice < p.price) || data?.slice(0, 6) || [];

                setProducts(offerProducts);
            } catch (error) {
                console.error('Failed to load offers', error);
            } finally {
                setLoading(false);
            }
        }
        loadOffers();
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
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-neutral-900 mb-4">
                    Special Offers
                </h1>
                <p className="text-neutral-600">
                    Grab these exclusive deals before they are gone!
                    Limited time discounts on our premium collection.
                </p>
            </div>

            {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="relative">
                            <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <Tag className="w-3 h-3" /> SALE
                            </div>
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-neutral-50 rounded-lg">
                    <Tag className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Active Offers</h3>
                    <p className="text-neutral-500">
                        Check back later for new deals and discounts!
                    </p>
                </div>
            )}
        </div>
    );
}
