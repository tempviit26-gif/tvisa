'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { productsAPI } from '@/lib/api';

// ─── Skeleton card ───────────────────────────────────────────────────────────
function ProductCardSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="relative aspect-square bg-gradient-to-br from-petal via-blush/30 to-petal overflow-hidden mb-4 rounded-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skeleton-shimmer" />
            </div>
            <div className="h-3 bg-blush/40 rounded w-1/3 mb-2" />
            <div className="h-5 bg-blush/60 rounded w-3/4 mb-1" />
            <div className="h-5 bg-blush/40 rounded w-1/2 mb-2" />
            <div className="h-4 bg-blush/50 rounded w-1/4" />
        </div>
    );
}

function SkeletonGrid({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

export default function CategoryPageClient() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const slug = params?.slug;
    const activeSub = searchParams.get('sub') || '';
    const sentinelRef = useRef(null);

    // Pretty-print the category name from the slug
    const categoryName = slug
        ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
        : '';

    // Fetch subcategories (small list, fetched once)
    const { data: subsData } = useQuery({
        queryKey: ['subcategories', slug],
        queryFn: async () => {
            const res = await productsAPI.getCategorySubcategories(slug);
            return res.data?.data || [];
        },
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
    });
    const subs = subsData || [];

    // Infinite query — re-runs when sub filter changes
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isFetching,
    } = useInfiniteQuery({
        queryKey: ['category-products', slug, activeSub],
        queryFn: async ({ pageParam = 1 }) => {
            const fetchSlug = activeSub || slug;
            const fetchFn = activeSub
                ? productsAPI.getSubcategoryProducts
                : productsAPI.getCategoryProducts;
            const res = await fetchFn(fetchSlug, { page: pageParam });
            return res.data?.data; // { count, next, previous, results }
        },
        getNextPageParam: (lastPage) => {
            if (lastPage?.next) {
                const url = new URL(lastPage.next);
                return url.searchParams.get('page');
            }
            return undefined;
        },
        enabled: !!slug,
    });

    // ── Intersection Observer ─────────────────────────────────────────────────
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
            rootMargin: '200px',
            threshold: 0,
        });
        const el = sentinelRef.current;
        if (el) observer.observe(el);
        return () => observer.disconnect();
    }, [handleIntersect]);

    const products = data ? data.pages.flatMap((p) => p?.results || p || []) : [];
    const isFirstLoad = isLoading && products.length === 0;

    const setSubFilter = (subSlug) => {
        const url = subSlug ? `/categories/${slug}?sub=${subSlug}` : `/categories/${slug}`;
        router.push(url, { scroll: false });
    };

    return (
        <>
            <style>{`
                @keyframes shimmer {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .skeleton-shimmer {
                    animation: shimmer 1.6s ease-in-out infinite;
                }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-gold text-sm tracking-[0.3em] uppercase font-jost font-light mb-3">Collection</p>
                    <h1 className="font-cormorant text-4xl sm:text-5xl text-noir">{categoryName}</h1>
                </div>

                {/* Subcategory Filter Pills */}
                {subs.length > 0 && (
                    <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
                        <button
                            onClick={() => setSubFilter('')}
                            className={`px-5 py-2 text-sm font-jost tracking-wide transition-colors ${
                                !activeSub
                                    ? 'bg-deep-rose text-white'
                                    : 'border border-blush text-mid hover:text-noir hover:border-deep-rose/30'
                            }`}
                        >
                            All
                        </button>
                        {subs.map((sub) => (
                            <button
                                key={sub.id}
                                onClick={() => setSubFilter(sub.slug)}
                                className={`px-5 py-2 text-sm font-jost tracking-wide transition-colors ${
                                    activeSub === sub.slug
                                        ? 'bg-deep-rose text-white'
                                        : 'border border-blush text-mid hover:text-noir hover:border-deep-rose/30'
                                }`}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                {isFirstLoad ? (
                    <SkeletonGrid count={12} />
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-mid font-light text-lg">No products found in this collection</p>
                        <Link href="/categories" className="inline-block mt-4 text-deep-rose text-sm hover:underline">
                            Browse all collections
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product, i) => (
                            <ProductCard key={`${product.id}-${i}`} product={product} />
                        ))}

                        {/* Skeleton placeholders while fetching next page */}
                        {isFetchingNextPage &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <ProductCardSkeleton key={`skel-${i}`} />
                            ))}
                    </div>
                )}

                {/* Invisible sentinel */}
                <div ref={sentinelRef} className="h-1 mt-8" aria-hidden="true" />

                {/* End-of-feed */}
                {!hasNextPage && products.length > 0 && !isFetching && (
                    <p className="text-center mt-10 text-xs text-mid/60 font-jost tracking-widest uppercase">
                        You&apos;ve discovered the entire {categoryName} collection
                    </p>
                )}
            </div>
        </>
    );
}
