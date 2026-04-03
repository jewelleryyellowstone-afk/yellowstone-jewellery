'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Mail, Phone, MapPin } from 'lucide-react';
import { getDocument } from '@/lib/supabase/db';

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const [design, setDesign] = useState(null);

    useEffect(() => {
        async function fetchDesign() {
            const { data } = await getDocument('settings', 'design');
            if (data) setDesign(data);
        }
        fetchDesign();
    }, []);

    return (
        <footer className="bg-neutral-900 text-neutral-300 pb-20 lg:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <img
                                src={design?.logo_url || "https://firebasestorage.googleapis.com/v0/b/studio-9211767550-84917.firebasestorage.app/o/logoaa.png?alt=media&token=3ceb0faa-b7ba-4440-ad8e-d48a08a2b57f"}
                                alt="YellowStone Jewellery"
                                className="h-10 w-auto object-contain brightness-0 invert"
                            />
                        </div>
                        <p className="text-sm text-neutral-400">
                            Premium artificial jewellery for every occasion. Trusted by women across India for over 10 years.
                        </p>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Shop</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/products?category=earrings" className="text-sm hover:text-white transition-colors">
                                    Earrings
                                </Link>
                            </li>
                            <li>
                                <Link href="/products?category=necklaces" className="text-sm hover:text-white transition-colors">
                                    Necklaces
                                </Link>
                            </li>
                            <li>
                                <Link href="/products?category=bangles" className="text-sm hover:text-white transition-colors">
                                    Bangles
                                </Link>
                            </li>
                            <li>
                                <Link href="/products?category=rings" className="text-sm hover:text-white transition-colors">
                                    Rings
                                </Link>
                            </li>
                            <li>
                                <Link href="/products?category=bridal" className="text-sm hover:text-white transition-colors">
                                    Bridal Collection
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Customer Service</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/account/orders" className="text-sm hover:text-white transition-colors">
                                    Track Order
                                </Link>
                            </li>
                            <li>
                                <Link href="/returns" className="text-sm hover:text-white transition-colors">
                                    Return & Refund Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping" className="text-sm hover:text-white transition-colors">
                                    Shipping Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-sm hover:text-white transition-colors">
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-sm hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-sm">
                                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <a href="mailto:jewellery.yellowstone@gmail.com" className="hover:text-white transition-colors">
                                    jewellery.yellowstone@gmail.com
                                </a>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <a href="tel:+919891263806" className="hover:text-white transition-colors">
                                    +91 98912 63806
                                </a>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>Harij, Patan, Gujarat, India</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Payment & Trust Badges */}
                <div className="mt-12 pt-8 border-t border-neutral-800">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-xs text-neutral-400">
                            <span>Secure Payments</span>
                            <span>•</span>
                            <span>Easy Returns</span>
                            <span>•</span>
                            <span>Nationwide Delivery</span>
                        </div>
                        <p className="text-xs text-neutral-400">
                            {design?.footer_text || `© ${currentYear} YellowStone Jewellery. All rights reserved.`}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
