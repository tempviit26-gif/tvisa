'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroSection() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-noir via-[#2A0F1A] to-deep-rose">
            {/* Decorative elements */}
            <div className="absolute inset-0">
                <div className="absolute top-20 left-10 w-72 h-72 bg-deep-rose/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gold/5 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-gold/5 rounded-full" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-gold text-sm tracking-[0.3em] uppercase font-jost font-light mb-6"
                >
                    Handcrafted Fine Jewelry
                </motion.p>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="font-cormorant italic text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[1.1] mb-8"
                >
                    Where Elegance
                    <br />
                    Meets <span className="text-gold">Eternity</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-petal/60 font-jost font-light text-lg max-w-xl mx-auto mb-10"
                >
                    Discover BIS hallmarked jewelry, meticulously crafted to celebrate
                    life&apos;s most precious moments.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        href="/categories"
                        className="px-10 py-4 bg-gold text-noir text-sm font-jost font-medium tracking-wider uppercase hover:bg-gold/90 transition-all duration-300"
                    >
                        Shop Collections
                    </Link>
                    <Link
                        href="/categories/bridal"
                        className="px-10 py-4 border border-petal/30 text-petal text-sm font-jost font-light tracking-wider uppercase hover:bg-petal/10 transition-all duration-300"
                    >
                        Bridal Collection
                    </Link>
                </motion.div>
            </div>

            {/* Bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-petal to-transparent" />
        </section>
    );
}
