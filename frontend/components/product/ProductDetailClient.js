'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { ShoppingBag, Heart, ShieldCheck } from 'lucide-react';
import { FiTruck } from 'react-icons/fi';
import { cartAPI, wishlistAPI, extractErrorMessage } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/queryClient';
import { useCart } from '@/providers/CartProvider';
import { getImageUrl } from '@/lib/images';
import toast from 'react-hot-toast';

export default function ProductDetailClient({ product }) {
    const { data: session } = useSession();
    const { openCart } = useCart();
    const queryClient = useQueryClient();

    const [selectedVariantId, setSelectedVariantId] = useState(null);
    const [activeImage, setActiveImage] = useState(0);

    const { data: liveProduct } = useQuery({
        queryKey: ['product-live', product?.id],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${product.id}/`, {
                cache: 'no-store',
            });
            const data = await res.json();
            return data?.data || data;
        },
        enabled: !!product?.id,
        staleTime: 0,
    });

    const activeProduct = liveProduct || product;

    useEffect(() => {
        if (activeProduct?.variants?.length > 0 && !selectedVariantId) {
            setSelectedVariantId(activeProduct.variants[0].id);
        }
    }, [activeProduct, selectedVariantId]);

    const variants = activeProduct?.variants || [];
    const selectedVariant = variants.find((v) => v.id === selectedVariantId) || null;

    const addToCartMutation = useMutation({
        mutationFn: () => cartAPI.addItem({
            variant_id: selectedVariant?.id,
            quantity: 1,
            product_name: activeProduct.name,
            primary_image: getImageUrl(activeProduct.images?.[0]),
            variant_detail: { metal_type: selectedVariant?.metal_type, size: selectedVariant?.size },
            price: Number(
                (!!activeProduct.discounted_price && Number(activeProduct.discounted_price) > 0)
                    ? activeProduct.discounted_price
                    : activeProduct.base_price
            ),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart });
            toast.success('Added to cart');
            openCart();
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Failed to add to cart')),
    });

    const addToWishlistMutation = useMutation({
        mutationFn: () => wishlistAPI.addToWishlist(product.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
            toast.success('Added to wishlist');
        },
        onError: (err) => toast.error(extractErrorMessage(err, 'Already in wishlist')),
    });

    if (!activeProduct) return null;

    const images = activeProduct.images || [];
    const mainImageUrl = images[activeImage] ? getImageUrl(images[activeImage]) : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVK2oXDL66lynESllwEAWZSfiKqUvGSb9-k7W_f7pD64WaLJh9pMitrsihTiHu1rm-jwD5mUYLA2KHCIblaqJVq_TTifj8uzNYMh-rdoDQFk97gQvygLKez7R2tIkXjFag75X_cBJKmRr7g3RjHs35inZ7zQa8POjCVrHf0M_qDEjBbL4W1ZEajsPvUTcqeXUAtwL2bKERYupnmdBk9igAJHkPyQbeIOarKe_9GGyzq6MASVnQ5Un0ew';

    const currentPrice = activeProduct.base_price;
    const currentStock = selectedVariant?.stock ?? 1;
    const isDiscounted = !!activeProduct.discounted_price && Number(activeProduct.discounted_price) > 0;
    const formatPrice = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

    return (
        <div className="flex flex-col min-h-screen pt-20 bg-surface text-primary">
            <main className="flex-grow pt-10 pb-stack-lg">
                <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 lg:grid-cols-12 gap-gutter lg:gap-margin-desktop items-start">
                    {/* Left Column: Main Image & Image Thumbnails */}
                    <div className="lg:col-span-7 flex flex-col gap-2">
                        <div className="aspect-[3/4] bg-surface-container-low overflow-hidden relative border border-outline-variant/20">
                            {images.length > 0 ? (
                                <Image
                                    src={mainImageUrl}
                                    alt={activeProduct.name}
                                    fill
                                    priority
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 60vw"
                                />
                            ) : (
                                <img src={mainImageUrl} className="w-full h-full object-cover" alt={activeProduct.name} />
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`aspect-square bg-surface-container-low overflow-hidden relative border transition-all ${
                                            activeImage === idx ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/30'
                                        }`}
                                    >
                                        <Image
                                            src={getImageUrl(img)}
                                            alt={`Thumbnail ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="120px"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details & Actions */}
                    <div className="lg:col-span-5 flex flex-col gap-stack-md pt-6 lg:pt-0 sticky top-24">
                        <div>
                            <h1 className="font-display text-4xl mb-4 text-primary tracking-tight">{activeProduct.name}</h1>
                            <div className="flex items-center gap-3">
                                {isDiscounted ? (
                                    <>
                                        <span className="text-xl text-primary font-medium">{formatPrice(activeProduct.discounted_price)}</span>
                                        <span className="text-sm text-outline line-through">{formatPrice(currentPrice)}</span>
                                    </>
                                ) : (
                                    <span className="text-xl text-on-surface-variant font-medium">{formatPrice(currentPrice || 1250)}</span>
                                )}
                            </div>
                        </div>

                        <p className="text-on-surface-variant leading-relaxed text-sm md:text-base font-light">
                            {activeProduct.description || 'A study in quiet elegance. Handcrafted to capture light through precision detailing.'}
                        </p>

                        {/* Material Swatches */}
                        <div className="space-y-6">
                            <div>
                                <span className="text-[10px] uppercase tracking-widest block mb-3 text-outline font-semibold">Material / Finish</span>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        className="w-8 h-8 rounded-full border border-primary bg-[#D4AF37] ring-offset-2 ring-1 ring-primary focus:outline-none"
                                        title="Gold Finish"
                                    />
                                    <button
                                        type="button"
                                        className="w-8 h-8 rounded-full border border-outline bg-[#E6E2DB] focus:outline-none"
                                        title="Silver Finish"
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => addToCartMutation.mutate()}
                                    disabled={addToCartMutation.isPending || currentStock === 0}
                                    className="flex-1 py-4 border border-primary uppercase tracking-widest text-xs font-medium text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50"
                                >
                                    {currentStock === 0 ? 'Out of Stock' : addToCartMutation.isPending ? 'Adding...' : 'Add to Bag'}
                                </button>
                                <button
                                    onClick={() => {
                                        if (!session) {
                                            toast.error('Please sign in');
                                            return;
                                        }
                                        addToWishlistMutation.mutate();
                                    }}
                                    className="px-4 border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center"
                                    aria-label="Wishlist"
                                >
                                    <Heart size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Accordion Details */}
                        <div className="border-t border-outline-variant pt-6 space-y-4">
                            <details className="group border-b border-outline-variant/30 pb-4" open>
                                <summary className="flex justify-between items-center cursor-pointer uppercase text-xs tracking-widest text-primary font-semibold">
                                    Details
                                    <span className="material-symbols-outlined text-sm">expand_more</span>
                                </summary>
                                <ul className="pt-4 text-sm text-on-surface-variant space-y-2 list-disc list-inside font-light">
                                    <li>Premium Waterproof & Tarnish-Resistant Finish</li>
                                    <li>Hypoallergenic stainless steel / 18k PVD gold</li>
                                    <li>Designed for everyday wear</li>
                                </ul>
                            </details>

                            <details className="group border-b border-outline-variant/30 pb-4">
                                <summary className="flex justify-between items-center cursor-pointer uppercase text-xs tracking-widest text-primary font-semibold">
                                    Shipping & Returns
                                    <span className="material-symbols-outlined text-sm">expand_more</span>
                                </summary>
                                <p className="pt-4 text-xs text-on-surface-variant leading-relaxed">
                                    Free complimentary express shipping on all orders. Dispatch within 24-48 hours.
                                </p>
                            </details>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
