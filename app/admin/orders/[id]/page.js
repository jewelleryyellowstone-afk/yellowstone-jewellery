'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Package, MapPin, CreditCard, User, Phone, Mail, TruckIcon, Printer } from 'lucide-react';
import Button from '@/components/ui/Button';
import { getDocument, updateDocument } from '@/lib/supabase/db';
import { getIdToken } from '@/lib/supabase/auth';
import { formatPrice, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from '@/lib/utils/format';

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');

    const [showShipModal, setShowShipModal] = useState(false);
    const [shipmentData, setShipmentData] = useState({
        courierName: '',
        trackingNumber: '',
        trackingUrl: ''
    });

    useEffect(() => {
        loadOrder();
    }, [params.id]);

    async function loadOrder() {
        const { data } = await getDocument('orders', params.id);
        setOrder(data);
        if (data) {
            setRefundAmount(data.subtotal?.toString() || '');
        }
        setLoading(false);
    }

    async function updateStatus(newStatus) {
        if (newStatus === 'shipped') {
            setShowShipModal(true);
            return;
        }
        proceedStatusUpdate(newStatus);
    }

    async function proceedStatusUpdate(newStatus) {
        setUpdating(true);
        const { error } = await updateDocument('orders', params.id, { status: newStatus });
        if (!error) {
            setOrder({ ...order, status: newStatus });

            if (newStatus === 'shipped' || newStatus === 'delivered') {
                try {
                    const token = await getIdToken();
                    await fetch('/api/notifications', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ orderId: params.id, type: `order_${newStatus}` }),
                    });
                    alert(`Order status updated to ${newStatus} and notification sent.`);
                } catch (err) {
                    console.error('Failed to trigger notification:', err);
                    alert(`Order status updated, but notification failed: ${err.message}`);
                }
            } else {
                alert('Order status updated successfully');
            }
        } else {
            alert('Failed to update status: ' + error);
        }
        setUpdating(false);
    }

    async function handleRefund() {
        if (!refundAmount) {
            alert('Please enter refund amount');
            return;
        }

        if (!confirm('Are you sure you want to mark this order as refunded? This cannot be undone.')) return;

        setUpdating(true);
        const { error } = await updateDocument('orders', params.id, {
            payment_status: 'refunded',
            refund_amount: parseFloat(refundAmount),
            refund_reason: refundReason,
            refunded_at: new Date().toISOString(),
            status: 'cancelled'
        });

        if (!error) {
            setOrder({
                ...order,
                payment_status: 'refunded',
                refund_amount: parseFloat(refundAmount),
                refund_reason: refundReason,
                status: 'cancelled'
            });
            setShowRefundModal(false);
            alert('Refund recorded successfully');
        } else {
            alert('Failed to record refund: ' + error);
        }
        setUpdating(false);
    }

    async function handleMarkAsPaid() {
        if (!confirm('Are you sure you want to mark this order as PAID?')) return;

        setUpdating(true);
        const { error } = await updateDocument('orders', params.id, {
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            payment_id: 'COD_RECEIVED_' + new Date().getTime() // internal tracking
        });

        if (!error) {
            setOrder({
                ...order,
                payment_status: 'paid',
                paid_at: new Date().toISOString(),
            });
            alert('Payment marked as RECEIVED successfully');
        } else {
            alert('Failed to update payment status: ' + error);
        }
        setUpdating(false);
    }

    async function handleManualShipment() {
        if (!shipmentData.courierName || !shipmentData.trackingNumber) {
            alert('Please enter Courier Name and Tracking Number');
            return;
        }

        setUpdating(true);
        try {
            const shipmentPayload = {
                provider: 'Manual',
                courier_name: shipmentData.courierName,
                awb_code: shipmentData.trackingNumber,
                tracking_url: shipmentData.trackingUrl || '',
                shipment_id: `MANUAL-${Date.now()}`,
                shipped_at: new Date().toISOString()
            };

            // Update Firestore directly from client (bypassing server-side Admin SDK issues on localhost)
            const { error } = await updateDocument('orders', params.id, {
                status: 'shipped',
                logistics: shipmentPayload
            });

            if (error) throw new Error(error);

            alert(`Shipment created successfully! AWB: ${shipmentData.trackingNumber}`);
            setShowShipModal(false);
            setOrder(prev => ({ ...prev, status: 'shipped', logistics: shipmentPayload }));

            // Trigger notification (best effort)
            try {
                const token = await getIdToken();
                await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ orderId: params.id, type: 'order_shipped' }),
                });
            } catch (e) {
                console.warn('Notification failed', e);
            }
        } catch (error) {
            console.error('Shipment error:', error);
            alert('Failed to create shipment: ' + error.message);
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-neutral-600">Loading order...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-500 mb-4">Order not found</p>
                <Button onClick={() => router.push('/admin/orders')}>Back to Orders</Button>
            </div>
        );
    }

    const statusFlow = ['pending', 'packed', 'shipped', 'delivered'];
    const currentIndex = statusFlow.indexOf(order.status);

    return (
        <div className="max-w-5xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/admin/orders')}>
                        ←
                    </Button>
                    Order #{order.id.slice(0, 8).toUpperCase()}
                </h1>
                <div className="flex gap-2">
                    <Button variant="outline" href={`/admin/orders/${order.id}/invoice`} target="_blank">
                        <Printer className="w-4 h-4 mr-2" />
                        Invoice
                    </Button>
                    <Button variant="outline" href={`/admin/orders/${order.id}/label`} target="_blank">
                        <Printer className="w-4 h-4 mr-2" />
                        Shipping Label
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Logistics Card */}
                    {order.logistics && (
                        <div className="bg-white rounded-lg shadow-card p-6 border-l-4 border-blue-500">
                            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <TruckIcon className="w-5 h-5 text-blue-600" />
                                Shipment Details
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-neutral-500">Provider</p>
                                    <p className="font-medium">{order.logistics.provider}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Courier</p>
                                    <p className="font-medium">{order.logistics.courier_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Tracking Number</p>
                                    <p className="font-mono font-medium">{order.logistics.awb_code}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Shipped At</p>
                                    <p className="font-medium">{formatDateTime(order.logistics.shipped_at)}</p>
                                </div>
                            </div>
                            {order.logistics.tracking_url && (
                                <div className="mt-4">
                                    <a
                                        href={order.logistics.tracking_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        Track Shipment →
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-white rounded-lg shadow-card p-6">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-neutral-500" />
                            Order Items
                        </h2>
                        <div className="space-y-4">
                            {order.items?.map((item, index) => (
                                <div key={index} className="flex gap-4 border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                                    <div className="relative w-16 h-16 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                                        {item.image && (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium text-neutral-900">{item.name}</h3>
                                                {item.variant && (
                                                    <p className="text-sm text-neutral-500">
                                                        Variant: {Object.values(item.variant).join(', ')}
                                                    </p>
                                                )}
                                                <p className="text-sm text-neutral-500 mt-1">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-neutral-100 space-y-2">
                            <div className="flex justify-between text-neutral-600">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.subtotal)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount</span>
                                    <span>-{formatPrice(order.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-neutral-100">
                                <span>Total</span>
                                <span>{formatPrice(order.subtotal - (order.discount || 0))}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <div className="bg-white rounded-lg shadow-card p-6">
                            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-neutral-500" />
                                Customer Details
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-neutral-500">Name</p>
                                    <p className="font-medium">{order.customer_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Email</p>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-neutral-400" />
                                        <a href={`mailto:${order.email}`} className="text-primary-600 hover:underline">
                                            {order.email}
                                        </a>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500">Phone</p>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-neutral-400" />
                                        <a href={`tel:${order.phone}`} className="text-primary-600 hover:underline">
                                            {order.phone}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white rounded-lg shadow-card p-6">
                            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-neutral-500" />
                                Delivery Address
                            </h2>
                            <div className="text-neutral-700">
                                <p className="mb-1">{order.shipping_address?.address}</p>
                                <p className="mb-1">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                                <p className="font-medium">PIN: {order.shipping_address?.pincode}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Status Card */}
                    <div className="bg-white rounded-lg shadow-card p-6">
                        <h2 className="font-semibold text-lg mb-4">Order Status</h2>

                        <div className="mb-6">
                            {order.payment_status === 'failed' ? (
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    Payment Failed
                                </span>
                            ) : (
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                                    {order.status || 'pending'}
                                </span>
                            )}
                        </div>

                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <>
                                <p className="text-sm text-neutral-600 mb-3">Update status:</p>
                                <div className="space-y-2">
                                    {statusFlow.map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => updateStatus(status)}
                                            disabled={updating || statusFlow.indexOf(status) < currentIndex}
                                            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${order.status === status
                                                ? 'bg-primary-500 text-white'
                                                : statusFlow.indexOf(status) < currentIndex
                                                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                                }`}
                                        >
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => updateStatus('cancelled')}
                                        disabled={updating}
                                        className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                    >
                                        Cancel Order
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-lg shadow-card p-6">
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-neutral-500" />
                            Payment Info
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-neutral-500">Payment Method</p>
                                <p className="font-medium capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500">Payment Status</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                                    {order.payment_status || 'pending'}
                                </span>
                            </div>
                            {order.payment_id && (
                                <div>
                                    <p className="text-sm text-neutral-500">Transaction ID</p>
                                    <p className="font-mono text-xs break-all">{order.payment_id}</p>
                                </div>
                            )}
                        </div>

                        {order.payment_status === 'paid' ? (
                            <div className="mt-4 pt-4 border-t border-neutral-100">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    fullWidth
                                    className="text-red-600 hover:bg-red-50 border-red-200"
                                    onClick={() => setShowRefundModal(true)}
                                >
                                    Refund Order
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-4 pt-4 border-t border-neutral-100">
                                <Button
                                    size="sm"
                                    fullWidth
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={handleMarkAsPaid}
                                    loading={updating}
                                >
                                    Mark as Paid
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Refund Modal */}
            {showRefundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Process Refund</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Refund Amount <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Reason
                                </label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                    rows="3"
                                    placeholder="Reason for refund..."
                                ></textarea>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" fullWidth onClick={() => setShowRefundModal(false)}>
                                    Cancel
                                </Button>
                                <Button fullWidth onClick={handleRefund} disabled={updating}>
                                    {updating ? 'Processing...' : 'Confirm Refund'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Shipping Modal */}
            {showShipModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Mark as Shipped</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Courier Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={shipmentData.courierName}
                                    onChange={(e) => setShipmentData({ ...shipmentData, courierName: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                    placeholder="e.g. BlueDart, DTDC"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Tracking Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={shipmentData.trackingNumber}
                                    onChange={(e) => setShipmentData({ ...shipmentData, trackingNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                    placeholder="AWB / Ref No"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Tracking URL (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={shipmentData.trackingUrl}
                                    onChange={(e) => setShipmentData({ ...shipmentData, trackingUrl: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" fullWidth onClick={() => setShowShipModal(false)}>
                                    Cancel
                                </Button>
                                <Button fullWidth onClick={handleManualShipment} disabled={updating}>
                                    {updating ? 'Saving...' : 'Confirm Shipment'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
