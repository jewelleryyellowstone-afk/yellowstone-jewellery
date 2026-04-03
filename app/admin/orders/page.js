'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Eye, Package, Download } from 'lucide-react';
import { getAllDocuments } from '@/lib/supabase/db';
import { formatPrice, formatDateTime, getOrderStatusColor, formatDate } from '@/lib/utils/format';
import Button from '@/components/ui/Button';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        const { data } = await getAllDocuments('orders', {
            orderByField: 'created_at',
            orderDirection: 'desc',
            limitCount: 500, // Increased limit for better export utility
        });
        setOrders(data || []);
        setLoading(false);
    }

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleExport = (type) => {
        if (filteredOrders.length === 0) {
            alert('No data to export');
            return;
        }

        const dataToExport = filteredOrders.map(order => ({
            'Order ID': order.id,
            'Date': formatDate(order.created_at),
            'Customer Name': order.customer_name,
            'Email': order.email,
            'Phone': order.phone,
            'Address': order.shipping_address ? `${order.shipping_address.address}, ${order.shipping_address.city}, ${order.shipping_address.state}, ${order.shipping_address.pincode}` : '',
            'Items Count': order.items?.length || 0,
            'Items Details': order.items?.map(i => `${i.name} (x${i.quantity})`).join('; ') || '',
            'Subtotal': order.subtotal || 0,
            'Status': order.status || 'pending',
            'Payment Method': order.payment_method || '-',
            'Tracking ID': order.logistics?.awb_code || ''
        }));

        const fileName = `orders-export-${statusFilter}`;

        if (type === 'excel') {
            import('@/lib/utils/export').then(mod => mod.exportToExcel(dataToExport, fileName));
        } else {
            import('@/lib/utils/export').then(mod => mod.exportToCSV(dataToExport, fileName));
        }
    };

    const statusCounts = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'pending' || o.status === 'new').length,
        packed: orders.filter(o => o.status === 'packed').length,
        shipped: orders.filter(o => o.status === 'shipped').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Orders</h1>
                    <p className="text-neutral-600 mt-1">{orders.length} total orders</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport('csv')} disabled={loading || filteredOrders.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                    </Button>
                    <Button onClick={() => handleExport('excel')} disabled={loading || filteredOrders.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Excel
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`p-4 rounded-lg border-2 transition-all ${statusFilter === 'all'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                >
                    <p className="text-2xl font-bold">{statusCounts.all}</p>
                    <p className="text-sm text-neutral-600">All Orders</p>
                </button>
                <button
                    onClick={() => setStatusFilter('pending')}
                    className={`p-4 rounded-lg border-2 transition-all ${statusFilter === 'pending'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                >
                    <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
                    <p className="text-sm text-neutral-600">Pending</p>
                </button>
                <button
                    onClick={() => setStatusFilter('packed')}
                    className={`p-4 rounded-lg border-2 transition-all ${statusFilter === 'packed'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                >
                    <p className="text-2xl font-bold text-blue-600">{statusCounts.packed}</p>
                    <p className="text-sm text-neutral-600">Packed</p>
                </button>
                <button
                    onClick={() => setStatusFilter('shipped')}
                    className={`p-4 rounded-lg border-2 transition-all ${statusFilter === 'shipped'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                >
                    <p className="text-2xl font-bold text-orange-600">{statusCounts.shipped}</p>
                    <p className="text-sm text-neutral-600">Shipped</p>
                </button>
                <button
                    onClick={() => setStatusFilter('delivered')}
                    className={`p-4 rounded-lg border-2 transition-all ${statusFilter === 'delivered'
                        ? 'border-green-500 bg-green-50'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                >
                    <p className="text-2xl font-bold text-green-600">{statusCounts.delivered}</p>
                    <p className="text-sm text-neutral-600">Delivered</p>
                </button>
                <button
                    onClick={() => setStatusFilter('cancelled')}
                    className={`p-4 rounded-lg border-2 transition-all ${statusFilter === 'cancelled'
                        ? 'border-red-500 bg-red-50'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                >
                    <p className="text-2xl font-bold text-red-600">{statusCounts.cancelled}</p>
                    <p className="text-sm text-neutral-600">Cancelled</p>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-card p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search by order ID, customer name, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                        <p className="mt-2 text-neutral-600">Loading orders...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-8 text-center">
                        <Package className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                        <p className="text-neutral-500">No orders found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/admin/orders/${order.id}`}
                                                className="font-mono text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                            >
                                                {order.id.slice(0, 8).toUpperCase()}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-neutral-900">{order.customer_name}</p>
                                                <p className="text-sm text-neutral-500">{order.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {formatDateTime(order.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {order.items?.length || 0} items
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-neutral-900">
                                                {formatPrice(order.subtotal || 0)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                                {order.status || 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/admin/orders/${order.id}`}>
                                                <button className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
