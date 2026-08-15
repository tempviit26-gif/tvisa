'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getImageUrl } from '@/lib/images';

const testimonials = [
    {
        id: 1,
        headline: 'LOVE IT!',
        review: 'The fit is amazing, and the quality is even better than I expected. I get compliments every time I wear it! It\'s flattering, comfortable, and versatile — definitely one of my favorite wardrobe pieces now.',
        name: 'Emily Carter',
        title: 'Stylist',
    },
    {
        id: 2,
        headline: 'HIGHLY RECOMMEND!',
        review: 'The whole experience felt premium — from the packaging to the final look. Stylish, comfortable, and timeless. It felt like luxury without the fuss, and I love how effortlessly it fits into my daily outfits.',
        name: 'Alina Kera',
        title: 'Stylist',
    },
    {
        id: 3,
        headline: 'Different text',
        review: 'The whole experience felt premium — from the packaging to the final look. Stylish, comfortable, and timeless. It felt like luxury without the fuss, and I love how effortlessly it fits into my daily outfits.',
        name: 'Alina Kera',
        title: 'Stylist',
    },
];

const trustFeatures = [
    {
        title: 'Fast Shipping',
        desc: 'Delivered quickly to your doorstep',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
        ),
    },
    {
        title: 'Easy Returns',
        desc: 'Simple, hassle-free return process',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
        ),
    },
    {
        title: 'Money Back Guarantee',
        desc: 'Your purchase fully protected',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        ),
    },
];

export default function HappyCustomersClient({ posts }) {
    const [testimonialIndex, setTestimonialIndex] = useState(0);
    const hasPosts = posts && posts.length > 0;

    let displayPosts = [];
    if (hasPosts) {
        displayPosts = [...posts];
        while (displayPosts.length < 10) {
            displayPosts = [...displayPosts, ...posts];
        }
        displayPosts = displayPosts.slice(0, 10);
    }

    const nextTestimonial = () => {
        setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    return (
        <>
            {/* ── Testimonials ────────────────────────────── */}
            <section className="bg-[#3D2F24] border-t border-[#4A3C30]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-xl sm:text-2xl text-[#E8DED0] font-jost font-light tracking-wide">
                            Loved By <span className="font-semibold uppercase tracking-wider">CUSTOMERS</span>
                        </h2>
                        {/* Navigation arrows */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={prevTestimonial}
                                className="w-8 h-8 border border-[#5A4C40] flex items-center justify-center text-[#A89880] hover:bg-[#D6C5B0] hover:text-[#1E1008] hover:border-[#D6C5B0] transition-all duration-200"
                                aria-label="Previous testimonial"
                            >
                                <FiChevronLeft size={16} />
                            </button>
                            <button
                                onClick={nextTestimonial}
                                className="w-8 h-8 border border-[#5A4C40] flex items-center justify-center text-[#A89880] hover:bg-[#D6C5B0] hover:text-[#1E1008] hover:border-[#D6C5B0] transition-all duration-200"
                                aria-label="Next testimonial"
                            >
                                <FiChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Content row: portrait + 2 testimonials */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_1fr] gap-8 lg:gap-12 items-stretch overflow-hidden">
                        {/* Portrait image */}
                        <div className="relative hidden lg:block rounded-sm overflow-hidden bg-[#2C1A0E] min-h-[360px] w-full">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg viewBox="0 0 120 180" className="w-24 h-36 text-[#5A4C40]" fill="currentColor">
                                    <ellipse cx="60" cy="55" rx="32" ry="35" />
                                    <path d="M10 160 Q10 110 60 110 Q110 110 110 160 Z" />
                                </svg>
                            </div>
                        </div>

                        {/* Left testimonial */}
                        <div className="animate-fade-in" key={`test1-${testimonialIndex}`}>
                            <TestimonialCard testimonial={testimonials[testimonialIndex]} />
                        </div>

                        {/* Right testimonial */}
                        <div className="animate-fade-in" key={`test2-${testimonialIndex}`}>
                            <TestimonialCard testimonial={testimonials[(testimonialIndex + 1) % testimonials.length]} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Instagram / Product Grid ─────────────────── */}
            {hasPosts && (
                <section className="bg-[#FAF7F2]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                        <div className="text-center mb-10">
                            <h2 className="font-jost text-3xl md:text-4xl text-[#1E1008] font-medium tracking-wide mb-1">
                                Follow us on Instagram
                            </h2>
                            <p className="font-jost text-sm text-[#8A7A63]">@tvisaa_foryou</p>
                        </div>

                        {/* Horizontal scroll grid */}
                        <div className="relative overflow-hidden w-full">
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                @keyframes insta-scroll {
                                    0% { transform: translateX(0%); }
                                    100% { transform: translateX(-50%); }
                                }
                                .animate-insta-scroll {
                                    animation: insta-scroll 60s linear infinite;
                                    width: max-content;
                                }
                                .animate-insta-scroll:hover {
                                    animation-play-state: paused;
                                }
                            `}} />
                            <div className="flex gap-4 animate-insta-scroll">
                                {[...displayPosts, ...displayPosts].map((post, i) => (
                                    <div
                                        key={`${post.id}-${i}`}
                                        className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] flex-shrink-0 overflow-hidden group cursor-pointer"
                                    >
                                        <Image
                                            src={getImageUrl(post)}
                                            alt="Tvisaa jewellery"
                                            fill
                                            sizes="320px"
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        
                                        {/* Pill at the bottom containing product name and price */}
                                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 flex items-center justify-between opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full border border-[#D6C5B0] flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full border border-[#8A7A63]" />
                                                </div>
                                                <div>
                                                    <p className="text-[#1E1008] font-jost text-[11px] font-medium uppercase tracking-wider truncate max-w-[150px]">
                                                        {post.product_name || "Premium Jewellery"}
                                                    </p>
                                                    {post.price && (
                                                        <p className="text-[#8A7A63] font-jost text-[10px]">
                                                            ₹{Number(post.price).toLocaleString('en-IN')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-6 h-6 rounded-full border border-[#D6C5B0] flex items-center justify-center text-[#1E1008]">
                                                <FiChevronRight size={12} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Trust Strip ──────────────────────────────── */}
            {/* <section className="bg-[#3D2F24] border-b border-[#4A3C30]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                        {trustFeatures.map((feature) => (
                            <div key={feature.title} className="flex items-center gap-3 justify-center md:justify-start">
                                <div className="flex-shrink-0 text-[#A89880]">
                                    {feature.icon}
                                </div>
                                <div>
                                    <p className="text-[#E8DED0] font-jost text-xs sm:text-sm font-medium tracking-wide">
                                        {feature.title}
                                    </p>
                                    <p className="hidden lg:block text-[#A89880] font-jost text-[11px] mt-0.5">
                                        {feature.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section> */}
        </>
    );
}

function TestimonialCard({ testimonial }) {
    return (
        <div className="border-l border-[#5A4C40] pl-6 flex flex-col justify-between">
            <div>
                <h3 className="font-jost text-lg font-medium tracking-wide text-[#E8DED0] mb-4 uppercase">
                    {testimonial.headline}
                </h3>
                <p className="font-jost text-[13px] text-[#A89880] font-light leading-relaxed">
                    {testimonial.review}
                </p>
            </div>

            <div className="mt-8">
                <p className="font-jost text-[13px] text-[#E8DED0]">{testimonial.name}</p>
                <p className="font-jost text-[11px] text-[#A89880]">{testimonial.title}</p>
            </div>
        </div>
    );
}
