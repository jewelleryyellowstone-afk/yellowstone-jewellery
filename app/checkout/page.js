'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tag, X } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCart } from '@/lib/hooks/useCart';
import { useDiscount } from '@/lib/hooks/useDiscount';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils/format';
import { createDocument, updateDocument, getAllDocuments } from '@/lib/supabase/db';
import { recordDiscountUsage } from '@/lib/utils/discount';

// Address Selector Component
function SavedAddressSelector({ userId, onSelect }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllDocuments(`users/${userId}/addresses`).then(({ data }) => {
            setAddresses(data || []);
            setLoading(false);
        });
    }, [userId]);

    if (loading) return <div className="h-6 w-32 bg-neutral-100 animate-pulse rounded"></div>;

    if (addresses.length === 0) return null;

    return (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
            {addresses.map((addr) => (
                <button
                    key={addr.id}
                    type="button"
                    onClick={() => onSelect(addr)}
                    className="text-left p-3 rounded-lg border border-neutral-200 hover:border-primary-500 hover:bg-neutral-50 transition-colors group"
                >
                    <div className="font-medium text-sm flex justify-between">
                        <span>{addr.name}</span>
                        <Tag className="w-3 h-3 text-neutral-400 group-hover:text-primary-500" />
                    </div>
                    <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                        {addr.address}, {addr.city}
                    </p>
                </button>
            ))}
        </div>
    );
}

