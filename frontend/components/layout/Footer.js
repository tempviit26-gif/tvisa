'use client';

import Link from 'next/link';

export default function Footer({ suppressed = false }) {
    if (suppressed) {
        return (
            <footer className="w-full py-8 border-t border-outline-variant mt-auto bg-surface-container-low">
                <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
                    <span className="text-[12px] text-outline uppercase tracking-widest">
                        © {new Date().getFullYear()} Tvisaa. Secure Checkout.
                    </span>
                </div>
            </footer>
        );
    }

    return (
        <footer className="bg-surface-container-low w-full border-t border-outline-variant flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop py-stack-md mt-auto gap-8">
            <div className="font-display text-2xl text-primary font-semibold tracking-tight">Tvisaa</div>
            <div className="text-sm text-on-surface-variant text-center md:text-left">
                © {new Date().getFullYear()} Tvisaa. Handcrafted Excellence.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm uppercase tracking-wider text-xs">
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/privacy-policy">
                    Privacy
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/terms-conditions">
                    Terms
                </Link>
                <Link className="text-on-surface-variant hover:text-secondary transition-colors" href="/shipping-delivery">
                    Shipping
                </Link>
            </div>
        </footer>
    );
}