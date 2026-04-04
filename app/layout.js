import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import WhatsAppButton from '@/components/layout/WhatsAppButton';
import { CartProvider } from '@/lib/context/CartContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata = {
    title: 'YellowStone Jewellery - Premium Artificial Jewellery for Every Occasion',
    description: 'Shop the finest collection of artificial jewellery including earrings, necklaces, bangles, rings, and bridal sets. Trusted by women across India.',
    keywords: 'artificial jewellery, imitation jewellery, fashion jewellery, earrings, necklaces, bangles, rings, bridal jewellery, India',
    authors: [{ name: 'YellowStone Jewellery' }],
    openGraph: {
        title: 'YellowStone Jewellery - Premium Artificial Jewellery',
        description: 'Shop the finest collection of artificial jewellery for every occasion',
        url: 'https://yellowstonejewellery.com',
        siteName: 'YellowStone Jewellery',
        type: 'website',
    },
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'YellowStone',
    },
};

export const viewport = {
    themeColor: '#f59e0b',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
            <head>
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
            </head>
            <body className="font-sans antialiased bg-neutral-50">
                <CartProvider>
                    <div className="flex flex-col min-h-screen">
                        <div className="print:hidden">
                            <Header />
                        </div>
                        <main className="flex-1 pb-16 lg:pb-0 print:pb-0">
                            {children}
                        </main>
                        <div className="print:hidden">
                            <Footer />
                            <BottomNav />
                            <WhatsAppButton />
                        </div>
                    </div>
                </CartProvider>
            </body>
        </html>
    );
}
