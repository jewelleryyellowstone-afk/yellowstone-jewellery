'use client';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { formatPrice } from '@/lib/utils/format';

export function RevenueChart({ data }) {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-neutral-400">No data available</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-card border border-neutral-200">
            <h3 className="text-lg font-bold mb-4">Revenue Trend</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#737373', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#737373', fontSize: 12 }}
                            tickFormatter={(value) => `₹${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [formatPrice(value), 'Revenue']}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#D4AF37"
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export function OrdersChart({ data }) {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-neutral-400">No data available</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-card border border-neutral-200">
            <h3 className="text-lg font-bold mb-4">Orders Overview</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#737373', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#737373', fontSize: 12 }}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#F5F5F5' }}
                        />
                        <Bar dataKey="orders" fill="#1e293b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
