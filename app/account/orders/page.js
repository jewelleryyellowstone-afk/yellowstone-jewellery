'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, formatDateTime, getOrderStatusColor } from '@/lib/utils/format';

export default function CustomerOrdersPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            loadOrders();
        }
    }, [user, authLoading, router]);

    async function loadOrders() {
        const { data } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        
        // Filter out explicitly failed checkouts so users only see valid order history
        const validOrders = (data || []).filter(o => o.payment_status !== 'failed');
        setOrders(validOrders);
        setLoading(false);
    }

    if (authLoading || loading) {
        return (
            <div className="container-custom py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
                    <div className="h-32 bg-neutral-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-custom py-6">
            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">My Orders</h1>

            {orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-card p-12 text-center">
                    <Package className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">No orders yet</h2>
                    <p className="text-neutral-600 mb-6">Start shopping to see your orders here</p>
                    <Link
                        href="/products"
                        className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {orders.map((order) => (
                        <Link
                            key={order.id}
                            href={`/account/orders/${order.id}`}
                            className="block bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-card-hover transition-all duration-300 group"
                        >
                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-display font-bold text-lg text-neutral-900">
                                                Order #{order.id.slice(0, 8).toUpperCase()}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${order.payment_status === 'failed' ? 'bg-red-100 text-red-700' : getOrderStatusColor(order.status)}`}>
                                                {order.payment_status === 'failed' ? 'Failed' : (order.status || 'pending')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-500">
                                            Placed on {formatDateTime(order.created_at)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-neutral-500 mb-1">Total Amount</p>
                                        <p className="font-bold text-xl text-primary-600">
                                            {formatPrice(order.subtotal)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {order.items?.slice(0, 4).map((item, index) => (
                                            <div key={index} className="relative w-12 h-12 sm:w-16 sm:h-16 bg-neutral-50 rounded-lg border border-neutral-100 overflow-hidden">
                                                {item.image ? (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="64px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-4 h-4 sm:w-6 sm:h-6 text-neutral-300" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {order.items?.length > 4 && (
                                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-center">
                                                <span className="text-sm font-medium text-neutral-600">
                                                    +{order.items.length - 4}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="hidden sm:flex items-center text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                                        View Details
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-100 flex sm:hidden items-center justify-between text-sm font-medium text-primary-600">
                                <span>View Order Details</span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
