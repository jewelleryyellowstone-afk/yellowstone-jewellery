'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function ProfilePage() {
    const router = useRouter();
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const [formData, setFormData] = useState({
        display_name: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    async function loadProfile() {
        // Load data from Supabase wrapper context
        setFormData({
            display_name: userData?.display_name || user.display_name || '',
            email: user.email || '',
            phone: userData?.phone || userData?.phone_number || ''
        });
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setUpdating(true);

        try {
            await supabase.from('users').update({ 
                display_name: formData.display_name,
                phone: formData.phone,
                updated_at: new Date().toISOString()
            }).eq('id', user.id);

            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile: ' + error.message);
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return (
            <div className="container-custom py-12 flex justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
            </div>
        );
    }

    return (
        <div className="container-custom py-8">
            <div className="max-w-xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/account')}>
                        ← Back
                    </Button>
                    <h1 className="text-2xl font-bold font-display">My Profile</h1>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-card border border-neutral-200">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar / Icon Placeholder */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-2">
                                <User className="w-10 h-10" />
                            </div>
                            <p className="text-sm text-neutral-500 text-center">
                                {user.email}
                            </p>
                        </div>

                        <Input
                            label="Full Name"
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            icon={<User className="w-4 h-4 text-neutral-400" />}
                            placeholder="Enter your name"
                        />

                        <Input
                            label="Email Address"
                            value={formData.email}
                            disabled
                            icon={<Mail className="w-4 h-4 text-neutral-400" />}
                            className="bg-neutral-50"
                            helperText="Email cannot be changed"
                        />

                        <Input
                            label="Phone Number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            icon={<Phone className="w-4 h-4 text-neutral-400" />}
                            placeholder="Enter phone number"
                            type="tel"
                        />

                        <Button type="submit" fullWidth loading={updating} size="lg">
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
