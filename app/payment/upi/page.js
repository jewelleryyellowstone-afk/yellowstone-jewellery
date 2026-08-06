'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/ui/Button';

function UPIPaymentContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const intent = searchParams.get('intent');
    const orderId = searchParams.get('orderId');
    const [status, setStatus] = useState('pending');
    
    useEffect(() => {
        if (!orderId) return;
        
        let interval;
        const checkStatus = async () => {
            try {
                const res = await fetch('/api/payment/shaymavenue/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId })
                });
                const data = await res.json();
                
                if (data.status === 'SUCCESS') {
                    setStatus('success');
                    clearInterval(interval);
                    setTimeout(() => {
                        router.push(`/order-success?orderId=${orderId}`);
                    }, 2000);
                } else if (data.status === 'FAILED') {
                    setStatus('failed');
                    clearInterval(interval);
                }
            } catch (err) {
                console.error('Status check error:', err);
            }
        };

        // Poll every 5 seconds
        checkStatus();
        interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [orderId, router]);

    if (!orderId) {
        return <div className="p-12 text-center">Invalid Order Details</div>;
    }

    const qrParam = searchParams.get('qr');
    const qrUrl = qrParam || (intent ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(intent)}` : null);

    return (
        <div className="container-custom py-12 max-w-md mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-card border border-neutral-200 text-center">
                <h1 className="text-2xl font-bold mb-2">Payment Verification</h1>
                <p className="text-neutral-600 mb-6">
                    {qrUrl ? 'Use any UPI app (GPay, PhonePe, Paytm) to scan this QR code.' : 'Checking your transaction status with Shaymavenue...'}
                </p>
                
                {qrUrl && (
                    <div className="flex justify-center mb-6">
                        <div className="p-4 border-2 border-primary-100 rounded-xl inline-block bg-white shadow-sm">
                            <Image src={qrUrl} alt="UPI QR Code" width={200} height={200} className="mx-auto" unoptimized />
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {intent && (
                        <Button 
                            fullWidth 
                            onClick={() => { window.location.href = intent; }}
                            className="md:hidden"
                        >
                            Open UPI App
                        </Button>
                    )}
                    
                    {status === 'pending' && (
                        <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            Waiting for payment confirmation...
                        </div>
                    )}
                    
                    {status === 'success' && (
                        <div className="text-green-600 font-medium flex flex-col items-center gap-2">
                            <span className="text-2xl">✅</span>
                            Payment Successful! Redirecting...
                        </div>
                    )}
                    
                    {status === 'failed' && (
                        <div className="text-red-600 font-medium flex flex-col items-center gap-2">
                            <span className="text-2xl">❌</span>
                            Payment Failed.
                            <Button variant="outline" size="sm" onClick={() => router.push('/cart')} className="mt-2">
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UPIPaymentPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center">Loading...</div>}>
            <UPIPaymentContent />
        </Suspense>
    );
}
