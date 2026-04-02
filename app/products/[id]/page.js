
import { getProductById } from '@/lib/firebase/firestore';
import ProductDetailsClient from './ProductDetailsClient';

export async function generateMetadata({ params }) {
    const { id } = params;
    const { data: product } = await getProductById(id);

    if (!product) {
        return {
            title: 'Product Not Found | YellowStone Jewellery',
        };
    }

    return {
        title: `${product.name} | YellowStone Jewellery`,
        description: product.description?.slice(0, 160) || 'Premium artificial jewellery.',
        openGraph: {
            title: product.name,
            description: product.description?.slice(0, 160),
            images: product.images?.[0] ? [product.images[0]] : [],
            type: 'website',
        },
    };
}

export default function ProductDetailPage({ params }) {
    return <ProductDetailsClient productId={params.id} />;
}
