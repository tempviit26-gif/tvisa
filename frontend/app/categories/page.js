import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';

export const revalidate = 3600;

async function getProducts() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const res = await fetch(`${apiUrl}/products/`, {
            next: { tags: ['products'] },
            signal: controller.signal,
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data?.results || data?.data?.results || data?.data || []);
    } catch (e) {
        return [];
    } finally {
        clearTimeout(timeoutId);
    }
}

export default async function CollectionsPage() {
    const fetchedProducts = await getProducts();

    const fallbackProducts = [
        {
            id: 'aura',
            name: 'Aura Pendant',
            base_price: 1250,
            primary_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPBQyGmUfsGgEWM6PtWeKDWt-dvGgfhLX9bm4UmFKzNDT2ysxCWDxUUwxM9MIYjwb9SKQ5YWNCRJA59fcZvbsrDMTgog6J0V8GcX5T4gbcoptomUf_2yOQY6NGeX2h6A5L-ugk_UdOzd4TYojRK29jJDnrEPJ2YNJZF59j17ow16rwGCg9VsxLPh9ZexLepSGq8Ou-3Cp1h2629Z9TLfl_btHILikU775cQzsTaqx_wZwBysKPElSkuQ'
        },
        {
            id: 'structural',
            name: 'Structural Cuff',
            base_price: 890,
            primary_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoVEZcWcQQiuZEbz-CpBIAXO0-lxn0kQIFfSmgG1C1f0QSZk45xRfxzVQINj2l5sSL9OeDmVlznf3TOdYgl3dYuufGnr8-V7phRfNWATXT0W2Ut-l3TFAIwaCPjEp89t-wxy0EGOULOsPjkRbdK7v8OVYC5L3f2D_PDX1Gwno_pu2WDjPMouvfXE6BEM3uNtuN08GQDvJuZ_wflOe0m_fDfzhR6CJ-Eo2ZxjWOEiNpxaGjEF1lsn2loQ'
        },
        {
            id: 'blank',
            name: 'Blank Signet',
            base_price: 650,
            primary_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCapVNDhymCbrQwEqVP8HLIXtlasN8Kf6ysO50g8fcBpcD3gdV71zKbXrlVxM3_b6s2EvW43t9d8v32hFcTKHMH5dSMMReEQJN2-K5dJ4kotFpOpvDY9RDkdTVG-mbEKlA80jxUpOPiF8ao8j1J047BnLhsjGYgUcwwekZIegS3irtGPkBFmJ_i0kucfJfv227j7JW93uMw-66cY2OsAgaTONvy79LHmX-Ad6jk9A4V4C_YouQOJB3Vcg'
        }
    ];

    const products = fetchedProducts.length > 0 ? fetchedProducts : fallbackProducts;

    return (
        <div className="flex flex-col min-h-screen pt-20 bg-surface text-primary">
            <main className="flex-grow pt-10 pb-stack-lg px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
                {/* Header */}
                <div className="text-center mb-stack-lg">
                    <h1 className="font-display text-4xl md:text-5xl mb-stack-sm tracking-tight text-primary">
                        The Heritage Collection
                    </h1>
                    <p className="text-on-surface-variant max-w-2xl mx-auto text-sm md:text-base font-light">
                        Discover timeless elegance forged in precious metals. A curation designed to transcend seasons.
                    </p>
                </div>

                {/* Filter bar */}
                <div className="flex justify-between items-center border-y border-outline/20 py-4 mb-stack-lg">
                    <div className="flex gap-4 items-center">
                        <span className="text-[10px] uppercase tracking-widest text-outline font-semibold">Filter:</span>
                        <button className="text-xs uppercase tracking-wider flex items-center gap-1 text-on-surface-variant hover:text-primary">
                            Category <span className="material-symbols-outlined text-[14px]">expand_more</span>
                        </button>
                    </div>
                    <button className="text-xs uppercase tracking-wider flex items-center gap-1 text-on-surface-variant hover:text-primary">
                        Featured <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    </button>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-gutter gap-y-stack-lg">
                    {products.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </main>
        </div>
    );
}
