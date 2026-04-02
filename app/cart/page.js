'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCart } from '@/lib/hooks/useCart';
import { formatPrice } from '@/lib/utils/format';

export default function CartPage() {
    const router = useRouter();
    const {
        cart,
        updateQuantity,
        removeFromCart,
        getSubtotal,
        getSavings,
        getShippingCost,
        getTotal,
    } = useCart();

    const subtotal = getSubtotal();
    const savings = getSavings();
    const shippingCost = getShippingCost();
    const total = getTotal();
    const freeShippingThreshold = parseFloat(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 999);
    const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

    if (cart.length === 0) {
        return (
            <div className="container-custom py-12">
                <div className="max-w-md mx-auto text-center">
                    <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-12 h-12 text-neutral-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
                    <p className="text-neutral-600 mb-6">
                        Start shopping to add items to your cart
                    </p>
                    <Button size="lg" href="/products">
                        Browse Products
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-custom py-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">Shopping Cart</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Free Shipping Progress */}
                    {remainingForFreeShipping > 0 && (
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-neutral-700">
                                Add {formatPrice(remainingForFreeShipping)} more to get{' '}
                                <span className="font-semibold text-primary-600">FREE SHIPPING</span>
                            </p>
                            <div className="mt-2 h-2 bg-primary-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-500 transition-all duration-300"
                                    style={{ width: `${(subtotal / freeShippingThreshold) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Cart Items List */}
                    {cart.map((item) => (
                        <div key={`${item.id}-${JSON.stringify(item.variant)}`} className="bg-white rounded-lg border border-neutral-200 p-4">
                            <div className="flex gap-4">
                                {/* Product Image */}
                                <div className="relative w-24 h-24 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                        src={item.image || '/placeholder-product.jpg'}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                    />
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                    <Link href={`/products/${item.id}`}>
                                        <h3 className="font-semibold text-neutral-900 hover:text-primary-600 line-clamp-2 mb-1">
                                            {item.name}
                                        </h3>
                                    </Link>

                                    {/* Variant */}
                                    {item.variant && (
                                        <p className="text-sm text-neutral-500 mb-2">
                                            {Object.entries(item.variant).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                        </p>
                                    )}

                                    {/* Price */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="font-bold text-neutral-900">{formatPrice(item.price)}</span>
                                        {item.originalPrice > item.price && (
                                            <span className="text-sm text-neutral-500 line-through">
                                                {formatPrice(item.originalPrice)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)}
                                                className="p-1.5 border border-neutral-300 rounded hover:bg-neutral-100"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-10 text-center font-semibold">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                                                className="p-1.5 border border-neutral-300 rounded hover:bg-neutral-100"
                                                disabled={item.quantity >= item.stock}
                                                aria-label="Increase quantity"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={() => removeFromCart(item.id, item.variant)}
                                            className="text-red-500 hover:text-red-600 p-2"
                                            aria-label="Remove from cart"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary - Sticky on desktop */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border border-neutral-200 p-6 sticky top-20">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-neutral-600">
                                <span>Subtotal ({cart.length} items)</span>
                                <span>{formatPrice(subtotal)}</span>
                            </div>

                            {savings > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Savings</span>
                                    <span>-{formatPrice(savings)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-neutral-600">
                                <span>Shipping</span>
                                <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
                            </div>

                            <div className="border-t border-neutral-200 pt-3 flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                        </div>

                        <Button size="lg" fullWidth href="/checkout">
                            Proceed to Checkout
                        </Button>

                        <Link
                            href="/products"
                            className="block text-center text-primary-600 hover:text-primary-700 text-sm font-medium mt-4"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
