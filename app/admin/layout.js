'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    CreditCard,
    TruckIcon,
    BarChart3,
    Image as ImageIcon,
    Settings,
    Grid,
    Users
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminLayout({ children }) {
    const router = useRouter();
    const { userData, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!userData) {
                console.log('AdminLayout: No user data, redirecting to home');
                router.push('/');
            } else if (!userData.is_admin) {
                console.log('AdminLayout: User is not admin, redirecting to home', userData);
                router.push('/');
            }
        }
    }, [userData, loading, router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!userData?.is_admin) {
        return null;
    }

    const navItems = [
        { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/customers', icon: Users, label: 'Customers' },
        { href: '/admin/products', icon: ShoppingBag, label: 'Products' },
        { href: '/admin/categories', icon: Grid, label: 'Categories' },
        { href: '/admin/orders', icon: Package, label: 'Orders' },
        { href: '/admin/discounts', icon: CreditCard, label: 'Discounts' },
        { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
        { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
        { href: '/admin/banners', icon: ImageIcon, label: 'Banners' },
        { href: '/admin/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="flex min-h-screen bg-neutral-50 print:bg-white">
            {/* Sidebar */}
            <aside className="w-64 bg-neutral-900 text-white flex-shrink-0 hidden lg:block print:hidden">
                <div className="p-6">
                    <h1 className="text-xl font-display font-bold">Admin Panel</h1>
                    <p className="text-sm text-neutral-400 mt-1">YellowStone</p>
                </div>
                <nav className="px-3">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-3 rounded-lg text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors mb-1"
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col print:block">
                {/* Top Bar */}
                <header className="bg-white border-b border-neutral-200 px-6 py-4 print:hidden">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Admin Dashboard</h2>
                        <Link href="/account" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            ← Back to Store
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
