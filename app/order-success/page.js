'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');

    useEffect(() => {
        if (!orderId) {
            router.push('/');
        }
    }, [orderId, router]);

    return (
        <div className="container-custom py-12">
            <div className="max-w-md mx-auto text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                <h1 className="text-3xl font-display font-bold mb-2">Order Placed Successfully!</h1>
                <p className="text-neutral-600 mb-6">
                    Thank you for your purchase. We've sent a confirmation email with your order details.
                </p>

                <div className="bg-neutral-50 rounded-lg p-6 mb-6">
                    <p className="text-sm text-neutral-600 mb-1">Order ID</p>
                    <p className="font-mono font-bold text-lg">{orderId}</p>
                </div>

                <div className="space-y-3">
                    <Button size="lg" fullWidth asChild>
                        <Link href={`/account/orders`}>Track Order</Link>
                    </Button>
                    <Button size="lg" fullWidth variant="outline" asChild>
                        <Link href="/products">Continue Shopping</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="container-custom py-12 text-center">Loading...</div>}>
            <OrderSuccessContent />
        </Suspense>
    );
}
