'use client';

import { FiShield, FiTruck, FiRefreshCw, FiAward } from 'react-icons/fi';

const features = [
    { icon: FiShield, title: 'BIS Hallmarked', desc: 'Every piece certified for purity' },
    { icon: FiTruck, title: 'Free Shipping', desc: 'Free delivery on all orders' },
    { icon: FiRefreshCw, title: '30-Day Returns', desc: 'Easy returns & exchanges' },
    { icon: FiAward, title: 'Lifetime Exchange', desc: 'Exchange anytime, forever' },
];

export default function TrustStrip() {
    return (
        <section className="py-16 px-4 bg-white border-t border-blush/50">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {features.map((item) => (
                        <div key={item.title} className="text-center group">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-petal border border-blush/50 mb-4 group-hover:border-gold/50 transition-colors">
                                <item.icon size={24} className="text-deep-rose" />
                            </div>
                            <h3 className="font-cormorant text-lg text-noir mb-1">{item.title}</h3>
                            <p className="text-xs text-mid font-light">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
