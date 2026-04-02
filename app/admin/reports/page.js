'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, ShoppingBag, DollarSign, Users, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getAllDocuments } from '@/lib/firebase/firestore';
import { formatPrice, formatDate } from '@/lib/utils/format';

import { RevenueChart, OrdersChart } from '@/components/admin/Charts';

export default function AdminReportsPage() {
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [dateRange, setDateRange] = useState('30');
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalRefunds: 0,
        topProducts: []
    });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        loadData();
    }, [dateRange]);

    async function loadData() {
        setLoading(true);

        const { data: ordersData } = await getAllDocuments('orders', {
            orderByField: 'createdAt',
            orderDirection: 'desc',
            limitCount: 500,
        });

        const { data: productsData } = await getAllDocuments('products');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));

        const filteredOrders = (ordersData || []).filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= cutoffDate;
        });

        // Parse Data for Charts
        const dailyData = {};

        // Initialize all days in range with 0
        for (let i = 0; i < parseInt(dateRange); i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dailyData[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
        }

        filteredOrders.forEach(order => {
            const dateStr = new Date(order.createdAt).toISOString().split('T')[0];
            if (dailyData[dateStr]) {
                const refund = order.refundAmount || 0;
                dailyData[dateStr].revenue += (order.subtotal || 0) - refund;
                dailyData[dateStr].orders += 1;
            }
        });

        // Convert to array and sort by date ascending
        const chartDataArray = Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setChartData(chartDataArray);

        // ... existing stats calculation ...
        const totalRevenue = filteredOrders.reduce((sum, order) => {
            const refund = order.refundAmount || 0;
            return sum + (order.subtotal || 0) - refund;
        }, 0);

        const totalRefunds = filteredOrders.reduce((sum, order) => sum + (order.refundAmount || 0), 0);
        const totalOrders = filteredOrders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // ... top products calculation ...
        const productSales = {};
        filteredOrders.forEach(order => {
            if (order.status !== 'cancelled' || order.paymentStatus === 'refunded') {
                order.items?.forEach(item => {
                    if (!productSales[item.id]) {
                        productSales[item.id] = {
                            name: item.name,
                            quantity: 0,
                            revenue: 0,
                        };
                    }
                    productSales[item.id].quantity += item.quantity;
                    productSales[item.id].revenue += item.price * item.quantity;
                });
            }
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        setStats({ totalRevenue, totalOrders, averageOrderValue, topProducts, totalRefunds });
        setOrders(filteredOrders);
        setProducts(productsData || []);
        setLoading(false);
    }

    const handleExport = async (type) => {
        const { exportToCSV, exportToExcel } = await import('@/lib/utils/export');

        const dataToExport = orders.map(order => ({
            'Order ID': order.id,
            'Date': formatDate(order.createdAt),
            'Customer Name': order.customerName,
            'Email': order.email,
            'Phone': order.phone,
            'Status': order.status,
            'Payment Method': order.paymentMethod,
            'Payment Status': order.paymentStatus,
            'Items': order.items?.map(i => `${i.name} (x${i.quantity})`).join(', '),
            'Subtotal': order.subtotal,
            'Discount': order.discount || 0,
            'Total': (order.subtotal || 0) - (order.discount || 0)
        }));

        if (type === 'csv') {
            exportToCSV(dataToExport, `sales_report_${dateRange}days`);
        } else {
            exportToExcel(dataToExport, `sales_report_${dateRange}days`);
        }
    };

    const statCards = [
        {
            label: 'Total Revenue',
            value: formatPrice(stats.totalRevenue),
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-100',
        },
        {
            label: 'Total Orders',
            value: stats.totalOrders,
            icon: ShoppingBag,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
        },
        {
            label: 'Average Order Value',
            value: formatPrice(stats.averageOrderValue),
            icon: TrendingUp,
            color: 'text-purple-600',
            bg: 'bg-purple-100',
        },
        {
            label: 'Refunds / Returns',
            value: formatPrice(stats.totalRefunds),
            icon: RotateCcw,
            color: 'text-red-600',
            bg: 'bg-red-100',
        },
    ];

    return (
        <div>
            {/* ... Header and Export Buttons ... */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Sales Reports & Analytics</h1>
                    <p className="text-neutral-600 mt-1">Track your business performance</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleExport('csv')} disabled={loading || orders.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        CSV
                    </Button>
                    <Button onClick={() => handleExport('excel')} disabled={loading || orders.length === 0}>
                        <Download className="w-4 h-4 mr-2" />
                        Excel
                    </Button>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow-card p-4 mb-6">
                <div className="flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-neutral-600" />
                    <span className="text-sm font-medium">Date Range:</span>
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                </div>
            </div>

            {/* Charts Section */}
            {!loading && (
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <RevenueChart data={chartData} />
                    <OrdersChart data={chartData} />
                </div>
            )}


            {/* Stats Cards */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <>
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
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Top Products Table */}
                    <div className="bg-white rounded-lg shadow-card overflow-hidden mb-6">
                        <div className="p-6 border-b border-neutral-200">
                            <h2 className="text-lg font-bold">Top Selling Products</h2>
                            <p className="text-sm text-neutral-600 mt-1">Based on revenue in selected period</p>
                        </div>
                        {stats.topProducts.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500">
                                No sales data available for this period
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 border-b border-neutral-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Units Sold</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200">
                                        {stats.topProducts.map((product, index) => (
                                            <tr key={index} className="hover:bg-neutral-50">
                                                <td className="px-6 py-4 text-sm text-neutral-600">{index + 1}</td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-neutral-900">{product.name}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-neutral-600">
                                                    {product.quantity} units
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-neutral-900">{formatPrice(product.revenue)}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Recent Orders Summary */}
                    <div className="bg-white rounded-lg shadow-card p-6">
                        <h2 className="text-lg font-bold mb-4">Order Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-neutral-200">
                                <span className="text-neutral-600">Total Orders</span>
                                <span className="font-semibold">{stats.totalOrders}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-neutral-200">
                                <span className="text-neutral-600">Delivered</span>
                                <span className="font-semibold text-green-600">
                                    {orders.filter(o => o.status === 'delivered').length}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-neutral-200">
                                <span className="text-neutral-600">Shipped</span>
                                <span className="font-semibold text-orange-600">
                                    {orders.filter(o => o.status === 'shipped').length}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-neutral-200">
                                <span className="text-neutral-600">Pending</span>
                                <span className="font-semibold text-yellow-600">
                                    {orders.filter(o => o.status === 'pending' || o.status === 'new').length}
                                </span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-neutral-600">Cancelled</span>
                                <span className="font-semibold text-red-600">
                                    {orders.filter(o => o.status === 'cancelled').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
