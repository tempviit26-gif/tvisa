'use client';

export default function FloatingWhatsApp() {
    const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    const message = encodeURIComponent('Hi Tvisaa! I need help with jewellery.');
    const href = `https://wa.me/${phoneNumber}?text=${message}`;

    return (
        <>
            <style>{`
                @keyframes wa-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(37,211,102,0.5); }
                    50%       { box-shadow: 0 0 0 12px rgba(37,211,102,0); }
                }
                .wa-btn {
                    animation: wa-pulse 2.4s ease-in-out infinite;
                    transition: transform 0.25s ease, box-shadow 0.25s ease;
                }
                .wa-btn:hover {
                    transform: scale(1.1);
                    animation: none;
                    box-shadow: 0 12px 32px rgba(37,211,102,0.45);
                }
            `}</style>

            <a
                id="floating-whatsapp-btn"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="wa-btn fixed bottom-6 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
            >
                {/* WhatsApp SVG icon — no external dependency */}
                <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">
                    <path d="M16.003 3C9.374 3 4 8.373 4 15.002c0 2.184.588 4.31 1.705 6.173L4 29l8.047-1.676A12.94 12.94 0 0016.003 28c6.628 0 12.001-5.374 12.001-13.001C28.004 8.373 22.631 3 16.003 3zm6.685 18.184c-.278.782-1.634 1.493-2.24 1.562-.574.065-1.292.092-2.086-.13-.48-.137-1.098-.32-1.888-.627-3.32-1.338-5.487-4.655-5.654-4.875-.167-.219-1.36-1.812-1.36-3.455 0-1.643.86-2.45 1.165-2.784.303-.334.66-.418.88-.418l.631.012c.203.008.474-.077.741.565.278.668.945 2.311 1.027 2.48.082.17.137.368.027.593-.11.224-.166.363-.329.558-.166.196-.349.438-.497.588-.166.167-.34.348-.146.681.193.334.862 1.42 1.85 2.3 1.27 1.133 2.341 1.483 2.674 1.649.334.167.527.14.72-.083.195-.222.833-.972 1.055-1.305.222-.334.443-.278.747-.167.306.11 1.942.916 2.277 1.083.334.167.555.25.637.39.083.14.083.803-.195 1.584z" />
                </svg>
            </a>
        </>
    );
}
