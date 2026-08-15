'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/queryClient';

const EMOJI_MAP = {
    rings: '💍',
    necklace: '📿',
    necklaces: '📿',
    earrings: '✨',
    earring: '✨',
    bangles: '⭕',
    bangle: '⭕',
    bracelets: '🔗',
    bracelet: '🔗',
    pendants: '💎',
    pendant: '💎',
};

export default function CategoryGrid() {
    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEYS.categories,
        queryFn: async () => {
            const res = await productsAPI.getCategories();
            return res.data?.data || res.data;
        },
        staleTime: 60 * 1000,
    });

    const categories = data?.results || data || [];

    if (isLoading) {
        return (
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-14">
                        <p className="text-gold text-sm tracking-[0.3em] uppercase font-jost font-light mb-3">
                            Explore
                        </p>
                        <h2 className="font-cormorant text-4xl sm:text-5xl text-noir">
                            Our Collections
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="skeleton h-48" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-14">
                    <p className="text-gold text-sm tracking-[0.3em] uppercase font-jost font-light mb-3">
                        Explore
                    </p>
                    <h2 className="font-cormorant text-4xl sm:text-5xl text-noir">
                        Our Collections
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
                    {categories.map((cat, idx) => (
                        <motion.div
                            key={cat.slug}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                        >
                            <Link
                                href={`/categories/${cat.slug}`}
                                className="group block bg-white border border-blush/50 p-6 text-center hover:border-deep-rose/30 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                    {EMOJI_MAP[cat.slug.toLowerCase()] || '💎'}
                                </div>
                                <h3 className="font-cormorant text-xl text-noir mb-1.5">{cat.name}</h3>
                                <p className="text-xs text-mid font-light leading-relaxed mb-4">
                                    {cat.product_count} {cat.product_count === 1 ? 'product' : 'products'}
                                </p>
                                <span className="inline-flex items-center text-xs text-deep-rose font-jost tracking-wider uppercase group-hover:gap-2 transition-all">
                                    Shop <FiArrowRight className="ml-1" size={12} />
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
