'use client';

import Link from 'next/link';
import { Home, Grid, ShoppingCart, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';

/**
 * Mobile Bottom Navigation
 * Fixed at bottom for mobile users
 */
export default function BottomNav() {
    const pathname = usePathname();
    const { getItemCount } = useCart();
    const cartCount = getItemCount();

    const navItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/products', icon: Grid, label: 'Shop' },
        { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
        { href: '/account', icon: User, label: 'Account' },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-bottom-nav safe-bottom">
            <div className="grid grid-cols-4 h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? 'text-primary-500' : 'text-neutral-600'
                                }`}
                        >
                            <div className="relative">
                                <Icon className="w-5 h-5" />
                                {item.badge > 0 && (
                                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
