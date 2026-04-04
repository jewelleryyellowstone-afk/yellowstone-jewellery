'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, Menu, User, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/hooks/useCart';
import { useAuth } from '@/lib/hooks/useAuth';
import { getDocument } from '@/lib/supabase/db';

export default function Header() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { getItemCount } = useCart();
    const { isAuthenticated } = useAuth();
    const cartCount = getItemCount();
    const [design, setDesign] = useState(null);

    useEffect(() => {
        async function fetchDesign() {
            const { data } = await getDocument('settings', 'design');
            if (data) setDesign(data);
        }
        fetchDesign();
    }, []);

    return (
        <header className="sticky top-0 z-40">
            {/* Top Announcement Bar */}
            {design?.header_text && (
                <div className="bg-primary-600 text-white text-xs sm:text-sm font-medium py-2 px-4 text-center">
                    {design.header_text}
                </div>
            )}
            
            <div className="bg-[#0e1729] border-b border-white/10 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 rounded-md text-white hover:bg-white/10 active:bg-white/20"
                        aria-label="Toggle menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        {design?.logo_url ? (
                            <img
                                src={design.logo_url}
                                alt="YellowStone Jewellery"
                                className="h-14 w-auto object-contain"
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">Y</span>
                                </div>
                                <span className="text-white font-display font-bold text-xl hidden sm:block">YellowStone</span>
                            </div>
                        )}
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link
                            href="/"
                            className={`text-sm font-medium transition-colors ${pathname === '/' ? 'text-primary-400' : 'text-neutral-300 hover:text-white'
                                }`}
                        >
                            Home
                        </Link>
                        <Link
                            href="/products"
                            className={`text-sm font-medium transition-colors ${pathname === '/products' ? 'text-primary-400' : 'text-neutral-300 hover:text-white'
                                }`}
                        >
                            Shop
                        </Link>
                        <Link
                            href="/categories"
                            className={`text-sm font-medium transition-colors ${pathname === '/categories' ? 'text-primary-400' : 'text-neutral-300 hover:text-white'
                                }`}
                        >
                            Categories
                        </Link>
                        <Link
                            href="/offers"
                            className={`text-sm font-medium transition-colors ${pathname === '/offers' ? 'text-primary-400' : 'text-neutral-300 hover:text-white'
                                }`}
                        >
                            Offers
                        </Link>
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Search - Desktop */}
                        <Link
                            href="/search"
                            className="hidden sm:flex p-2 rounded-md text-white hover:bg-white/10 active:bg-white/20"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" />
                        </Link>

                        {/* Account */}
                        <Link
                            href={isAuthenticated ? "/account" : "/login"}
                            className="p-2 rounded-md text-white hover:bg-white/10 active:bg-white/20"
                            aria-label="Account"
                        >
                            <User className="w-5 h-5" />
                        </Link>

                        {/* Cart */}
                        <Link
                            href="/cart"
                            className="relative p-2 rounded-md text-white hover:bg-white/10 active:bg-white/20"
                            aria-label="Shopping cart"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-white/10 py-4 bg-[#0e1729]">
                        <nav className="flex flex-col gap-4">
                            <Link
                                href="/"
                                className={`text-base font-medium ${pathname === '/' ? 'text-primary-400' : 'text-neutral-300'
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                href="/products"
                                className={`text-base font-medium ${pathname === '/products' ? 'text-primary-400' : 'text-neutral-300'
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Shop
                            </Link>
                            <Link
                                href="/categories"
                                className={`text-base font-medium ${pathname === '/categories' ? 'text-primary-400' : 'text-neutral-300'
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Categories
                            </Link>
                            <Link
                                href="/offers"
                                className={`text-base font-medium ${pathname === '/offers' ? 'text-primary-400' : 'text-neutral-300'
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Offers
                            </Link>
                            <Link
                                href="/search"
                                className={`text-base font-medium ${pathname === '/search' ? 'text-primary-400' : 'text-neutral-300'
                                    }`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Search
                            </Link>
                        </nav>
                    </div>
                )}
            </div>
            </div>
        </header>
    );
}
