'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, Calendar, Package, Eye, ShoppingCart } from 'lucide-react';
import { getDocument, getCollection } from '@/lib/supabase/db';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime, formatPrice, getOrderStatusColor } from '@/lib/utils/format';
import Button from '@/components/ui/Button';

export default function CustomerProfilePage() {
    const params = useParams();
    const router = useRouter();
    
    const [customer, setCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCustomerData();
    }, [params.id]);

    async function loadCustomerData() {
        try {
            const isGuest = params.id.startsWith('guest_');

            if (isGuest) {
                // 1. Decode Email
                const base64Email = params.id.replace('guest_', '');
                const email = Buffer.from(base64Email, 'base64').toString('utf-8');

                // 2. Fetch User's Order History by Email
                const { data: orderData, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('email', email)
                    .order('created_at', { ascending: false });

                if (!error) {
                    setOrders(orderData || []);
                }

                // 3. Reconstruct User Profile from latest order
                const latestOrder = orderData?.[0];
                if (latestOrder) {
                    setCustomer({
                        id: params.id,
                        email: email,
                        display_name: latestOrder.customer_name || 'Anonymous',
                        phone: latestOrder.phone || '',
                        is_admin: false,
                        is_guest: true,
                        created_at: orderData[orderData.length - 1]?.created_at || latestOrder.created_at, // Use first order date
                    });
                }
            } else {
                // 1. Fetch User Data
                const { data: userData } = await getDocument('users', params.id);
                setCustomer(userData);

                // 2. Fetch User's Order History by User ID
                if (userData) {
                    const { data: orderData, error } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('user_id', params.id)
                        .order('created_at', { ascending: false });
                        
                    if (!error) {
                        setOrders(orderData || []);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading customer:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-neutral-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-neutral-400" />
                </div>
                <h2 className="text-xl font-bold mb-2">Customer Not Found</h2>
                <p className="text-neutral-500 mb-6">This user does not exist or has been removed.</p>
                <Button onClick={() => router.push('/admin/customers')}>Back to Customers</Button>
            </div>
        );
    }

    // Calculate customer lifetime value
    const totalSpent = orders
        .filter(o => o.payment_status === 'paid' && o.status !== 'cancelled')
        .reduce((sum, order) => sum + (order.total || (order.subtotal - (order.discount||0))), 0);

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/admin/customers')}>
                        ←
                    </Button>
                    Customer Profile
                </h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-card overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-primary-500 to-primary-700"></div>
                        <div className="px-6 pb-6 relative">
                            {/* Avatar */}
                            <div className="w-20 h-20 bg-white border-4 border-white rounded-full flex items-center justify-center shadow-lg absolute -top-10">
                                <div className="w-full h-full bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-2xl">
                                    {(customer.display_name?.[0] || customer.email?.[0] || 'U').toUpperCase()}
                                </div>
                            </div>
                            
                            <div className="mt-12">
                                <h2 className="text-xl font-bold text-neutral-900">
                                    {customer.display_name || 'Guest User'}
                                </h2>
                                <p className="text-sm text-neutral-500 font-mono mt-1">ID: {customer.id}</p>
                                
                                <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                                        <Mail className="w-4 h-4 text-neutral-400" />
                                        <a href={`mailto:${customer.email}`} className="hover:text-primary-600 transition-colors">
                                            {customer.email || 'No email provided'}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                                        <Phone className="w-4 h-4 text-neutral-400" />
                                        <a href={`tel:${customer.phone}`} className="hover:text-primary-600 transition-colors">
                                            {customer.phone || 'No phone provided'}
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                                        <Calendar className="w-4 h-4 text-neutral-400" />
                                        <span>Joined {formatDateTime(customer.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-neutral-600">
                                        <User className="w-4 h-4 text-neutral-400" />
                                        <span className={customer.is_admin ? "text-purple-600 font-medium" : customer.is_guest ? "text-blue-600 font-medium" : ""}>
                                            Role: {customer.is_admin ? 'Administrator' : customer.is_guest ? 'Guest Checkout' : 'Customer'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white rounded-xl shadow-card p-6">
                        <h3 className="font-semibold text-lg mb-4">Account Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                                <p className="text-sm text-neutral-500 mb-1">Total Orders</p>
                                <p className="text-2xl font-bold text-neutral-900">{orders.length}</p>
                            </div>
                            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                                <p className="text-sm text-neutral-500 mb-1">Lifetime Value</p>
                                <p className="text-2xl font-bold text-primary-600">{formatPrice(totalSpent)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Order History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-card flex flex-col h-full">
                        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary-500" />
                                Order History
                            </h3>
                            <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                {orders.length} Records
                            </span>
                        </div>

                        {orders.length === 0 ? (
                            <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                                    <ShoppingCart className="w-8 h-8 text-neutral-300" />
                                </div>
                                <h4 className="text-lg font-medium text-neutral-900 mb-1">No Orders Yet</h4>
                                <p className="text-neutral-500">This customer hasn't purchased anything yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-neutral-50 border-b border-neutral-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium text-neutral-500">Order ID</th>
                                            <th className="px-6 py-3 text-left font-medium text-neutral-500">Date</th>
                                            <th className="px-6 py-3 text-left font-medium text-neutral-500">Status</th>
                                            <th className="px-6 py-3 text-left font-medium text-neutral-500">Total</th>
                                            <th className="px-6 py-3 text-right font-medium text-neutral-500">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <Link 
                                                        href={`/admin/orders/${order.id}`}
                                                        className="font-mono font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                                    >
                                                        {order.id.slice(0, 8).toUpperCase()}
                                                    </Link>
                                                    <p className="text-xs text-neutral-500 mt-1">{order.items?.length || 0} items</p>
                                                </td>
                                                <td className="px-6 py-4 text-neutral-600">
                                                    {formatDateTime(order.created_at)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {order.payment_status === 'failed' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            Payment Failed
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                                            {order.status || 'pending'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-neutral-900">
                                                    {formatPrice(order.subtotal)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link href={`/admin/orders/${order.id}`}>
                                                        <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-primary-600 hover:bg-primary-50">
                                                            <Eye className="w-4 h-4 mr-1.5" /> View
                                                        </Button>
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
            </div>
        </div>
    );
}
