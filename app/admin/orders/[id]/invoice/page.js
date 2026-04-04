'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDocument } from '@/lib/supabase/db';
import { formatPrice, formatDate } from '@/lib/utils/format';

export default function InvoicePrintPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [storeSettings, setStoreSettings] = useState(null);
    const [gstSettings, setGstSettings] = useState(null);
    const [designSettings, setDesignSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAll() {
            try {
                const [orderRes, storeRes, gstRes, designRes] = await Promise.all([
                    getDocument('orders', params.id),
                    getDocument('settings', 'store'),
                    getDocument('settings', 'gst'),
                    getDocument('settings', 'design')
                ]);

                if (orderRes.data) setOrder(orderRes.data);
                if (storeRes.data) setStoreSettings(storeRes.data);
                if (gstRes.data) setGstSettings(gstRes.data);
                if (designRes.data) setDesignSettings(designRes.data);
                
                setLoading(false);
                
                // Allow time for images to load, then auto-print
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
        return <div className="p-8 text-center print:hidden">Loading Invoice...</div>;
    }

    if (!order) {
        return <div className="p-8 text-center text-red-500 print:hidden">Order not found.</div>;
    }

    // Invoice computation
    const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;
    const invoiceDate = formatDate(order.created_at);
    
    // Tax computation logic derived from saved order
    let subtotal = order.subtotal || 0;
    let taxAmount = order.tax_amount || 0;
    let taxPercentage = order.tax_percentage || 0;
    let discount = order.discount || 0;
    let shipping = order.shipping_cost || 0;
    let finalTotal = subtotal + shipping + taxAmount - discount;
    if (order.total) {
        finalTotal = order.total; // Use true total if exists mathematically
    }

    return (
        <div className="bg-white min-h-screen text-black">
            {/* Print action bar */}
            <div className="print:hidden bg-neutral-100 p-4 flex justify-between items-center border-b max-w-4xl mx-auto">
                <button onClick={() => router.back()} className="px-4 py-2 bg-white border border-neutral-300 rounded hover:bg-neutral-50 font-medium">
                    ← Back to Order
                </button>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 font-medium font-bold">
                        Print Invoice
                    </button>
                </div>
            </div>

            {/* A4 Document Canvas */}
            <div className="max-w-4xl mx-auto p-8 sm:p-12 print:p-0 print:w-full print:max-w-none text-sm" style={{ width: '210mm', minHeight: '297mm' }}>
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-neutral-800 pb-6 mb-6">
                    <div className="w-1/2">
                        {designSettings?.logo_url ? (
                            <img src={designSettings.logo_url} alt="Store Logo" className="max-h-16 mb-4 object-contain" />
                        ) : (
                            <h1 className="text-3xl font-bold font-display uppercase tracking-wider mb-2">
                                {storeSettings?.store_name || 'YellowStone Jewellery'}
                            </h1>
                        )}
                        <p className="text-neutral-600 whitespace-pre-wrap">{storeSettings?.business_address || 'Business Address Not Set'}</p>
                        {gstSettings?.enabled && gstSettings?.gstin && (
                            <p className="font-semibold mt-2">GSTIN: {gstSettings.gstin}</p>
                        )}
                        <p className="mt-1">Email: {storeSettings?.contact_email}</p>
                        <p>Phone: {storeSettings?.contact_phone}</p>
                    </div>
                    
                    <div className="w-1/2 text-right">
                        <h2 className="text-4xl font-light text-neutral-400 mb-2">TAX INVOICE</h2>
                        <table className="w-full text-right mt-4">
                            <tbody>
                                <tr>
                                    <td className="py-1 font-semibold text-neutral-600">Invoice No:</td>
                                    <td className="py-1">{invoiceNumber}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold text-neutral-600">Date:</td>
                                    <td className="py-1">{invoiceDate}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold text-neutral-600">Order ID:</td>
                                    <td className="py-1">{order.id}</td>
                                </tr>
                                <tr>
                                    <td className="py-1 font-semibold text-neutral-600">Payment:</td>
                                    <td className="py-1 font-bold">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online (Paid)'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Billing Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="font-bold text-neutral-800 border-b border-neutral-300 pb-2 mb-3 uppercase tracking-wide">Billed To (Customer)</h3>
                        <p className="font-bold text-lg">{order.customer_name}</p>
                        <p className="text-neutral-700 mt-1">{order.shipping_address?.address}</p>
                        <p className="text-neutral-700">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                        <p className="text-neutral-700 font-semibold mb-2">PIN: {order.shipping_address?.pincode}</p>
                        <p className="text-neutral-600">Email: {order.email}</p>
                        <p className="text-neutral-600">Phone: {order.phone}</p>
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-800 border-b border-neutral-300 pb-2 mb-3 uppercase tracking-wide">Shipping Address</h3>
                        <p className="font-bold text-lg">{order.customer_name}</p>
                        <p className="text-neutral-700 mt-1">{order.shipping_address?.address}</p>
                        <p className="text-neutral-700">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                        <p className="text-neutral-700 font-semibold mb-2">PIN: {order.shipping_address?.pincode}</p>
                        <p className="text-neutral-600">Phone: {order.phone}</p>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8 border-collapse">
                    <thead>
                        <tr className="bg-neutral-100 border-y-2 border-neutral-800 text-neutral-800">
                            <th className="py-3 px-4 text-left font-bold">#</th>
                            <th className="py-3 px-4 text-left font-bold">Item Description</th>
                            <th className="py-3 px-4 text-center font-bold">Qty</th>
                            <th className="py-3 px-4 text-right font-bold">Rate</th>
                            <th className="py-3 px-4 text-right font-bold">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="border-b border-neutral-300">
                        {order.items?.map((item, index) => (
                            <tr key={index} className="border-b border-neutral-200">
                                <td className="py-4 px-4 text-left align-top">{index + 1}</td>
                                <td className="py-4 px-4 text-left align-top">
                                    <p className="font-semibold">{item.name}</p>
                                    {item.variant && (
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                        </p>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-center align-top">{item.quantity}</td>
                                <td className="py-4 px-4 text-right align-top">{formatPrice(item.price)}</td>
                                <td className="py-4 px-4 text-right align-top font-medium">{formatPrice(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals Section */}
                <div className="flex justify-end">
                    <div className="w-1/2 min-w-[300px]">
                        <table className="w-full text-right">
                            <tbody>
                                <tr className="text-neutral-600">
                                    <td className="py-2 px-4">Subtotal:</td>
                                    <td className="py-2 px-4">{formatPrice(subtotal)}</td>
                                </tr>
                                
                                {discount > 0 && (
                                    <tr className="text-green-600">
                                        <td className="py-2 px-4">Discount:</td>
                                        <td className="py-2 px-4">-{formatPrice(discount)}</td>
                                    </tr>
                                )}
                                
                                <tr className="text-neutral-600">
                                    <td className="py-2 px-4 border-b border-neutral-200">Shipping:</td>
                                    <td className="py-2 px-4 border-b border-neutral-200">{shipping === 0 ? 'FREE' : formatPrice(shipping)}</td>
                                </tr>

                                {taxAmount > 0 && (
                                    <>
                                        <tr className="text-neutral-700">
                                            <td className="py-2 px-4 font-medium">Estimated Tax ({taxPercentage}%):</td>
                                            <td className="py-2 px-4">{formatPrice(taxAmount)}</td>
                                        </tr>
                                    </>
                                )}

                                <tr className="text-lg font-bold border-t-2 border-neutral-800">
                                    <td className="py-3 px-4">Grand Total:</td>
                                    <td className="py-3 px-4">{formatPrice(finalTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-16 pt-8 border-t border-neutral-300 text-neutral-500 text-xs text-center flex flex-col gap-2">
                    <p><strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                    <p>SUBJECT TO {storeSettings?.business_address?.split(',').pop()?.trim() || 'LOCAL'} JURISDICTION.</p>
                    <p className="mt-4 font-medium italic">Thank you for shopping with {storeSettings?.store_name || 'YellowStone Jewellery'}!</p>
                </div>
            </div>
            
            <style jsx global>{`
                @media print {
                    body {
                        background: white;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    /* Ensure headers/footers generated by browser are minimal if possible */
                    @page {
                        margin: 0.5cm;
                        size: A4 portrait;
                    }
                }
            `}</style>
        </div>
    );
}
