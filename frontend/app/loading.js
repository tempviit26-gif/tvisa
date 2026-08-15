import React from 'react';

export default function Loading() {
    return (
        <div className="w-full bg-[#F9F6F0] animate-pulse">
            {/* 1. Hero Skeleton */}
            <div className="w-full aspect-[3/4] md:aspect-[5/2] bg-[#EAE4D9]" />

            {/* 2. Marquee Skeleton */}
            <div className="w-full h-20 bg-[#EAE4D9]/80 border-t border-b border-[#31271D]/5 my-4" />

            {/* 3. Products Section Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                {/* Section Title Skeleton */}
                <div className="flex justify-center mb-16">
                    <div className="h-10 w-3/4 max-w-lg bg-[#EAE4D9] rounded" />
                </div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="w-full">
                            {/* Image Placeholder */}
                            <div className="w-full aspect-[4/5] bg-[#EAE4D9] mb-4" />
                            {/* Text Placeholders */}
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 w-2/3">
                                    <div className="h-4 w-full bg-[#EAE4D9] rounded" />
                                    <div className="h-3 w-1/2 bg-[#EAE4D9] rounded" />
                                </div>
                                <div className="h-4 w-1/4 bg-[#EAE4D9] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Second Products Section Skeleton */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-28">
                <div className="flex justify-center mb-16">
                    <div className="h-10 w-2/3 max-w-md bg-[#EAE4D9] rounded" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-full">
                            <div className="w-full aspect-[4/5] bg-[#EAE4D9] mb-4" />
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 w-2/3">
                                    <div className="h-4 w-full bg-[#EAE4D9] rounded" />
                                    <div className="h-3 w-1/2 bg-[#EAE4D9] rounded" />
                                </div>
                                <div className="h-4 w-1/4 bg-[#EAE4D9] rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
