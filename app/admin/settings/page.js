'use client';

import { useState, useEffect } from 'react';
import { Save, Store, CreditCard, Truck, Lock, AlertTriangle, Database } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getDocument, setDocument } from '@/lib/supabase/db';

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('store');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [wiping, setWiping] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // Data States
    const [storeData, setStoreData] = useState({
        store_name: 'YellowStone Jewellery',
        tagline: 'Premium Artificial Jewellery',
        contact_email: '',
        contact_phone: '',
        whatsapp_number: '',
        free_shipping_threshold: 999,
        standard_shipping: 50,
        express_shipping: 150,
        gst_number: '',
        business_address: '',
        facebook_url: '',
        instagram_url: '',
        pinterest_url: '',
        return_policy: '',
        terms_of_service: '',
        privacy_policy: '',
        cod_available: true,
    });

    const [logisticsData, setLogisticsData] = useState({
        provider: 'shiprocket',
        enabled: false,
        email: '',
        password: '',
    });

    useEffect(() => {
        loadAllSettings();
    }, []);

    async function loadAllSettings() {
        setLoading(true);
        try {
            // Load Store Settings
            const { data: store } = await getDocument('settings', 'store');
            if (store) setStoreData(prev => ({ ...prev, ...store }));

            // Load Logistics Settings
            const { data: logistics } = await getDocument('settings', 'logistics');
            if (logistics) setLogisticsData(prev => ({ ...prev, ...logistics }));

        } catch (error) {
            console.error("Error loading settings:", error);
            alert("Failed to load settings. Check console.");
        } finally {
            setLoading(false);
        }
    }



    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            let dataToSave;
            if (activeTab === 'store') dataToSave = storeData;
            else if (activeTab === 'logistics') dataToSave = logisticsData;

            const { error } = await setDocument('settings', activeTab, dataToSave);

            if (error) {
                throw new Error(error);
            }



            alert(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} settings saved!`);
        } catch (error) {
            console.error(error);
            alert(`Failed to save: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleWipeData = async () => {
        const confirmPhrase = window.prompt(
            "DANGER ZONE: This will permanently delete ALL orders, payments, and revenue stats in your database!\n\nType 'WIPE_ALL_DATA' to confirm."
        );
        
        if (confirmPhrase === 'WIPE_ALL_DATA') {
            setWiping(true);
            try {
                const res = await fetch('/api/admin/clear-orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ confirm: confirmPhrase }),
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                alert('Success: ' + data.message);
                window.location.reload(); // Refresh to clear dashboards
            } catch (error) {
                alert('Failed to wipe data: ' + error.message);
            } finally {
                setWiping(false);
            }
        } else if (confirmPhrase !== null) {
            alert("Action cancelled. You didn't type the phrase correctly.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="inline-block animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-neutral-600 mt-1">Manage store configuration, payments, and logistics</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 mb-6">
                <button
                    onClick={() => setActiveTab('store')}
                    className={`flex items-center px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'store'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    <Store className="w-4 h-4 mr-2" />
                    Store
                </button>

                <button
                    onClick={() => setActiveTab('logistics')}
                    className={`flex items-center px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'logistics'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    <Truck className="w-4 h-4 mr-2" />
                    Logistics
                </button>
                <button
                    onClick={() => setActiveTab('advanced')}
                    className={`flex items-center px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'advanced'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-neutral-500 hover:text-red-500'
                        }`}
                >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Advanced
                </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* STORE TAB */}
                {activeTab === 'store' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Store Information */}
                        <div className="bg-white rounded-lg shadow-card p-6 space-y-4">
                            <h2 className="font-semibold text-lg mb-4">Store Information</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input
                                    label="Store Name"
                                    value={storeData.store_name}
                                    onChange={(e) => setStoreData({ ...storeData, store_name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Tagline"
                                    value={storeData.tagline}
                                    onChange={(e) => setStoreData({ ...storeData, tagline: e.target.value })}
                                />
                                <Input
                                    label="Contact Email"
                                    type="email"
                                    value={storeData.contact_email}
                                    onChange={(e) => setStoreData({ ...storeData, contact_email: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Contact Phone"
                                    type="tel"
                                    value={storeData.contact_phone}
                                    onChange={(e) => setStoreData({ ...storeData, contact_phone: e.target.value })}
                                    required
                                />
                            </div>
                            <Input
                                label="WhatsApp Number"
                                value={storeData.whatsapp_number}
                                onChange={(e) => setStoreData({ ...storeData, whatsapp_number: e.target.value })}
                                placeholder="919876543210"
                                helperText="No spaces or +"
                            />
                        </div>

                        {/* Shipping */}
                        <div className="bg-white rounded-lg shadow-card p-6 space-y-4">
                            <h2 className="font-semibold text-lg mb-4">Shipping & Delivery</h2>
                            <div className="grid md:grid-cols-3 gap-4">
                                <Input
                                    label="Free Shipping > (₹)"
                                    type="number"
                                    value={storeData.free_shipping_threshold}
                                    onChange={(e) => setStoreData({ ...storeData, free_shipping_threshold: parseInt(e.target.value) })}
                                />
                                <Input
                                    label="Standard (₹)"
                                    type="number"
                                    value={storeData.standard_shipping}
                                    onChange={(e) => setStoreData({ ...storeData, standard_shipping: parseInt(e.target.value) })}
                                />
                                <Input
                                    label="Express (₹)"
                                    type="number"
                                    value={storeData.express_shipping}
                                    onChange={(e) => setStoreData({ ...storeData, express_shipping: parseInt(e.target.value) })}
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={storeData.cod_available}
                                    onChange={(e) => setStoreData({ ...storeData, cod_available: e.target.checked })}
                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm font-medium text-neutral-700">Enable Cash on Delivery (COD)</span>
                            </label>
                        </div>

                        {/* Policies */}
                        <div className="bg-white rounded-lg shadow-card p-6 space-y-4">
                            <h2 className="font-semibold text-lg mb-4">Policies</h2>
                            <textarea
                                className="w-full p-3 border rounded-md"
                                rows={3}
                                placeholder="Return Policy"
                                value={storeData.return_policy}
                                onChange={(e) => setStoreData({ ...storeData, return_policy: e.target.value })}
                            />
                        </div>
                    </div>
                )}



                {/* LOGISTICS TAB */}
                {activeTab === 'logistics' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white rounded-lg shadow-card p-6 border-l-4 border-l-purple-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="font-semibold text-lg flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-neutral-500" />
                                        Logistics Provider (Shiprocket)
                                    </h2>
                                    <p className="text-sm text-neutral-500 mt-1">
                                        Configure Shiprocket for automated shipping labels and tracking.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={logisticsData.enabled}
                                        onChange={(e) => setLogisticsData({ ...logisticsData, enabled: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900">Enable</span>
                                </label>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    label="Shiprocket Email"
                                    type="email"
                                    value={logisticsData.email}
                                    onChange={(e) => setLogisticsData({ ...logisticsData, email: e.target.value })}
                                    placeholder="your-email@example.com"
                                />
                                <Input
                                    label="Shiprocket Password"
                                    type="password"
                                    value={logisticsData.password}
                                    onChange={(e) => setLogisticsData({ ...logisticsData, password: e.target.value })}
                                    placeholder="••••••••"
                                    helperText="Used to generate API token."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ADVANCED TAB / DANGER ZONE */}
                {activeTab === 'advanced' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white rounded-lg shadow-card p-6 border border-red-200">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                <h2 className="font-semibold text-lg text-red-600">Danger Zone</h2>
                            </div>
                            <p className="text-sm text-neutral-600 mb-6">
                                The actions in this panel are destructive and cannot be undone. Always double check before proceeding.
                            </p>
                            
                            <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                                        <Database className="w-4 h-4" />
                                        Clear Demo Orders & Revenue
                                    </h3>
                                    <p className="text-sm text-neutral-600 mt-1">
                                        Permanently delete all test transactions and reset your dashboard metrics to zero for production launch.
                                    </p>
                                </div>
                                <Button 
                                    type="button" 
                                    onClick={handleWipeData} 
                                    loading={wiping}
                                    style={{ backgroundColor: '#dc2626', color: 'white', border: 'none' }}
                                    className="hover:bg-red-700 shrink-0"
                                >
                                    Wipe Test Data
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Action */}
                <div className="fixed bottom-0 right-0 left-0 lg:left-64 bg-white border-t p-4 flex justify-end z-10">
                    <Button 
                        type="submit" 
                        loading={saving} 
                        size="lg" 
                        className="w-full sm:w-auto"
                        disabled={activeTab === 'advanced'}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                    </Button>
                </div>
                <div className="h-16" /> {/* Spacer for fixed footer */}
            </form>
        </div>
    );
}
