import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';

export const revalidate = 60;

async function getHomepageData() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/homepage/all/`, {
            next: { tags: ['hero', 'products', 'instagram'] },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data || null;
    } catch (e) {
        return null;
    }
}

export default async function HomePage() {
    const homepageData = await getHomepageData();

    const bestSellers = homepageData?.bestsellers ?? [];
    const quickPicks  = homepageData?.quick_picks  ?? [];
    const newArrivals = homepageData?.new_arrivals ?? [];

    const displayProducts = bestSellers.length > 0 ? bestSellers.slice(0, 4) : 
                            quickPicks.length > 0 ? quickPicks.slice(0, 4) :
                            newArrivals.slice(0, 4);

    const fallbackMockProducts = [
        {
            id: 'heritage-1',
            name: 'Heritage Pendant 1',
            base_price: 1250,
            primary_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT-xIERYhb5iAp0dt4bZUcBW-Fc_ymVjrwVq4l8Zvq2Tj6-RJaPnw3DFifzO6iLLAufUOKQerm11GheKoc89D71viHFv7GswceKp3_-28JqeSmc6pptoNe7xrgXl442gA-i4rrIeTeP2fYTm037lkr8Ilnb3ENtAqiyi2iQRyiIUW6dmA3GWdLHxcsc7pg6w_BugZYBlo_lQFzjl4ObgALhTjdbXeFzXeAkGXr7MVTndLeIm-tAgfC9A'
        },
        {
            id: 'heritage-2',
            name: 'Heritage Pendant 2',
            base_price: 1250,
            primary_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPBQyGmUfsGgEWM6PtWeKDWt-dvGgfhLX9bm4UmFKzNDT2ysxCWDxUUwxM9MIYjwb9SKQ5YWNCRJA59fcZvbsrDMTgog6J0V8GcX5T4gbcoptomUf_2yOQY6NGeX2h6A5L-ugk_UdOzd4TYojRK29jJDnrEPJ2YNJZF59j17ow16rwGCg9VsxLPh9ZexLepSGq8Ou-3Cp1h2629Z9TLfl_btHILikU775cQzsTaqx_wZwBysKPElSkuQ'
        },
        {
            id: 'heritage-3',
            name: 'Heritage Cuff',
            base_price: 890,
            primary_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoVEZcWcQQiuZEbz-CpBIAXO0-lxn0kQIFfSmgG1C1f0QSZk45xRfxzVQINj2l5sSL9OeDmVlznf3TOdYgl3dYuufGnr8-V7phRfNWATXT0W2Ut-l3TFAIwaCPjEp89t-wxy0EGOULOsPjkRbdK7v8OVYC5L3f2D_PDX1Gwno_pu2WDjPMouvfXE6BEM3uNtuN08GQDvJuZ_wflOe0m_fDfzhR6CJ-Eo2ZxjWOEiNpxaGjEF1lsn2loQ'
        },
        {
            id: 'heritage-4',
            name: 'Heritage Signet',
            base_price: 650,
            primary_image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCapVNDhymCbrQwEqVP8HLIXtlasN8Kf6ysO50g8fcBpcD3gdV71zKbXrlVxM3_b6s2EvW43t9d8v32hFcTKHMH5dSMMReEQJN2-K5dJ4kotFpOpvDY9RDkdTVG-mbEKlA80jxUpOPiF8ao8j1J047BnLhsjGYgUcwwekZIegS3irtGPkBFmJ_i0kucfJfv227j7JW93uMw-66cY2OsAgaTONvy79LHmX-Ad6jk9A4V4C_YouQOJB3Vcg'
        }
    ];

    const productsToRender = displayProducts.length > 0 ? displayProducts : fallbackMockProducts;

    const featureBadges = [
        { icon: 'water_drop', label: 'Waterproof' },
        { icon: 'shield', label: 'Tarnish Resistant' },
        { icon: 'spa', label: 'Hypoallergenic' },
        { icon: 'local_shipping', label: 'Free Express Shipping' }
    ];

    return (
        <div className="flex flex-col min-h-screen pt-20 bg-surface text-primary">
            {/* Hero Section */}
            <section className="relative h-[870px] w-full bg-surface-container-high overflow-hidden flex items-end">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full"
                    style={{
                        backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuASfUjFWrX_TfJz5E91zkFJQKVUJPnO3BkUPZb8S5STx9Pl0UPWZGHpEsgJ-X9Tdtupor0vaV5RoQG_PwOlb13k5L1tHVtWkCL6iyEoHNNvUEV_Xk-wLeknPCt2h27qDf21G_lUhO3yU-MGWGZ7iq8G7OTOY2tI1HRa9xVmoL04xZb9ZnKfmXU3GIooY8TecVLu8iAXdxOyRVcbDSgNdl8wBIleTZ1IrvKclOZ6H1Xfpj1G2yXBB2lDSQ')"
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low/60 to-transparent"></div>
                <div className="relative z-10 w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto pb-16">
                    <div className="max-w-2xl">
                        <h1 className="font-display text-5xl md:text-6xl text-primary mb-8 tracking-wider">
                            The Art of Refinement
                        </h1>
                        <Link
                            className="inline-block px-8 py-4 border border-primary uppercase tracking-widest text-primary hover:bg-primary hover:text-surface transition-all duration-300 text-xs font-semibold"
                            href="/categories"
                        >
                            SHOP THE COLLECTION
                        </Link>
                    </div>
                </div>
            </section>

            {/* Marquee Ticker */}
            <section className="marquee-container bg-white">
                <div className="marquee-content">
                    <span className="marquee-item">TVISAA</span>
                    <span className="marquee-item">TVISAA</span>
                    <span className="marquee-item">TVISAA</span>
                    <span className="marquee-item">TVISAA</span>
                    <span className="marquee-item">TVISAA</span>
                    <span className="marquee-item">TVISAA</span>
                    <span className="marquee-item">TVISAA</span>
                    <span className="marquee-item">TVISAA</span>
                </div>
            </section>

            {/* Curated Essentials */}
            <section className="py-stack-lg px-margin-mobile md:px-margin-desktop w-full max-w-container-max mx-auto">
                <div className="flex justify-between items-end mb-stack-md">
                    <h2 className="font-display text-3xl text-primary">Curated Essentials</h2>
                    <Link href="/categories" className="text-xs underline tracking-widest uppercase text-on-surface-variant hover:text-primary">
                        View All
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
                    {productsToRender.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>

            {/* Premium Detail Badges Strip */}
            <section className="border-y border-outline-variant bg-white">
                <div className="grid grid-cols-2 md:grid-cols-4 w-full">
                    {featureBadges.map((badge, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col items-center justify-center p-12 border-outline-variant border-r last:border-r-0"
                        >
                            <span className="material-symbols-outlined text-3xl mb-6 text-primary">{badge.icon}</span>
                            <span className="text-[10px] md:text-xs uppercase tracking-widest text-center text-on-surface-variant">
                                {badge.label}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
