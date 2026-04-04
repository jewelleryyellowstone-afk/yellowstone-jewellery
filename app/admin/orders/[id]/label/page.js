'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDocument } from '@/lib/supabase/db';
import { formatPrice } from '@/lib/utils/format';

export default function ShippingLabelPrintPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [storeSettings, setStoreSettings] = useState(null);
    const [designSettings, setDesignSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAll() {
            try {
                const [orderRes, storeRes, designRes] = await Promise.all([
                    getDocument('orders', params.id),
                    getDocument('settings', 'store'),
                    getDocument('settings', 'design')
                ]);

                if (orderRes.data) setOrder(orderRes.data);
                if (storeRes.data) setStoreSettings(storeRes.data);
                if (designRes.data) setDesignSettings(designRes.data);
                
                setLoading(false);
                
                setTimeout(() => {
                    window.print();
                }, 1000);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        }
        fetchAll();
    }, [params.id]);

    if (loading) {
        return <div className="p-8 text-center print:hidden">Loading Label...</div>;
    }

    if (!order) {
        return <div className="p-8 text-center text-red-500 print:hidden">Order not found.</div>;
    }

    const { shipping_address, payment_method, id } = order;
    
    // We compute total item quantities so Courier boys know
    const totalQty = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
    
    return (
        <div className="bg-neutral-200 min-h-screen text-black flex flex-col items-center py-8 print:py-0 print:bg-white">
            {/* Print action bar */}
            <div className="print:hidden bg-white p-4 flex flex-col sm:flex-row justify-between items-center border rounded shadow mb-8 w-full max-w-[4in] gap-4">
                <button onClick={() => router.back()} className="px-3 py-1.5 border border-neutral-300 rounded hover:bg-neutral-50 text-sm font-medium">
                    ← Back
                </button>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="px-3 py-1.5 bg-neutral-800 text-white rounded hover:bg-black text-sm font-bold" title="Destination: Save as PDF">
                        PDF
                    </button>
                    <button onClick={() => window.print()} className="px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm font-bold">
                        Print Label
                    </button>
                </div>
            </div>

            {/* 4x6 Label Canvas (100mm x 150mm roughly) */}
            <div className="bg-white border-2 border-black overflow-hidden relative print:border-0" style={{ width: '4in', height: '6in' }}>
                
                {/* Header / Routing */}
                <div className="border-b-2 border-black flex h-[1in]">
                    <div className="w-1/2 border-r border-black flex items-center justify-center p-2">
                        {designSettings?.logo_url ? (
                            <img src={designSettings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain grayscale" />
                        ) : (
                            <h1 className="font-bold text-center leading-tight uppercase font-display text-lg">{storeSettings?.store_name}</h1>
                        )}
                    </div>
                    <div className="w-1/2 flex flex-col items-center justify-center p-2 bg-neutral-900 text-white relative print:bg-black print:text-white" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                        <span className="text-sm font-bold tracking-widest uppercase">STD</span>
                        <span className="text-3xl font-black">{payment_method === 'cod' ? 'COD' : 'PRE'}</span>
                    </div>
                </div>

                {/* Return Address & Contact */}
                <div className="border-b-2 border-black p-3 text-xs leading-tight">
                    <p className="font-bold text-[10px] mb-1">RETURN TO ORIGIN:</p>
                    <p className="font-semibold">{storeSettings?.store_name || 'Store'}</p>
                    <p className="line-clamp-2 pr-4">{storeSettings?.business_address || 'Address Not Set'}</p>
                    <p className="mt-1 font-semibold">Ph: {storeSettings?.whatsapp_number || storeSettings?.contact_phone}</p>
                </div>

                {/* To Address */}
                <div className="border-b-2 border-black p-3 h-[2.2in] flex flex-col">
                    <p className="font-bold border-b border-neutral-300 pb-1 mb-2">DELIVER TO:</p>
                    <p className="text-xl font-bold uppercase leading-tight mb-1">{order.customer_name}</p>
                    <p className="text-base leading-snug flex-1">{shipping_address?.address}</p>
                    
                    <p className="text-lg font-semibold uppercase mt-1">{shipping_address?.city}</p>
                    <div className="flex gap-2 items-end mt-1">
                        <p className="text-base font-semibold">{shipping_address?.state}</p>
                        <p className="text-2xl font-black ml-auto">{shipping_address?.pincode}</p>
                    </div>
                    <p className="font-bold text-base mt-2 pt-2 border-t border-dashed border-neutral-400">Ph: {order.phone}</p>
                </div>

                {/* Weight / AWB & Details */}
                <div className="border-b-2 border-black p-2 flex text-xs">
                    <div className="w-1/2 border-r border-black pr-2">
                        <p><strong>Order ID:</strong></p>
                        <p className="font-mono">{id.slice(0, 10).toUpperCase()}</p>
                    </div>
                    <div className="w-1/2 pl-2">
                        <p><strong>Items/Qty:</strong> {totalQty}</p>
                        <p><strong>Weight:</strong> 0.5 kg</p>
                    </div>
                </div>

                {/* Amount / COD Box */}
                <div className="h-[0.8in] flex items-center justify-center relative">
                    <div className="absolute inset-x-2 inset-y-2 border-2 border-black rounded flex items-center justify-center bg-neutral-100">
                        {payment_method === 'cod' ? (
                            <div className="text-center">
                                <p className="text-sm font-bold uppercase tracking-widest">Collect Cash</p>
                                <p className="text-3xl font-black">{formatPrice(order.total || (order.subtotal + (order.shipping_cost||0) + (order.tax_amount||0) - (order.discount||0)))}</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="text-3xl font-black tracking-widest">PAID</p>
                                <p className="text-xs uppercase font-bold mt-1">PREPAID - DO NOT COLLECT CASH</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    @page {
                        size: 4in 6in;
                        margin: 0; /* Important: Removes the browser headers and footers (date, URL, page title)! */
                    }
                    /* Ensure full darkness on print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}
