import { Playfair_Display, Inter, Cormorant_Garamond, Jost } from 'next/font/google';
import './globals.css';
import Providers from '@/providers/Providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingWhatsApp from '@/components/layout/FloatingWhatsApp';
import { Toaster } from 'react-hot-toast';

const playfair = Playfair_Display({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-playfair',
    display: 'swap',
});

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600'],
    variable: '--font-inter',
    display: 'swap',
});

const cormorant = Cormorant_Garamond({
    subsets: ['latin'],
    weight: ['300', '400', '500'],
    style: ['normal', 'italic'],
    variable: '--font-cormorant',
    display: 'swap',
});

const jost = Jost({
    subsets: ['latin'],
    weight: ['300', '400', '500'],
    variable: '--font-jost',
    display: 'swap',
});

export const metadata = {
    title: 'Tvisaa - Handcrafted Luxury Jewelry',
    description: 'Discover timeless elegance forged in precious metals. Handcrafted rings, necklaces, bangles, earrings & bracelets. Free shipping on all orders.',
    keywords: 'jewelry, gold, diamond, silver, rings, necklaces, bangles, earrings, bracelets, BIS hallmarked, luxury jewelry',
    openGraph: {
        title: 'Tvisaa - Handcrafted Luxury Jewelry',
        description: 'Discover timeless elegance forged in precious metals with free shipping on all orders.',
        type: 'website',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${playfair.variable} ${inter.variable} ${cormorant.variable} ${jost.variable}`}>
            <head>
                <link rel="icon" href="/images/logo.png" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </head>
            <body className="font-body bg-surface text-primary antialiased">
                <Providers>
                    <Navbar />
                    <main className="min-h-screen">{children}</main>
                    <Footer />
                    <FloatingWhatsApp />
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#150f08',
                                color: '#fdf9f2',
                                fontFamily: 'var(--font-inter), sans-serif',
                            },
                            success: { iconTheme: { primary: '#735b31', secondary: '#150f08' } },
                            error: { iconTheme: { primary: '#ba1a1a', secondary: '#fdf9f2' } },
                        }}
                    />
                </Providers>
            </body>
        </html>
    );
}

