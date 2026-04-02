'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getAllDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function AddressesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const initialFormState = {
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        isDefault: false
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (user) {
            loadAddresses();
        } else {
            // Redirect or show loader if handled by protected route wrapper
            // Assuming layout handles auth check or this page is protected
        }
    }, [user]);

    async function loadAddresses() {
        if (!user) return;
        const { data } = await getAllDocuments(`users/${user.uid}/addresses`);
        setAddresses(data || []);
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSubmitting(true);

        try {
            const collectionPath = `users/${user.uid}/addresses`;

            if (editingId) {
                await updateDocument(collectionPath, editingId, formData);
                alert('Address updated successfully');
            } else {
                await createDocument(collectionPath, formData);
                alert('Address added successfully');
            }

            setShowForm(false);
            setEditingId(null);
            setFormData(initialFormState);
            loadAddresses();
        } catch (error) {
            console.error('Error saving address:', error);
            alert('Failed to save address');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this address?')) return;

        try {
            await deleteDocument(`users/${user.uid}/addresses`, id);
            loadAddresses();
        } catch (error) {
            console.error('Error deleting address:', error);
            alert('Failed to delete address');
        }
    }

    function handleEdit(address) {
        setFormData(address);
        setEditingId(address.id);
        setShowForm(true);
    }

    if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="container-custom py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold font-display">My Addresses</h1>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)} size="sm" className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add New
                    </Button>
                )}
            </div>

            {showForm ? (
                <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-card border border-neutral-200">
                    <h2 className="text-lg font-bold mb-4">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Full Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Phone Number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />
                        <Input
                            label="Address (House No, Street, Area)"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="City"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                required
                            />
                            <Input
                                label="State"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                required
                            />
                        </div>
                        <Input
                            label="Pincode"
                            value={formData.pincode}
                            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                            required
                            maxLength={6}
                        />

                        <div className="flex gap-3 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                fullWidth
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                    setFormData(initialFormState);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" fullWidth loading={submitting}>
                                Save Address
                            </Button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {addresses.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-neutral-50 rounded-lg">
                            <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                            <p className="text-neutral-500">No saved addresses found.</p>
                        </div>
                    ) : (
                        addresses.map((addr) => (
                            <div key={addr.id} className="bg-white p-4 rounded-lg shadow-sm border border-neutral-200 hover:border-primary-200 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold">{addr.name}</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(addr)}
                                            className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(addr.id)}
                                            className="p-1.5 hover:bg-red-50 rounded text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-sm text-neutral-600 space-y-1">
                                    <p>{addr.address}</p>
                                    <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                                    <p className="mt-2 text-neutral-800 font-medium">Ph: {addr.phone}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
