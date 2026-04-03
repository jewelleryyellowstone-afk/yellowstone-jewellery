'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PackageOpen, MapPin, User as UserIcon, LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { logout } from '@/lib/supabase/auth';

export default function AccountPage() {
    const router = useRouter();
    const { user, userData, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="container-custom py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
                    <div className="h-32 bg-neutral-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="container-custom py-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-display font-bold">My Account</h1>
                        <p className="text-neutral-600 mt-1">{userData?.email}</p>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    {/* Orders */}
                    <Link href="/account/orders">
                        <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-card-hover transition-shadow">
                            <PackageOpen className="w-8 h-8 text-primary-500 mb-3" />
                            <h2 className="font-semibold text-lg mb-1">My Orders</h2>
                            <p className="text-sm text-neutral-600">Track and manage your orders</p>
                        </div>
                    </Link>

                    {/* Addresses */}
                    <Link href="/account/addresses">
                        <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-card-hover transition-shadow">
                            <MapPin className="w-8 h-8 text-primary-500 mb-3" />
                            <h2 className="font-semibold text-lg mb-1">Addresses</h2>
                            <p className="text-sm text-neutral-600">Manage your saved addresses</p>
                        </div>
                    </Link>

                    {/* Profile */}
                    <Link href="/account/profile">
                        <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-card-hover transition-shadow">
                            <UserIcon className="w-8 h-8 text-primary-500 mb-3" />
                            <h2 className="font-semibold text-lg mb-1">Profile</h2>
                            <p className="text-sm text-neutral-600">Update your personal information</p>
                        </div>
                    </Link>

                    {/* Admin Dashboard - Only for admins */}
                    {userData?.is_admin && (
                        <Link href="/admin">
                            <div className="bg-primary-50 rounded-lg border-2 border-primary-200 p-6 hover:shadow-card-hover transition-shadow">
                                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mb-3">
                                    <span className="text-white font-bold text-sm">A</span>
                                </div>
                                <h2 className="font-semibold text-lg mb-1 text-primary-900">Admin Dashboard</h2>
                                <p className="text-sm text-primary-700">Manage store and orders</p>
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
