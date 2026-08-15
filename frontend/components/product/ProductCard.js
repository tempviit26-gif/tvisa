'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { normalizeImageUrl } from '@/lib/images';

export default function ProductCard({ product }) {
    const price = product.base_price;
    const primaryImage = normalizeImageUrl(product.primary_image || product.image_url || product.cloudinary_url || '');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="group flex flex-col gap-4 cursor-pointer"
        >
            <Link href={`/products/${product.id}`} className="block">
                <div className="aspect-[3/4] bg-surface-container-high overflow-hidden relative mb-3 border border-outline-variant/10">
                    {primaryImage ? (
                        <Image
                            src={primaryImage}
                            alt={product.name || 'Product'}
                            fill
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-container-low text-outline">
                            <FiShoppingBag size={32} />
                        </div>
                    )}

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className="absolute top-3 right-3 p-2 bg-surface/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-surface text-primary"
                        aria-label="Add to wishlist"
                    >
                        <FiHeart size={16} />
                    </button>
                </div>

                <div className="flex justify-between items-center text-primary">
                    <span className="text-xs uppercase tracking-widest truncate font-medium max-w-[70%]">
                        {product.name || 'Heritage Item'}
                    </span>
                    <span className="text-sm font-body">
                        {(product.discounted_price && Number(product.discounted_price) > 0) ? (
                            <span>₹{Number(product.discounted_price).toLocaleString('en-IN')}</span>
                        ) : price ? (
                            <span>₹{Number(price).toLocaleString('en-IN')}</span>
                        ) : (
                            <span>$1,250</span>
                        )}
                    </span>
                </div>
            </Link>
        </motion.div>
    );
}
