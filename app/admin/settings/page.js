'use client';

import { useState, useEffect } from 'react';
import { Save, Store, CreditCard, Truck, Lock, AlertTriangle, Database } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getDocument, setDocument } from '@/lib/firebase/firestore';

export default function AdminSettingsPage() {
    const [activeTab, setActiveTab] = useState('store');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [wiping, setWiping] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // Data States
    const [storeData, setStoreData] = useState({
        storeName: 'YellowStone Jewellery',
        tagline: 'Premium Artificial Jewellery',
        contactEmail: '',
        contactPhone: '',
        whatsappNumber: '',
        freeShippingThreshold: 999,
        standardShipping: 50,
        expressShipping: 150,
        gstNumber: '',
        businessAddress: '',
        facebookUrl: '',
        instagramUrl: '',
        pinterestUrl: '',
        returnPolicy: '',
        termsOfService: '',
        privacyPolicy: '',
        codAvailable: true,
    });

    const [paymentData, setPaymentData] = useState({
        provider: 'phonepe',
        enabled: false,
        environment: 'sandbox',
        clientId: '',
        clientSecret: '',
        clientVersion: '1',
        webhookUsername: '',
        webhookPassword: '',
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

            // Load Payment Settings
            const { data: payment } = await getDocument('settings', 'payment');
            if (payment) setPaymentData(prev => ({ ...prev, ...payment }));

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

    const handleTestCredentials = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/admin/phonepe-validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: paymentData.clientId,
                    clientSecret: paymentData.clientSecret,
                    clientVersion: paymentData.clientVersion || '1',
                    environment: paymentData.environment || 'sandbox',
                }),
            });
            const data = await res.json();
            setTestResult(data);
        } catch (err) {
            setTestResult({ valid: false, error: 'Network error: ' + err.message });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            let dataToSave;
            if (activeTab === 'store') dataToSave = storeData;
            else if (activeTab === 'payment') dataToSave = paymentData;
            else if (activeTab === 'logistics') dataToSave = logisticsData;

            const { error } = await setDocument('settings', activeTab, dataToSave);

            if (error) {
                throw new Error(error);
            }

            if (activeTab === 'payment') {
                // Ping backend to clear its memory cache so next checkout reads fresh data
                await fetch('/api/admin/payment-settings', { method: 'POST' });
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
                    onClick={() => setActiveTab('payment')}
                    className={`flex items-center px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'payment'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payments
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
                                    value={storeData.storeName}
                                    onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
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
                                    value={storeData.contactEmail}
                                    onChange={(e) => setStoreData({ ...storeData, contactEmail: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Contact Phone"
                                    type="tel"
                                    value={storeData.contactPhone}
                                    onChange={(e) => setStoreData({ ...storeData, contactPhone: e.target.value })}
                                    required
                                />
                            </div>
                            <Input
                                label="WhatsApp Number"
                                value={storeData.whatsappNumber}
                                onChange={(e) => setStoreData({ ...storeData, whatsappNumber: e.target.value })}
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
                                    value={storeData.freeShippingThreshold}
                                    onChange={(e) => setStoreData({ ...storeData, freeShippingThreshold: parseInt(e.target.value) })}
                                />
                                <Input
                                    label="Standard (₹)"
                                    type="number"
                                    value={storeData.standardShipping}
                                    onChange={(e) => setStoreData({ ...storeData, standardShipping: parseInt(e.target.value) })}
                                />
                                <Input
                                    label="Express (₹)"
                                    type="number"
                                    value={storeData.expressShipping}
                                    onChange={(e) => setStoreData({ ...storeData, expressShipping: parseInt(e.target.value) })}
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={storeData.codAvailable}
                                    onChange={(e) => setStoreData({ ...storeData, codAvailable: e.target.checked })}
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
                                value={storeData.returnPolicy}
                                onChange={(e) => setStoreData({ ...storeData, returnPolicy: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* PAYMENT TAB */}
                {activeTab === 'payment' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white rounded-lg shadow-card p-6 border-l-4 border-l-blue-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="font-semibold text-lg flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-neutral-500" />
                                        Payment Gateway (PhonePe)
                                    </h2>
                                    <p className="text-sm text-neutral-500 mt-1">
                                        Securely configure your PhonePe API keys for payment processing and webhooks.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={paymentData.enabled}
                                        onChange={(e) => setPaymentData({ ...paymentData, enabled: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900">Enable</span>
                                </label>
                            </div>

                            <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Environment</label>
                                        <select
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900"
                                            value={paymentData.environment || 'sandbox'}
                                            onChange={(e) => setPaymentData({ ...paymentData, environment: e.target.value })}
                                        >
                                            <option value="sandbox">Sandbox (Testing)</option>
                                            <option value="production">Production (LIVE)</option>
                                        </select>
                                    </div>
                                    <Input
                                        label="Client ID *"
                                        value={paymentData.clientId || ''}
                                        onChange={(e) => setPaymentData({ ...paymentData, clientId: e.target.value })}
                                        placeholder="M23EK5H28QPN6_2603261738"
                                        required
                                    />
                                </div>
                                <div className="grid md:grid-cols-4 gap-4">
                                    <div className="md:col-span-3">
                                        <Input
                                            label="Client Secret *"
                                            type="password"
                                            value={paymentData.clientSecret || ''}
                                            onChange={(e) => setPaymentData({ ...paymentData, clientSecret: e.target.value })}
                                            placeholder="••••••••••••••••"
                                            helperText="From PhonePe Developer Settings"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Input
                                            label="Client Version *"
                                            value={paymentData.clientVersion || '1'}
                                            onChange={(e) => setPaymentData({ ...paymentData, clientVersion: e.target.value })}
                                            placeholder="1"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* TEST CREDENTIALS BUTTON */}
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">🔬 Test Connection</p>
                                            <p className="text-xs text-gray-500">Verify your Client ID + Client Secret before saving.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleTestCredentials}
                                            disabled={testing || !paymentData.clientId || !paymentData.clientSecret}
                                            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {testing ? 'Testing...' : 'Test Connection'}
                                        </button>
                                    </div>
                                    {testResult && (
                                        <div className={`mt-2 p-3 rounded-md text-sm ${testResult.valid ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                                            <p className="font-medium">{testResult.valid ? testResult.message : testResult.error}</p>
                                            {testResult.details && <p className="mt-1 text-xs opacity-80">{testResult.details}</p>}
                                            {testResult.suggestion && <p className="mt-1 text-xs font-semibold">💡 Fix: {testResult.suggestion}</p>}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-sm font-semibold text-neutral-800 mt-4 border-t pt-4">S2S Webhook Configuration</h3>
                                <p className="text-xs text-neutral-500 mb-2">Set these to secure your webhook endpoint with Basic Auth in the PhonePe Dashboard.</p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Input
                                        label="Webhook Username"
                                        value={paymentData.webhookUsername || ''}
                                        onChange={(e) => setPaymentData({ ...paymentData, webhookUsername: e.target.value })}
                                        placeholder="Enter a username"
                                    />
                                    <Input
                                        label="Webhook Password"
                                        type="password"
                                        value={paymentData.webhookPassword || ''}
                                        onChange={(e) => setPaymentData({ ...paymentData, webhookPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
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
