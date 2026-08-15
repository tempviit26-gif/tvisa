import { Suspense } from 'react';
import CategoryPageClient from '@/components/product/CategoryPageClient';

// Cache all category pages for 1 hour
export const revalidate = 3600;

// Pre-build all category routes at deploy time for instant load
export async function generateStaticParams() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const res = await fetch(`${apiUrl}/categories/`, {
            signal: controller.signal,
        });
        if (!res.ok) return [];
        const data = await res.json();
        const categories = Array.isArray(data) ? data : (data?.results || data?.data?.results || data?.data || []);
        return categories.map((cat) => ({
            slug: cat.slug,
        }));
    } catch (e) {
        return [];
    } finally {
        clearTimeout(timeoutId);
    }
}

export default function CategoryPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen pt-24 pb-16 bg-white flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-deep-rose animate-spin" />
                </div>
            }
        >
            <CategoryPageClient />
        </Suspense>
    );
}
