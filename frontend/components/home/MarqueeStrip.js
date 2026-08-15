'use client';

export default function MarqueeStrip() {
    const items = [
        'BIS Hallmarked',
        '✦',
        'Lifetime Exchange',
        '✦',
        'Free Shipping on All Orders',
        '✦',
        '30-Day Returns',
        '✦',
        'HUID Certified',
        '✦',
    ];

    // Double for seamless loop
    const doubled = [...items, ...items];

    return (
        <div className="bg-deep-rose/5 border-y border-blush/50 py-4 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap flex items-center">
                {doubled.map((item, idx) => (
                    <span
                        key={idx}
                        className={`mx-4 text-sm font-jost tracking-wider ${item === '✦' ? 'text-gold text-xs' : 'text-deep-rose/70 uppercase font-light'
                            }`}
                    >
                        {item}
                    </span>
                ))}
            </div>
        </div>
    );
}