export default function CheckoutPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { cart, getTotal, clearCart, loading: cartLoading } = useCart();
    const {
        discountCode, setDiscountCode, appliedDiscount, discountError,
        validating, applyDiscountCode, removeDiscount, calculateTotal
    } = useDiscount();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Details, 2: Payment

    const [formData, setFormData] = useState({
        customerName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
    });

    const [authChoice, setAuthChoice] = useState(null); // 'guest' or 'login'
    const [orderPlaced, setOrderPlaced] = useState(false);

    // If user is logged in, skip prompt
    // If user is logged in, skip prompt and autofill email
    useEffect(() => {
        if (user) {
            setAuthChoice('login');
            setFormData(prev => ({
                ...prev,
                email: user.email || prev.email
            }));
        }
    }, [user]);

    useEffect(() => {
        if (!cartLoading && cart.length === 0 && !orderPlaced) {
            router.push('/cart');
        }
    }, [cart, cartLoading, router, orderPlaced]);

    if (cartLoading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>;
    }

    // Auth Prompt for Guest Users
    if (!user && !authChoice) {
        return (
            <div className="container-custom py-12 max-w-lg mx-auto">
                <div className="bg-white p-8 rounded-xl shadow-card border border-neutral-200 text-center">
                    <h1 className="text-2xl font-bold mb-2">How would you like to checkout?</h1>
                    <p className="text-neutral-600 mb-8">Login to save your details and track orders easily.</p>

                    <div className="space-y-4">
                        <Button
                            fullWidth
                            size="lg"
                            onClick={() => router.push('/login?redirect=/checkout')}
                        >
                            Login / Sign Up
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-neutral-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-neutral-500">Or continue as</span>
                            </div>
                        </div>

                        <Button
                            fullWidth
                            variant="outline"
                            size="lg"
                            onClick={() => setAuthChoice('guest')}
                        >
                            Guest Checkout
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
        } else {
            // Process payment
            await processOrder();
        }
    };

    const processOrder = async () => {
        setLoading(true);

        try {
            // Create order in Firestore first
            const orderData = {
                user_id: user?.uid || null,
                customer_name: formData.customerName,
                email: formData.email,
                phone: formData.phone,
                shipping_address: {
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                },
                items: cart,
                subtotal: getTotal(),
                status: 'pending',
                payment_status: 'pending',
                payment_method: document.querySelector('input[name="payment"]:checked')?.value || 'online',
            };

            const { id: orderId } = await createDocument('orders', orderData);

            if (!orderId) {
                alert('Order creation failed. Please check inputs or try again.');
                setLoading(false);
                return;
            }

            // Check payment method
            const paymentMethod = orderData.payment_method;

            if (paymentMethod === 'cod') {
                // Cash on Delivery - no need to update paymentMethod again

                // Trigger Notification

                // Trigger Notification
                try {
                    await fetch('/api/notifications', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId, type: 'order_placed' }),
                    });
                } catch (err) {
                    console.error('Failed to trigger notification:', err);
                }

                setOrderPlaced(true);
                clearCart();
                router.push(`/order-success?orderId=${orderId}`);
            } else {
                // Online payment via PhonePe
                try {
                    const response = await fetch('/api/payment/phonepe/initiate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderId,
                            amount: getTotal(),
                        }),
                    });
                    
                    const data = await response.json();
                    
                    if (data.url) {
                        clearCart(); // Clear cart to avoid stale states
                        window.location.href = data.url;
                    } else {
                        throw new Error(data.error || 'Failed to initialize payment');
                    }
                } catch (error) {
                    console.error('Payment initialization failed:', error);
                    alert('Payment failed: ' + error.message);
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error('Order creation failed:', error);
            alert('Order failed. Please try again.');
            setLoading(false);
        }
    };

    if (cart.length === 0 && !orderPlaced) {
        return null;
    }

    return (
        <div className="container-custom py-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">Checkout</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Checkout Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-neutral-200 p-6">
                        {step === 1 ? (
                            <>
                                <h2 className="text-xl font-bold mb-4">Shipping Details</h2>

                                {user && (
                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-sm font-semibold text-neutral-900">Saved Addresses</h3>
                                            <button
                                                type="button"
                                                onClick={() => router.push('/account/addresses')}
                                                className="text-xs text-primary-600 font-medium hover:underline"
                                            >
                                                Manage addresses
                                            </button>
                                        </div>
                                        <SavedAddressSelector
                                            userId={user.uid}
                                            onSelect={(addr) => {
                                                setFormData({
                                                    ...formData,
                                                    customerName: addr.name,
                                                    phone: addr.phone,
                                                    address: addr.address,
                                                    city: addr.city,
                                                    state: addr.state,
                                                    pincode: addr.pincode
                                                });
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <Input
                                        label="Full Name"
                                        value={formData.customerName}
                                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        required
                                    />
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <Input
                                            label="City"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label="State"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <Input
                                        label="Pincode"
                                        value={formData.pincode}
                                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                        maxLength={6}
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold mb-4">Payment Method</h2>
                                <div className="space-y-3">
                                    <div className="border border-neutral-300 rounded-lg p-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="radio" name="payment" value="online" defaultChecked />
                                            <div>
                                                <p className="font-medium">Online Payment (PhonePe)</p>
                                                <p className="text-sm text-neutral-600">UPI, Cards, Net Banking</p>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="border border-neutral-300 rounded-lg p-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="radio" name="payment" value="cod" />
                                            <div>
                                                <p className="font-medium">Cash on Delivery</p>
                                                <p className="text-sm text-neutral-600">Pay when you receive</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="mt-6 flex gap-3">
                            {step === 2 && (
                                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                            )}
                            <Button type="submit" fullWidth loading={loading}>
                                {step === 1 ? 'Continue to Payment' : 'Place Order'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border border-neutral-200 p-6 sticky top-20">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                        <div className="space-y-3 mb-4">
                            {cart.map((item) => (
                                <div key={item.id} className="flex gap-3">
                                    <div className="relative w-16 h-16 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                                        <p className="text-sm text-neutral-600">Qty: {item.quantity}</p>
                                        <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Discount Code */}
                        <div className="border-t pt-4 mt-4">
                            {appliedDiscount ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-green-600">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4" />
                                            <span className="font-medium">{appliedDiscount.code}</span>
                                        </div>
                                        <button onClick={removeDiscount} className="p-1 hover:bg-red-50 rounded">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(getTotal())}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Discount</span>
                                        <span>-{formatPrice(appliedDiscount.amount)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Have a discount code?</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={discountCode}
                                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                            placeholder="Enter code"
                                            className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => applyDiscountCode(discountCode, getTotal(), user?.uid)}
                                            loading={validating}
                                            disabled={!discountCode}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                    {discountError && (
                                        <p className="text-xs text-red-600">{discountError}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>{formatPrice(calculateTotal(getTotal()).total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
