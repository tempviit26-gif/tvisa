'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useCart } from '@/providers/CartProvider';
import { cartAPI, productsAPI } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/queryClient';
import CartDrawer from '@/components/cart/CartDrawer';

export default function Navbar({ suppressed = false }) {
    const { data: session } = useSession();
    const { isCartOpen, toggleCart } = useCart();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: cartData } = useQuery({
        queryKey: QUERY_KEYS.cart,
        queryFn: async () => {
            const res = await cartAPI.getCart();
            return res.data?.data || res.data;
        },
        staleTime: 0,
        refetchOnWindowFocus: true,
        retry: false,
    });

    const { data: categoriesData } = useQuery({
        queryKey: QUERY_KEYS.categories,
        queryFn: async () => {
            const res = await productsAPI.getCategories();
            return res.data?.data || res.data;
        },
        staleTime: 60 * 1000,
    });

    const cartCount = cartData?.total_items || 0;

    const categories = categoriesData?.results || categoriesData || [];
    const categoryLinks = categories.slice(0, 3).map((cat) => ({
        label: cat.name,
        href: `/categories/${cat.slug}`,
    }));

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
            setSearchOpen(false);
            setSearchQuery('');
        }
    };

    if (suppressed) {
        return (
            <header className="fixed top-0 w-full z-50 bg-surface-container-low/85 backdrop-blur-md h-20 border-b border-outline-variant/30">
                <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-full w-full max-w-container-max mx-auto">
                    <Link href="/" className="text-xs uppercase tracking-widest text-on-surface-variant flex items-center gap-2 group">
                        <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Home
                    </Link>
                    <Link href="/" className="font-display text-2xl tracking-tighter text-primary">Tvisaa</Link>
                    <div className="w-20"></div>
                </div>
            </header>
        );
    }

    return (
        <>
            <nav className="bg-surface/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant/30 flex justify-between items-center px-margin-mobile md:px-margin-desktop py-6 transition-all duration-300">
                {/* Mobile menu toggle */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-1 text-on-surface-variant hover:text-secondary transition-colors"
                    aria-label="Toggle Menu"
                >
                    {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                </button>

                {/* Left Desktop Nav links */}
                <div className="hidden md:flex items-center gap-gutter">
                    <Link className="text-[13px] uppercase tracking-widest text-on-surface-variant hover:text-secondary nav-link" href="/categories">
                        Collections
                    </Link>
                    <Link className="text-[13px] uppercase tracking-widest text-on-surface-variant hover:text-secondary nav-link" href="/categories">
                        Bespoke
                    </Link>
                    <Link className="text-[13px] uppercase tracking-widest text-on-surface-variant hover:text-secondary nav-link" href="/categories">
                        Atelier
                    </Link>
                </div>

                {/* Central Brand Title */}
                <Link className="font-display text-2xl absolute left-1/2 -translate-x-1/2 text-primary tracking-tight" href="/">
                    Tvisaa
                </Link>

                {/* Right Action Icons */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setSearchOpen(!searchOpen)}
                        className="text-on-surface-variant hover:text-secondary transition-colors"
                        aria-label="Search"
                    >
                        <FiSearch size={20} />
                    </button>

                    <Link href="/wishlist" className="text-on-surface-variant hover:text-secondary transition-colors hidden sm:block" aria-label="Wishlist">
                        <FiHeart size={20} />
                    </Link>

                    {session ? (
                        <div className="relative group">
                            <Link href="/account" className="text-on-surface-variant hover:text-secondary flex items-center gap-1">
                                <span className="material-symbols-outlined">person</span>
                            </Link>
                            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-low border border-outline-variant shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                                <div className="p-4 border-b border-outline-variant/30">
                                    <p className="text-sm font-medium text-primary truncate">{session.user.name}</p>
                                    <p className="text-xs text-on-surface-variant truncate">{session.user.email}</p>
                                </div>
                                <Link href="/account" className="block px-4 py-3 text-xs uppercase tracking-wider text-primary hover:bg-surface-container-high transition-colors">
                                    Account
                                </Link>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="w-full text-left px-4 py-3 text-xs uppercase tracking-wider text-error hover:bg-surface-container-high transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <Link href="/auth/login" className="text-on-surface-variant hover:text-secondary" aria-label="Sign In">
                            <span className="material-symbols-outlined">person</span>
                        </Link>
                    )}

                    <button onClick={toggleCart} className="text-on-surface-variant hover:text-secondary relative" aria-label="Shopping Bag">
                        <span className="material-symbols-outlined">shopping_bag</span>
                        <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${cartCount > 0 ? 'bg-secondary' : 'bg-primary'}`}></span>
                    </button>
                </div>
            </nav>

            {/* Search Banner Overlay */}
            {searchOpen && (
                <div className="fixed top-20 left-0 w-full bg-surface-container-low border-b border-outline-variant z-40 animate-fade-in py-4 px-margin-mobile md:px-margin-desktop shadow-md">
                    <div className="max-w-container-max mx-auto flex items-center gap-4">
                        <FiSearch className="text-on-surface-variant" size={20} />
                        <form onSubmit={handleSearch} className="flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="SEARCH HANDCRAFTED PIECES..."
                                className="w-full bg-transparent text-primary text-sm tracking-wider uppercase border-0 outline-none focus:ring-0 placeholder:text-outline"
                                autoFocus
                            />
                        </form>
                        <button onClick={() => setSearchOpen(false)} className="text-on-surface-variant hover:text-primary">
                            <FiX size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-x-0 top-[73px] bg-surface-container-low border-b border-outline-variant z-40 p-6 flex flex-col gap-4 animate-fade-in shadow-xl">
                    <Link
                        href="/categories"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs uppercase tracking-widest text-primary py-2 border-b border-outline-variant/30"
                    >
                        Collections
                    </Link>
                    <Link
                        href="/categories"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs uppercase tracking-widest text-primary py-2 border-b border-outline-variant/30"
                    >
                        Bespoke
                    </Link>
                    <Link
                        href="/categories"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs uppercase tracking-widest text-primary py-2 border-b border-outline-variant/30"
                    >
                        Atelier
                    </Link>
                    <Link
                        href="/auth/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs uppercase tracking-widest text-secondary py-2"
                    >
                        Sign In / Account
                    </Link>
                </div>
            )}

            <CartDrawer isOpen={isCartOpen} />
        </>
    );
}
