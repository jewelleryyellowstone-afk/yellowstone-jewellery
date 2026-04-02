import Link from 'next/link';
import Card, { CardImage, CardContent, CardTitle, CardPrice } from './Card';
import { Heart } from 'lucide-react';
import { useState } from 'react';

/**
 * Product Card Component
 * Displays product with image, name, price, and quick actions
 */
export default function ProductCard({ product }) {
    const [isWishlisted, setIsWishlisted] = useState(false);

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsWishlisted(!isWishlisted);
        // TODO: Implement wishlist functionality
    };

    return (
        <Link href={`/products/${product.id}`}>
            <Card hover className="relative group">
                {/* Wishlist Button */}
                <button
                    onClick={handleWishlistToggle}
                    className="absolute top-2 right-2 z-10 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 active:scale-95"
                    aria-label="Add to wishlist"
                >
                    <Heart
                        className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-neutral-600'}`}
                    />
                </button>

                {/* Discount Badge */}
                {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute top-2 left-2 z-10 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </div>
                )}

                {/* Product Image */}
                <CardImage
                    src={product.images?.[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                />

                {/* Product Info */}
                <CardContent>
                    <CardTitle className="mb-2">{product.name}</CardTitle>

                    <CardPrice
                        price={product.price}
                        originalPrice={product.originalPrice}
                    />

                    {/* Stock Status */}
                    {product.stock === 0 && (
                        <p className="mt-2 text-sm text-red-500 font-medium">Out of Stock</p>
                    )}
                    {product.stock > 0 && product.stock <= 5 && (
                        <p className="mt-2 text-sm text-orange-500 font-medium">
                            Only {product.stock} left
                        </p>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
