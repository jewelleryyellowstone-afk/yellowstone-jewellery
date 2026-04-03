'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart, Share2, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getProductById } from '@/lib/supabase/db';
import { useCart } from '@/lib/hooks/useCart';
import { formatPrice, createWhatsAppLink } from '@/lib/utils/format';

export default function ProductDetailsClient({ productId }) {
    const router = useRouter();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [pincode, setPincode] = useState('');
    const [pincodeStatus, setPincodeStatus] = useState(null);

    useEffect(() => {
        loadProduct();
    }, [productId]);

    async function loadProduct() {
        if (!productId) return;
        const { data } = await getProductById(productId);
        if (data) {
            setProduct(data);
        }
        setLoading(false);
    }

    const handleAddToCart = () => {
        addToCart(product, quantity);
        alert('Added to cart!');
    };

    const handleBuyNow = () => {
        addToCart(product, quantity);
        router.push('/checkout');
    };

    const handleShare = () => {
        const shareData = {
            title: product.name,
            text: `Check out ${product.name} on YellowStone Jewellery`,
            url: window.location.href,
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            const whatsappUrl = createWhatsAppLink(
                process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
                `Check out ${product.name}: ${window.location.href}`
            );
            window.open(whatsappUrl, '_blank');
        }
    };

    const checkPincode = async () => {
        // TODO: Implement Shiprocket integration
        setPincodeStatus('available');
    };

    if (loading) {
        return (
            <div className="container-custom py-6">
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="skeleton aspect-square rounded-lg"></div>
                    <div className="space-y-4">
                        <div className="skeleton h-8 w-3/4"></div>
                        <div className="skeleton h-6 w-1/2"></div>
                        <div className="skeleton h-24"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container-custom py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Product not found</h1>
                <Button onClick={() => router.push('/products')}>Back to Products</Button>
            </div>
        );
    }

    return (
        <div className="container-custom py-6">
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                        <Image
                            src={product.images?.[selectedImage] || '/placeholder-product.jpg'}
                            alt={product.name}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                            unoptimized
                        />

                        {/* Discount Badge */}
                        {product.original_price && product.original_price > product.price && (
                            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full font-bold z-10">
                                {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                            </div>
                        )}

                        {/* Share Button */}
                        <button
                            onClick={handleShare}
                            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md z-10"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Thumbnail Gallery */}
                    {product.images && product.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                            {product.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-primary-500' : 'border-transparent'
                                        }`}
                                >
                                    <Image
                                        src={image}
                                        alt={`${product.name} ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="100px"
                                        unoptimized
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 mb-2">
                            {product.name}
                        </h1>

                        {/* Price */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-3xl font-bold text-neutral-900">
                                {formatPrice(product.price)}
                            </span>
                            {product.original_price && product.original_price > product.price && (
                                <>
                                    <span className="text-xl text-neutral-500 line-through">
                                        {formatPrice(product.original_price)}
                                    </span>
                                    <span className="text-green-600 font-semibold">
                                        Save {formatPrice(product.original_price - product.price)}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Stock Status */}
                        {product.stock === 0 ? (
                            <p className="text-red-500 font-medium mb-4">Out of Stock</p>
                        ) : product.stock <= 5 ? (
                            <p className="text-orange-500 font-medium mb-4">Only {product.stock} left in stock!</p>
                        ) : (
                            <p className="text-green-600 font-medium mb-4">In Stock</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="font-semibold text-lg mb-2">Description</h2>
                        <p className="text-neutral-600 leading-relaxed">
                            {product.description || 'Premium quality artificial jewellery crafted with care.'}
                        </p>
                    </div>

                    {/* Quantity Selector */}
                    {product.stock > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2">Quantity</h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-100"
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-12 text-center font-semibold">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                    className="p-2 border border-neutral-300 rounded-lg hover:bg-neutral-100"
                                    disabled={quantity >= product.stock}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pincode Check */}
                    <div>
                        <h3 className="font-semibold mb-2">Check Delivery</h3>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Enter pincode"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg"
                                    maxLength={6}
                                />
                            </div>
                            <Button onClick={checkPincode} disabled={pincode.length !== 6}>
                                Check
                            </Button>
                        </div>
                        {pincodeStatus && (
                            <p className="text-sm text-green-600 mt-2">
                                ✓ Delivery available to this location
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-neutral-200 p-4 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:border-0 lg:p-0 z-30">
                        <div className="flex gap-3 max-w-7xl mx-auto">
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className="flex-1"
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Add to Cart
                            </Button>
                            <Button
                                size="lg"
                                onClick={handleBuyNow}
                                disabled={product.stock === 0}
                                className="flex-1"
                            >
                                Buy Now
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
