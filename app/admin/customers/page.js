'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Eye, Users } from 'lucide-react';
import { getAllDocuments } from '@/lib/supabase/db';
import { supabase } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/utils/format';
import Button from '@/components/ui/Button';

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadCustomers();
    }, []);

    async function loadCustomers() {
        try {
            // Fetch registered users
            const { data: usersData } = await getAllDocuments('users', {
                orderByField: 'created_at',
                orderDirection: 'desc',
            });
            const registeredUsers = usersData || [];

            // Fetch order data to identify guests
            const { data: ordersData } = await supabase.from('orders').select('email, customer_name, phone, created_at, user_id');
            const orders = ordersData || [];

            // Identify unique guest emails
            const guestMap = new Map();
            orders.forEach(order => {
                // If it doesn't have a user_id, or the user isn't in our registered list
                if ((!order.user_id || !registeredUsers.some(u => u.id === order.user_id)) && order.email) {
                    if (!guestMap.has(order.email)) {
                        guestMap.set(order.email, {
                            id: `guest_${Buffer.from(order.email).toString('base64')}`,
                            email: order.email,
                            display_name: order.customer_name || 'Anonymous',
                            phone: order.phone || '',
                            is_admin: false,
                            is_guest: true,
                            created_at: order.created_at // Use first order date
                        });
                    }
                }
            });

            const guestUsers = Array.from(guestMap.values());
            
            // Merge and sort
            const allCustomers = [...registeredUsers, ...guestUsers].sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            );

            setCustomers(allCustomers);
        } catch (error) {
            console.error('Failed to load customers:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch =
            customer.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.id.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    const handleExport = () => {
        if (filteredCustomers.length === 0) {
            alert('No data to export');
            return;
        }

        const dataToExport = filteredCustomers.map(customer => ({
            'Customer ID': customer.id,
            'Joined Date': formatDateTime(customer.created_at),
            'Name': customer.display_name || '-',
            'Email': customer.email || '-',
            'Phone': customer.phone || '-',
            'Admin': customer.is_admin ? 'Yes' : 'No'
        }));

        import('@/lib/utils/export').then(mod => mod.exportToCSV(dataToExport, 'customers-export'));
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Customers (CRM)</h1>
                    <p className="text-neutral-600 mt-1">{customers.length} total registered customers</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport} disabled={loading || filteredCustomers.length === 0}>
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-card p-4 mb-6 relative">
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-lg shadow-card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                        <p className="mt-2 text-neutral-600">Loading customers...</p>
                    </div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-8 text-center">
                        <Users className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                        <p className="text-neutral-500">No customers found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Joined Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {filteredCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                                    {(customer.display_name?.[0] || customer.email?.[0] || 'U').toUpperCase()}
                                                </div>
                                                <div>
                                                    <Link 
                                                        href={`/admin/customers/${customer.id}`}
                                                        className="font-medium text-neutral-900 hover:text-primary-600 transition-colors"
                                                    >
                                                        {customer.display_name || 'Guest User'}
                                                    </Link>
                                                    <p className="text-xs text-neutral-500 font-mono mt-0.5">{customer.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <p className="text-neutral-900">{customer.email || 'No email'}</p>
                                                {customer.phone && <p className="text-neutral-500 mt-0.5">{customer.phone}</p>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {formatDateTime(customer.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {customer.is_admin ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    Admin
                                                </span>
                                            ) : customer.is_guest ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    Guest
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                                                    Customer
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/admin/customers/${customer.id}`}>
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
