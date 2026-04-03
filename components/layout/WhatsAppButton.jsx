'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { createWhatsAppLink } from '@/lib/utils/format';
import { getDocument } from '@/lib/supabase/db';

/**
 * Floating WhatsApp Support Button
 */
export default function WhatsAppButton() {
    const [phoneNumber, setPhoneNumber] = useState(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210');

    useEffect(() => {
        async function loadSettings() {
            try {
                // Try to get dynamic setting
                const { data } = await getDocument('settings', 'store');
                if (data?.whatsapp_number) {
                    setPhoneNumber(data.whatsapp_number);
                }
            } catch (error) {
                // Silent fail to default
                console.error('Error loading WA settings', error);
            }
        }
        loadSettings();
    }, []);

    const defaultMessage = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE || 'Hi! I need help with';

    const handleClick = () => {
        const whatsappUrl = createWhatsAppLink(phoneNumber, defaultMessage);
        window.open(whatsappUrl, '_blank');
    };

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95"
            aria-label="Contact us on WhatsApp"
        >
            <MessageCircle className="w-6 h-6" />
        </button>
    );
}
