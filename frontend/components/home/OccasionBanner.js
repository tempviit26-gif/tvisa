'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const occasions = [
    {
        title: 'Bridal Collection',
        subtitle: 'For your most magical day',
        href: '/categories/bridal',
        gradient: 'from-deep-rose to-[#5A0F35]',
        icon: '👰',
    },
    {
        title: 'Anniversary Gifts',
        subtitle: 'Celebrate your love story',
        href: '/categories/anniversary',
        gradient: 'from-[#2A0F1A] to-noir',
        icon: '💝',
    },
    {
        title: 'Everyday Elegance',
        subtitle: 'Timeless everyday pieces',
        href: '/categories/everyday',
        gradient: 'from-[#3A1A2A] to-[#1A0A10]',
        icon: '✨',
    },
];

export default function OccasionBanner() {
    return (
        <section className="py-10 md:py-20 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-14">
                    <p className="text-gold text-sm tracking-[0.3em] uppercase font-jost font-light mb-3">
                        For Every Occasion
                    </p>
                    <h2 className="font-cormorant text-4xl sm:text-5xl text-noir">
                        Shop by Occasion
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {occasions.map((item, idx) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.15 }}
                        >
                            <Link
                                href={item.href}
                                className={`group block bg-gradient-to-br ${item.gradient} py-6 px-4 md:p-12 text-center hover:shadow-2xl transition-all duration-500 relative overflow-hidden`}
                            >
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500" />
                                <div className="relative z-10">
                                    <div className="text-5xl mb-5 group-hover:scale-110 transition-transform duration-500">
                                        {item.icon}
                                    </div>
                                    <h3 className="font-cormorant text-2xl md:text-3xl text-white mb-2 italic">
                                        {item.title}
                                    </h3>
                                    <p className="text-petal/50 font-jost font-light text-sm">
                                        {item.subtitle}
                                    </p>
                                    <div className="mt-6 inline-block text-gold text-xs tracking-[0.2em] uppercase font-jost border-b border-gold/30 pb-0.5 group-hover:border-gold transition-colors">
                                        Explore
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
