'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getDocument } from '@/lib/supabase/db';
import { formatPrice, formatDateTime } from '@/lib/utils/format';
import Button from '@/components/ui/Button';

export default function OrderDetailCustomerPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrder();
    }, [params.id]);

    async function loadOrder() {
        const { data } = await getDocument('orders', params.id);
        setOrder(data);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="container-custom py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container-custom py-12 text-center">
                <p className="text-neutral-500 mb-4">Order not found</p>
                <Button onClick={() => router.push('/account/orders')}>Back to Orders</Button>
            </div>
        );
    }

    const statusSteps = [
        { key: 'pending', label: 'Order Placed', icon: CheckCircle2 },
        { key: 'packed', label: 'Packed', icon: Package },
        { key: 'shipped', label: 'Shipped', icon: Package },
        { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
    ];

    const currentStepIndex = statusSteps.findIndex(step => step.key === order.status);

    return (
        <div className="container-custom py-6">
            <div className="mb-6">
                <Link href="/account/orders" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Orders
                </Link>
                <h1 className="text-2xl sm:text-3xl font-display font-bold">Order Details</h1>
                <p className="text-neutral-600 mt-1">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                <div className="mt-4 flex flex-col gap-2">
                    {order.logistics?.courierName && (
                        <p className="text-sm text-neutral-600">
                            Shipped via <span className="font-medium text-neutral-900">{order.logistics.courierName}</span>
                        </p>
                    )}
                    {order.logistics?.awbCode && (
                        <p className="text-sm text-neutral-600">
                            Tracking ID: <span className="font-mono font-medium text-neutral-900">{order.logistics.awbCode}</span>
                        </p>
                    )}
                    {(order.logistics?.trackingUrl || order.logistics?.awbCode) && (
                        <a
                            href={order.logistics?.trackingUrl || `https://shiprocket.co/tracking/${order.logistics.awbCode}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 w-max px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            <Package className="w-4 h-4" />
                            Track Shipment
                        </a>
                    )}
                </div>
            </div>

            {/* Order Status Timeline */}
            <div className="bg-white rounded-lg shadow-card p-6 mb-6">
                <h2 className="font-semibold text-lg mb-6">Order Status</h2>
                <div className="relative">
                    <div className="flex justify-between">
                        {statusSteps.map((step, index) => {
                            const Icon = step.icon;
                            const isCompleted = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;

                            return (
                                <div key={step.key} className="flex-1 relative">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isCompleted ? 'bg-green-500 text-white' : 'bg-neutral-200 text-neutral-400'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <p className={`text-xs sm:text-sm font-medium text-center ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-green-600' : 'text-neutral-500'}`}>
                                            {step.label}
                                        </p>
                                    </div>
                                    {index < statusSteps.length - 1 && (
                                        <div
                                            className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 ${index < currentStepIndex ? 'bg-green-500' : 'bg-neutral-200'
                                                }`}
                                        ></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-card p-6 mb-6">
                <h2 className="font-semibold text-lg mb-4">Order Items</h2>
                <div className="space-y-4">
                    {order.items?.map((item, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="relative w-20 h-20 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                                {item.image && (
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="text-sm text-neutral-600 mt-1">Qty: {item.quantity}</p>
                                <p className="text-sm font-semibold mt-1">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t space-y-2">
                    <div className="flex justify-between text-neutral-600">
                        <span>Subtotal</span>
                        <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    {order.discount && order.discount > 0 ? (
                        <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-{formatPrice(order.discount)}</span>
                        </div>
                    ) : null}
                    {order.total - order.subtotal + (order.discount || 0) > 0 ? (
                        <div className="flex justify-between text-neutral-600">
                            <span>Delivery Fee</span>
                            <span>{formatPrice(order.total - order.subtotal + (order.discount || 0))}</span>
                        </div>
                    ) : (
                        <div className="flex justify-between text-neutral-600">
                            <span>Delivery Fee</span>
                            <span className="text-green-600">Free</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>{formatPrice(order.total)}</span>
                    </div>
                </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-card p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Delivery Address
                </h2>
                <div className="text-neutral-700">
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="mt-2">{order.shipping_address?.address}</p>
                    <p>{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                    <p>PIN: {order.shipping_address?.pincode}</p>
                    <p className="mt-2">{order.phone}</p>
                </div>
            </div>
        </div>
    );
}
