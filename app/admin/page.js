'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Package, CreditCard } from 'lucide-react';
import { getAllDocuments } from '@/lib/supabase/db';
import { formatPrice } from '@/lib/utils/format';


export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        revenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        const { data: products } = await getAllDocuments('products');
        const { data: orders } = await getAllDocuments('orders');

        const pendingOrders = orders?.filter(o => o.status === 'new' || o.status === 'pending').length || 0;
        const revenue = orders?.reduce((sum, order) => sum + (order.subtotal || 0), 0) || 0;

        setStats({
            totalProducts: products?.length || 0,
            totalOrders: orders?.length || 0,
            pendingOrders,
            revenue,
        });
        setLoading(false);
    }

    const statCards = [
        { label: 'Total Revenue', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Pending Orders', value: stats.pendingOrders, icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Total Products', value: stats.totalProducts, icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white rounded-lg shadow-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <h3 className="text-sm text-neutral-600 mb-1">{stat.label}</h3>
                            <p className="text-2xl font-bold">
                                {loading ? '...' : stat.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-card p-6 mb-8">
                <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                <div className="grid sm:grid-cols-3 gap-4">
                    <a
                        href="/admin/products/new"
                        className="p-4 border border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                    >
                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                        <p className="font-medium">Add Product</p>
                    </a>
                    <a
                        href="/admin/orders"
                        className="p-4 border border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                    >
                        <Package className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                        <p className="font-medium">View Orders</p>
                    </a>
                    <a
                        href="/admin/reports"
                        className="p-4 border border-neutral-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-center"
                    >
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                        <p className="font-medium">View Reports</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
