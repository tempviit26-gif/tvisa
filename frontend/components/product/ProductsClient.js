'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { productsAPI } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/queryClient';
import ProductCard from '@/components/product/ProductCard';

// ─── Skeleton card that mirrors the exact look of ProductCard ────────────────
function ProductCardSkeleton() {
    return (
        <div className="group animate-pulse">
            {/* Image placeholder */}
            <div className="relative aspect-square bg-gradient-to-br from-petal via-blush/30 to-petal overflow-hidden mb-4 rounded-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skeleton-shimmer" />
            </div>
            {/* Category tag */}
            <div className="h-3 bg-blush/40 rounded w-1/3 mb-2" />
            {/* Product name */}
            <div className="h-5 bg-blush/60 rounded w-3/4 mb-1" />
            <div className="h-5 bg-blush/40 rounded w-1/2 mb-2" />
            {/* Price */}
            <div className="h-4 bg-blush/50 rounded w-1/4" />
        </div>
    );
}

function SkeletonGrid({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

export default function ProductsClient() {
    const searchParams = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState('');
    const sentinelRef = useRef(null);

    // Read category/search from URL if present
    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) setSelectedCategory(cat);
    }, [searchParams]);

    // Fetch Categories for the top filter bar
    const { data: categoriesData } = useQuery({
        queryKey: QUERY_KEYS.categories,
        queryFn: async () => {
            const res = await productsAPI.getCategories();
            return res.data?.data || res.data;
        },
        staleTime: 60 * 1000,
    });
    const categories = categoriesData?.results || categoriesData || [];

    // Infinite Query for products
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isFetching,
    } = useInfiniteQuery({
        queryKey: ['products', selectedCategory, searchParams.get('search'), searchParams.get('filter')],
        queryFn: async ({ pageParam = 1 }) => {
            let params = { page: pageParam };
            let res;
            
            const filterParam = searchParams.get('filter');

            // 1. If category is selected, it takes precedence
            if (selectedCategory) {
                res = await productsAPI.getCategoryProducts(selectedCategory, params);
            } 
            // 2. If homepage section filter active (View All from sections)
            else if (filterParam === 'bestseller') {
                res = await productsAPI.getBestSellers();
            } else if (filterParam === 'quick_pick') {
                res = await productsAPI.getQuickPicks();
            } else if (filterParam === 'new_arrival') {
                res = await productsAPI.getNewArrivals();
            }
            // 3. Normal product fetch
            else {
                if (searchParams.get('search')) {
                    params.search = searchParams.get('search');
                }
                res = await productsAPI.getProducts(params);
            }

            return res?.data?.data || res?.data || []; 
        },
        getNextPageParam: (lastPage) => {
            if (lastPage?.next) {
                const url = new URL(lastPage.next);
                return url.searchParams.get('page');
            }
            return undefined;
        },
    });

    // ── Intersection Observer — fires on ALL screen sizes now ─────────────────
    const handleIntersect = useCallback(
        (entries) => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage]
    );

    useEffect(() => {
        const observer = new IntersectionObserver(handleIntersect, {
            rootMargin: '200px', // start loading 200px before sentinel enters viewport
            threshold: 0,
        });
        const el = sentinelRef.current;
        if (el) observer.observe(el);
        return () => observer.disconnect();
    }, [handleIntersect]);

    // Flatten pages
    const products = data ? data.pages.flatMap((page) => page?.results || page || []) : [];
    const isFirstLoad = isLoading && products.length === 0;

    return (
        <>
            {/* Shimmer keyframe — injected once per page */}
            <style>{`
                @keyframes shimmer {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .skeleton-shimmer {
                    animation: shimmer 1.6s ease-in-out infinite;
                }
            `}</style>

            <div className="bg-white min-h-screen pt-16 lg:pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="font-cormorant text-4xl lg:text-5xl text-noir mb-4">
                            Discover The Collection
                        </h1>
                        <p className="font-jost text-mid font-light max-w-2xl mx-auto">
                            Explore our full range of exquisitely handcrafted jewelry, designed for everyday elegance and milestone moments.
                        </p>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex overflow-x-auto gap-3 pb-4 mb-10 scrollbar-hide justify-start md:justify-center">
                        <button
                            onClick={() => setSelectedCategory('')}
                            className={`px-6 py-2.5 text-xs font-medium tracking-widest uppercase transition-all whitespace-nowrap rounded-sm border ${
                                selectedCategory === ''
                                    ? 'bg-deep-rose text-white border-deep-rose shadow-md'
                                    : 'bg-transparent text-mid border-blush hover:border-deep-rose hover:text-noir'
                            }`}
                        >
                            All
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.slug)}
                                className={`px-6 py-2.5 text-xs font-medium tracking-widest uppercase transition-all whitespace-nowrap rounded-sm border ${
                                    selectedCategory === cat.slug
                                        ? 'bg-deep-rose text-white border-deep-rose shadow-md'
                                        : 'bg-transparent text-mid border-blush hover:border-deep-rose hover:text-noir'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    {isFirstLoad ? (
                        <SkeletonGrid count={12} />
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 text-mid font-jost font-light text-lg">
                            No products found. Allow us to curate something special soon.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12">
                                {products.map((product, i) => (
                                    <ProductCard key={`${product.id}-${i}`} product={product} />
                                ))}

                                {/* Append skeleton rows while fetching next page */}
                                {isFetchingNextPage &&
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <ProductCardSkeleton key={`skel-${i}`} />
                                    ))}
                            </div>
                        </>
                    )}

                    {/* Invisible sentinel — Intersection Observer watches this */}
                    <div ref={sentinelRef} className="h-1 mt-8" aria-hidden="true" />

                    {/* End-of-feed message */}
                    {!hasNextPage && products.length > 0 && !isFetching && (
                        <p className="text-center mt-10 text-xs text-mid/60 font-jost tracking-widest uppercase">
                            You&apos;ve discovered our entire collection
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
