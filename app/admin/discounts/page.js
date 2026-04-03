'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getAllDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/supabase/db';
import { formatPrice } from '@/lib/utils/format';

export default function AdminDiscountsPage() {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        type: 'percentage',
        value: 0,
        max_discount: 0,
        min_order_value: 0,
        max_uses: 0,
        max_uses_per_user: 1,
        expiry_date: '',
        active: true,
    });

    useEffect(() => {
        loadDiscounts();
    }, []);

    async function loadDiscounts() {
        const { data, error } = await getAllDocuments('coupons', {
            orderBy: 'created_at',
            ascending: false,
        });
        if (error) {
            console.error('Failed to load coupons:', error);
        }
        setDiscounts(data || []);
        setLoading(false);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const discountData = {
            ...formData,
            code: formData.code.toUpperCase(),
            value: parseFloat(formData.value),
            max_discount: parseFloat(formData.max_discount) || null,
            min_order_value: parseFloat(formData.min_order_value) || 0,
            max_uses: parseInt(formData.max_uses) || null,
            max_uses_per_user: parseInt(formData.max_uses_per_user) || 1,
            used_count: 0,
            used_by: {},
        };

        try {
            if (editingId) {
                await updateDocument('coupons', editingId, discountData);
            } else {
                await createDocument('coupons', discountData);
            }

            loadDiscounts();
            resetForm();
            alert(editingId ? 'Discount updated!' : 'Discount created!');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleEdit = (discount) => {
        setFormData({
            code: discount.code,
            description: discount.description || '',
            type: discount.type,
            value: discount.value,
            max_discount: discount.max_discount || 0,
            min_order_value: discount.min_order_value || 0,
            max_uses: discount.max_uses || 0,
            max_uses_per_user: discount.max_uses_per_user || 1,
            expiry_date: discount.expiry_date || '',
            active: discount.active !== false,
        });
        setEditingId(discount.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this discount code?')) return;
        await deleteDocument('coupons', id);
        loadDiscounts();
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        alert(`Copied: ${code}`);
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            type: 'percentage',
            value: 0,
            max_discount: 0,
            min_order_value: 0,
            max_uses: 0,
            max_uses_per_user: 1,
            expiry_date: '',
            active: true,
        });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Discount Codes</h1>
                    <p className="text-neutral-600 mt-1">Create and manage promo codes</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? 'Cancel' : 'New Discount'}
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-card p-6 mb-6">
                    <h2 className="font-semibold text-lg mb-4">
                        {editingId ? 'Edit Discount' : 'Create Discount'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Input
                                label="Discount Code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="FIRST10"
                                required
                                helperText="Use uppercase letters and numbers"
                            />

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>
                        </div>

                        <Input
                            label="Description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="First order discount"
                        />

                        <div className="grid sm:grid-cols-3 gap-4">
                            <Input
                                label={formData.type === 'percentage' ? 'Percentage' : 'Amount (₹)'}
                                type="number"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                required
                                min="0"
                                step={formData.type === 'percentage' ? '1' : '0.01'}
                            />

                            {formData.type === 'percentage' && (
                                <Input
                                    label="Max Discount (₹)"
                                    type="number"
                                    value={formData.max_discount}
                                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                                    min="0"
                                    helperText="Optional cap"
                                />
                            )}

                            <Input
                                label="Min Order Value (₹)"
                                type="number"
                                value={formData.min_order_value}
                                onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                                min="0"
                            />
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                            <Input
                                label="Max Uses (Total)"
                                type="number"
                                value={formData.max_uses}
                                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                                min="0"
                                helperText="0 = unlimited"
                            />

                            <Input
                                label="Max Uses Per User"
                                type="number"
                                value={formData.max_uses_per_user}
                                onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                                min="1"
                            />

                            <Input
                                label="Expiry Date"
                                type="date"
                                value={formData.expiry_date}
                                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="active"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                className="w-5 h-5 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <label htmlFor="active" className="text-sm font-medium">Active (Available for use)</label>
                        </div>

                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button type="submit" className="flex-1">
                                {editingId ? 'Update Discount' : 'Create Discount'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Discounts List */}
            <div className="bg-white rounded-lg shadow-card overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : discounts.length === 0 ? (
                    <div className="p-8 text-center text-neutral-500">
                        No discount codes yet. Create your first promo code!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Discount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Usage</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Expiry</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {discounts.map((discount) => (
                                    <tr key={discount.id} className="hover:bg-neutral-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-primary-600">{discount.code}</span>
                                                <button
                                                    onClick={() => copyCode(discount.code)}
                                                    className="p-1 hover:bg-neutral-100 rounded"
                                                >
                                                    <Copy className="w-4 h-4 text-neutral-400" />
                                                </button>
                                            </div>
                                            {discount.description && (
                                                <p className="text-sm text-neutral-600 mt-1">{discount.description}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold">
                                                {discount.type === 'percentage' ? `${discount.value}%` : formatPrice(discount.value)}
                                            </p>
                                            {discount.max_discount && (
                                                <p className="text-sm text-neutral-600">Max: {formatPrice(discount.max_discount)}</p>
                                            )}
                                            {discount.min_order_value > 0 && (
                                                <p className="text-sm text-neutral-600">Min: {formatPrice(discount.min_order_value)}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <p>{discount.used_count || 0} {discount.max_uses ? `/ ${discount.max_uses}` : ''}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {discount.expiry_date || 'No expiry'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {discount.active ? (
                                                <span className="inline-flex items-center gap-1 text-green-600">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-neutral-500">
                                                    <XCircle className="w-4 h-4" />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(discount)}
                                                    className="p-2 hover:bg-primary-50 text-primary-600 rounded"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(discount.id)}
                                                    className="p-2 hover:bg-red-50 text-red-600 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
