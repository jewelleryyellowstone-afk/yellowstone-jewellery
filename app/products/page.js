import { Suspense } from 'react';
import ProductsClient from './ProductsClient';
import { getProducts } from '@/lib/supabase/db';

export const metadata = {
    title: 'Products | YellowStone Jewellery',
    description: 'Browse our collection of premium artificial jewellery.',
};

export default async function ProductsPage({ searchParams }) {
    const category = searchParams.category;

    // Fetch all active products on the server side
    const { data } = await getProducts([], { limitCount: 200, orderByField: 'created_at', orderDirection: 'desc' });
    const products = data || [];

    return (
        <Suspense fallback={<div className="container-custom py-12 text-center">Loading...</div>}>
            <ProductsClient initialCategory={category} initialProducts={products} />
        </Suspense>
    );
}
