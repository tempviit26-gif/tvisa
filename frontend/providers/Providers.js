'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@/lib/queryClient';
import { CartProvider } from './CartProvider';

export default function Providers({ children }) {
    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <CartProvider>
                    {children}
                </CartProvider>
            </QueryClientProvider>
        </SessionProvider>
    );
}
