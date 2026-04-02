'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getAllDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestore';
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
        maxDiscount: 0,
        minOrderValue: 0,
        maxUses: 0,
        maxUsesPerUser: 1,
        expiryDate: '',
        active: true,
    });

    useEffect(() => {
        loadDiscounts();
    }, []);

    async function loadDiscounts() {
        const { data, error } = await getAllDocuments('coupons', {
            orderByField: 'createdAt',
            orderDirection: 'desc',
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
            maxDiscount: parseFloat(formData.maxDiscount) || null,
            minOrderValue: parseFloat(formData.minOrderValue) || 0,
            maxUses: parseInt(formData.maxUses) || null,
            maxUsesPerUser: parseInt(formData.maxUsesPerUser) || 1,
            usedCount: 0,
            usedBy: {},
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
            maxDiscount: discount.maxDiscount || 0,
            minOrderValue: discount.minOrderValue || 0,
            maxUses: discount.maxUses || 0,
            maxUsesPerUser: discount.maxUsesPerUser || 1,
            expiryDate: discount.expiryDate || '',
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
            maxDiscount: 0,
            minOrderValue: 0,
            maxUses: 0,
            maxUsesPerUser: 1,
            expiryDate: '',
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
                                    value={formData.maxDiscount}
                                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                    min="0"
                                    helperText="Optional cap"
                                />
                            )}

                            <Input
                                label="Min Order Value (₹)"
                                type="number"
                                value={formData.minOrderValue}
                                onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                                min="0"
                            />
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                            <Input
                                label="Max Uses (Total)"
                                type="number"
                                value={formData.maxUses}
                                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                min="0"
                                helperText="0 = unlimited"
                            />

                            <Input
                                label="Max Uses Per User"
                                type="number"
                                value={formData.maxUsesPerUser}
                                onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                                min="1"
                            />

                            <Input
                                label="Expiry Date"
                                type="date"
                                value={formData.expiryDate}
                                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
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
                                            {discount.maxDiscount && (
                                                <p className="text-sm text-neutral-600">Max: {formatPrice(discount.maxDiscount)}</p>
                                            )}
                                            {discount.minOrderValue > 0 && (
                                                <p className="text-sm text-neutral-600">Min: {formatPrice(discount.minOrderValue)}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <p>{discount.usedCount || 0} {discount.maxUses ? `/ ${discount.maxUses}` : ''}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {discount.expiryDate || 'No expiry'}
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
