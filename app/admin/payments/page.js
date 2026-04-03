'use client';

import { useState, useEffect } from 'react';
import { Search, CreditCard, Check, X, AlertCircle, Download } from 'lucide-react';
import { getAllDocuments } from '@/lib/supabase/db';
import { formatPrice, formatDateTime, getPaymentStatusColor, formatDate } from '@/lib/utils/format';
import Button from '@/components/ui/Button';

export default function AdminPaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadPayments();
    }, []);

    async function loadPayments() {
        const { data: ordersData } = await getAllDocuments('orders', {
            orderBy: 'created_at',
            ascending: false,
            limit: 500, // Increased for better reporting
        });

        // Transform orders to payment records
        const paymentRecords = (ordersData || []).map(order => ({
            id: order.id,
            orderId: order.id,
            customerName: order.customer_name,
            email: order.email,
            amount: order.subtotal,
            status: order.payment_status || 'pending',
            method: order.payment_method || 'online',
            transactionId: order.payment_id || '-',
            createdAt: order.created_at,
        }));

        setPayments(paymentRecords);
        setLoading(false);
    }

    const filteredPayments = payments.filter(payment => {
        const matchesSearch =
            payment.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleExport = (type) => {
        if (filteredPayments.length === 0) {
            alert('No data to export');
            return;
        }

        const dataToExport = filteredPayments.map(p => ({
            'Order ID': p.orderId,
            'Date': formatDate(p.createdAt),
            'Customer': p.customerName,
            'Email': p.email,
            'Amount': p.amount,
            'Method': p.method,
            'Status': p.status,
            'Transaction ID': p.transactionId
        }));

        const fileName = `payments-export-${statusFilter}`;

        if (type === 'excel') {
            import('@/lib/utils/export').then(mod => mod.exportToExcel(dataToExport, fileName));
        } else {
            import('@/lib/utils/export').then(mod => mod.exportToCSV(dataToExport, fileName));
        }
    };

    const stats = {
        total: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        success: payments.filter(p => p.status === 'success' || p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
        pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0),
        failed: payments.filter(p => p.status === 'failed').length,
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Payment Transactions</h1>
                    <p className="text-neutral-600 mt-1">View and manage all payment transactions</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport('csv')} disabled={loading || filteredPayments.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                    </Button>
                    <Button onClick={() => handleExport('excel')} disabled={loading || filteredPayments.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Excel
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-card p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-sm text-neutral-600">Total Volume</h3>
                    </div>
                    <p className="text-2xl font-bold">{formatPrice(stats.total)}</p>
                </div>

                <div className="bg-white rounded-lg shadow-card p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-sm text-neutral-600">Successful</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatPrice(stats.success)}</p>
                </div>

                <div className="bg-white rounded-lg shadow-card p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <h3 className="text-sm text-neutral-600">Pending</h3>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{formatPrice(stats.pending)}</p>
                </div>

                <div className="bg-white rounded-lg shadow-card p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <X className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-sm text-neutral-600">Failed</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-card p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by order ID, customer, email, or transaction ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="all">All Status</option>
                        <option value="success">Success</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow-card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                        <p className="mt-2 text-neutral-600">Loading payments...</p>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="p-8 text-center">
                        <CreditCard className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                        <p className="text-neutral-500">No payment transactions found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Transaction ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4">
                                            <p className="font-mono text-sm font-medium text-neutral-900">
                                                {payment.orderId.slice(0, 8).toUpperCase()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-neutral-900">{payment.customerName}</p>
                                                <p className="text-sm text-neutral-500">{payment.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {formatDateTime(payment.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-neutral-900">
                                                {formatPrice(payment.amount)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600 capitalize">
                                            {payment.method}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-mono text-xs text-neutral-600">
                                                {payment.transactionId}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                                                {payment.status}
                                            </span>
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
