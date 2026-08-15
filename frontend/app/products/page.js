import { Suspense } from 'react';
import ProductsClient from '@/components/product/ProductsClient';

export const metadata = {
    title: 'All Collections — Tvisaa',
    description: 'Explore the complete universe of our exquisitely handcrafted jewelry.',
};

export default function ProductsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen pt-24 pb-16 bg-white flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-deep-rose animate-spin" />
            </div>
        }>
            <ProductsClient />
        </Suspense>
    );
}
