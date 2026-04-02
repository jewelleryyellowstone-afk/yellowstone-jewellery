'use client';

import { useState } from 'react';
import { Database, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function SeedDataButton() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSeed = async () => {
        if (!confirm('This will add 6 categories and 30 demo products to your database. Continue?')) {
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/seed', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    type: 'success',
                    message: data.message,
                    details: data.results,
                });

                // Reload page after 2 seconds to show new data
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                setResult({
                    type: 'error',
                    message: data.message || data.error,
                });
            }
        } catch (error) {
            setResult({
                type: 'error',
                message: 'Failed to seed database: ' + error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-50 rounded-lg">
                    <Database className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Seed Demo Data</h3>
                    <p className="text-neutral-600 text-sm mb-4">
                        Quickly populate your database with 6 categories and 30 demo products (5 per category) with images.
                        Perfect for testing and demo purposes.
                    </p>

                    <div className="bg-neutral-50 rounded-lg p-4 mb-4 text-sm">
                        <p className="font-medium mb-2">This will add:</p>
                        <ul className="list-disc list-inside space-y-1 text-neutral-700">
                            <li><strong>6 Categories:</strong> Earrings, Necklaces, Bangles, Rings, Bridal, Festive</li>
                            <li><strong>30 Products:</strong> 5 products in each category</li>
                            <li><strong>Product Images:</strong> All products include high-quality images</li>
                            <li><strong>Realistic Data:</strong> Prices, descriptions, stock quantities</li>
                        </ul>
                    </div>

                    {result && (
                        <div
                            className={`rounded-lg p-4 mb-4 flex items-start gap-3 ${result.type === 'success'
                                    ? 'bg-green-50 text-green-800'
                                    : 'bg-red-50 text-red-800'
                                }`}
                        >
                            {result.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                                <p className="font-medium">{result.message}</p>
                                {result.details && (
                                    <p className="text-sm mt-1">
                                        Categories: {result.details.categories.created} created
                                        | Products: {result.details.products.created} created
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button onClick={handleSeed} loading={loading} disabled={result?.type === 'success'}>
                            <Database className="w-4 h-4 mr-2" />
                            Seed Database
                        </Button>
                    </div>

                    <p className="text-xs text-neutral-500 mt-3">
                        <strong>Note:</strong> This button will be disabled if data already exists.
                        You can still manually add more products after seeding.
                    </p>
                </div>
            </div>
        </div>
    );
}
