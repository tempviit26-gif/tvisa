import ProductDetailClient from '@/components/product/ProductDetailClient';

// Cache all product pages for 1 hour
export const revalidate = 3600;

// Pre-build product routes at deploy time using UUID primary keys
export async function generateStaticParams() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const res = await fetch(`${apiUrl}/products/`, {
            signal: controller.signal,
        });
        if (!res.ok) return [];
        const data = await res.json();
        const products = Array.isArray(data) ? data : (data?.results || data?.data?.results || data?.data || []);
        return products.map((p) => ({
            id: String(p.id),
        }));
    } catch (e) {
        return [];
    } finally {
        clearTimeout(timeoutId);
    }
}

async function getProduct(slug) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const res = await fetch(`${apiUrl}/products/${slug}/`, {
            next: { tags: ['products'] },
            signal: controller.signal,
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.data || data;
    } catch (e) {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

export default async function ProductDetailPage({ params }) {
    const product = await getProduct(params.id);

    if (!product) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-24 text-center">
                <h1 className="font-cormorant text-3xl text-noir">Product not found</h1>
            </div>
        );
    }

    return <ProductDetailClient product={product} />;
}
