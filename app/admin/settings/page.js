'use client';

import { useState, useEffect } from 'react';
import { Save, Store, CreditCard, Truck, Lock, AlertTriangle, Database, Calculator } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getDocument, setDocument } from '@/lib/supabase/db';
import { uploadImage } from '@/lib/cloudinary/upload';
import { Image as ImageIcon, Trash2 } from 'lucide-react';

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

    const [designData, setDesignData] = useState({
        logo_url: '',
        header_text: 'Welcome to YellowStone Jewellery - Premium Artificial Jewellery',
        footer_text: '© 2024 YellowStone Jewellery. All rights reserved.',
        hero_image_url: '',
        designFiles: { logo: null, hero: null },
        designPreviews: { logo: null, hero: null }
    });

    const [gstData, setGstData] = useState({
        enabled: false,
        gstin: '',
        state_code: '',
        tax_percentage: 3,
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

            // Load Design Settings
            const { data: design } = await getDocument('settings', 'design');
            if (design) {
                setDesignData(prev => ({
                    ...prev,
                    logo_url: design.logo_url || '',
                    header_text: design.header_text || '',
                    footer_text: design.footer_text || '',
                    hero_image_url: design.hero_image_url || '',
                    designPreviews: { logo: design.logo_url || null, hero: design.hero_image_url || null }
                }));
            }

            // Load GST Settings
            const { data: gstInfo } = await getDocument('settings', 'gst');
            if (gstInfo) setGstData(prev => ({ ...prev, ...gstInfo }));

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
            else if (activeTab === 'tax') dataToSave = gstData;
            else if (activeTab === 'design') {
                let logoUrl = designData.logo_url;
                let heroUrl = designData.hero_image_url;

                if (designData.designFiles.logo) {
                    const { url, error } = await uploadImage(designData.designFiles.logo, 'assets');
                    if (error) throw new Error('Logo upload failed: ' + error);
                    logoUrl = url;
                }
                
                if (designData.designFiles.hero) {
                    const { url, error } = await uploadImage(designData.designFiles.hero, 'assets');
                    if (error) throw new Error('Hero jump upload failed: ' + error);
                    heroUrl = url;
                }

                dataToSave = {
                    logo_url: logoUrl,
                    hero_image_url: heroUrl,
                    header_text: designData.header_text,
                    footer_text: designData.footer_text
                };
            }

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
                    type="button"
                    onClick={() => setActiveTab('tax')}
                    className={`flex items-center px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'tax'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    <Calculator className="w-4 h-4 mr-2" />
                    Tax & GST
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('design')}
                    className={`flex items-center px-6 py-3 border-b-2 font-medium transition-colors ${activeTab === 'design'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Appearance
                </button>
                <button
                    type="button"
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

                {/* TAX TAB */}
                {activeTab === 'tax' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white rounded-lg shadow-card p-6 border-l-4 border-l-green-500">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="font-semibold text-lg flex items-center gap-2">
                                        <Calculator className="w-4 h-4 text-neutral-500" />
                                        GST Configuration
                                    </h2>
                                    <p className="text-sm text-neutral-500 mt-1">
                                        Enable automated tax calculations during checkout based on your state and tax bracket.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer mt-1">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={gstData.enabled}
                                        onChange={(e) => setGstData({ ...gstData, enabled: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            {gstData.enabled && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <Input
                                            label="Business GSTIN Number"
                                            value={gstData.gstin}
                                            onChange={(e) => setGstData({ ...gstData, gstin: e.target.value })}
                                            placeholder="22AAAAA0000A1Z5"
                                            required={gstData.enabled}
                                        />
                                        <Input
                                            label="Home State Code"
                                            value={gstData.state_code}
                                            onChange={(e) => setGstData({ ...gstData, state_code: e.target.value })}
                                            placeholder="e.g. 24 for Gujarat, 27 for Maharashtra"
                                            required={gstData.enabled}
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4 mt-2">
                                        <Input
                                            label="Tax Rate Percentage (%)"
                                            type="number"
                                            step="0.1"
                                            value={gstData.tax_percentage}
                                            onChange={(e) => setGstData({ ...gstData, tax_percentage: parseFloat(e.target.value) || 0 })}
                                            placeholder="3"
                                            helperText="Standard rate for jewellery is usually 3%"
                                            required={gstData.enabled}
                                        />
                                    </div>
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                                        <strong>Note:</strong> When enabled, this percentage will be automatically applied to the cart subtotal at checkout. Tax amounts will also be cleanly divided into CGST/SGST (same state) or IGST (inter-state) on printable invoices automatically.
                                    </div>
                                </div>
                            )}
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

                {/* DESIGN TAB */}
                {activeTab === 'design' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-white rounded-lg shadow-card p-6 space-y-4">
                            <h2 className="font-semibold text-lg mb-4">Website Appearance</h2>
                            
                            <Input
                                label="Top Announcement Header"
                                value={designData.header_text}
                                onChange={(e) => setDesignData(prev => ({ ...prev, header_text: e.target.value }))}
                                placeholder="Free Shipping on all orders above ₹999!"
                                helperText="This displays at the very top of all pages."
                            />

                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Store Logo URL/Upload</label>
                                    <div className="border-2 border-dashed border-neutral-300 p-4 rounded-lg hover:bg-neutral-50 text-center relative max-w-sm">
                                        {designData.designPreviews.logo ? (
                                            <div className="relative aspect-auto h-20 mb-2 flex items-center justify-center">
                                                <img src={designData.designPreviews.logo} alt="Logo" className="max-h-full object-contain" />
                                                <button type="button" onClick={() => setDesignData(prev => ({...prev, designPreviews: {...prev.designPreviews, logo: null}, designFiles: {...prev.designFiles, logo: null}, logo_url: ''}))} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer">
                                                <span className="text-sm text-neutral-500">Upload New Logo</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                    const f = e.target.files[0];
                                                    if(f) {
                                                        const reader = new FileReader();
                                                        reader.onload = ev => setDesignData(prev => ({...prev, designFiles: {...prev.designFiles, logo: f}, designPreviews: {...prev.designPreviews, logo: ev.target.result}}));
                                                        reader.readAsDataURL(f);
                                                    }
                                                }} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-2">Desktop Hero Image</label>
                                    <div className="border-2 border-dashed border-neutral-300 p-4 rounded-lg hover:bg-neutral-50 text-center relative max-w-sm">
                                        {designData.designPreviews.hero ? (
                                            <div className="relative aspect-video mb-2 flex items-center justify-center overflow-hidden rounded-md">
                                                <img src={designData.designPreviews.hero} alt="Hero" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setDesignData(prev => ({...prev, designPreviews: {...prev.designPreviews, hero: null}, designFiles: {...prev.designFiles, hero: null}, hero_image_url: ''}))} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer">
                                                <span className="text-sm text-neutral-500">Upload Hero Banner</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                    const f = e.target.files[0];
                                                    if(f) {
                                                        const reader = new FileReader();
                                                        reader.onload = ev => setDesignData(prev => ({...prev, designFiles: {...prev.designFiles, hero: f}, designPreviews: {...prev.designPreviews, hero: ev.target.result}}));
                                                        reader.readAsDataURL(f);
                                                    }
                                                }} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Footer Text
                                </label>
                                <textarea
                                    value={designData.footer_text}
                                    onChange={(e) => setDesignData(prev => ({ ...prev, footer_text: e.target.value }))}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
