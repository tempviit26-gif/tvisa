'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';

const tabs = [
    { label: 'All', value: '' },
    { label: 'Gold', value: 'gold' },
    { label: 'Diamond', value: 'diamond' },
    { label: 'Silver', value: 'silver' },
    { label: 'Bridal', value: 'bridal' },
];

export default function FeaturedProducts() {
    const [activeTab, setActiveTab] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['featured-products', activeTab],
        queryFn: async () => {
            const params = { page_size: 8 };
            if (activeTab) params.search = activeTab;
            const res = await productsAPI.getProducts(params);
            return res.data?.data || res.data;
        },
        staleTime: 60 * 60 * 1000,
    });

    const products = data?.results || [];

    return (
        <section className="py-20 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                    <p className="text-gold text-sm tracking-[0.3em] uppercase font-jost font-light mb-3">
                        Curated for You
                    </p>
                    <h2 className="font-cormorant text-4xl sm:text-5xl text-noir">
                        New Arrivals
                    </h2>
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-5 py-2 text-sm font-jost tracking-wide transition-all duration-300 ${activeTab === tab.value
                                    ? 'bg-deep-rose text-white'
                                    : 'text-mid hover:text-noir border border-blush hover:border-deep-rose/30'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="space-y-3">
                                <div className="skeleton aspect-square" />
                                <div className="skeleton h-4 w-3/4" />
                                <div className="skeleton h-3 w-1/2" />
                                <div className="skeleton h-4 w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-mid font-light">No products found</p>
                    </div>
                )}
            </div>
        </section>
    );
}
