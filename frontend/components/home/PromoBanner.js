import React from 'react';

export default function PromoBanner() {
    const brands = ["CARTIER", "GRAFF", "QUINCE", "TIFFANY & CO.", "BVLGARI", "CHOPARD"];
    
    // Create a long enough list to allow seamless infinite scrolling
    const marqueeItems = [...brands, ...brands, ...brands, ...brands];

    return (
        <div className="bg-[#A9957F] text-[#F9F6F0] py-6 sm:py-8 border-t border-b border-white/10 overflow-hidden relative">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes banner-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-banner-scroll {
                    animation: banner-scroll 40s linear infinite;
                    width: max-content;
                }
            `}} />
            
            <div className="flex items-center animate-banner-scroll">
                {marqueeItems.map((brand, i) => (
                    <div key={i} className="flex items-center">
                        <span className="font-cormorant text-2xl sm:text-3xl lg:text-4xl px-8 lg:px-12 uppercase tracking-widest whitespace-nowrap">
                            {brand}
                        </span>
                        <span className="text-[#F9F6F0]/30 mx-4">•</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
