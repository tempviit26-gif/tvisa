'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { wishlistAPI } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/queryClient';
import ProductCard from '@/components/product/ProductCard';
import { FiHeart } from 'react-icons/fi';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function WishlistPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: wishlist, isLoading } = useQuery({
        queryKey: QUERY_KEYS.wishlist,
        queryFn: async () => {
            const res = await wishlistAPI.getWishlist();
            return res.data?.data || res.data;
        },
    });

    const removeMutation = useMutation({
        mutationFn: (id) => wishlistAPI.removeFromWishlist(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist });
            toast.success('Removed from wishlist');
        },
    });

    const items = wishlist || [];

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-14">
                <p className="text-gold text-sm tracking-[0.3em] uppercase font-jost font-light mb-3">Your Picks</p>
                <h1 className="font-cormorant text-4xl sm:text-5xl text-noir">Wishlist</h1>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-3">
                            <div className="skeleton aspect-square" />
                            <div className="skeleton h-4 w-3/4" />
                            <div className="skeleton h-4 w-1/3" />
                        </div>
                    ))}
                </div>
            ) : items.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <div key={item.id} className="relative group">
                            <ProductCard product={item.product_detail} />
                            <button
                                onClick={() => removeMutation.mutate(item.id)}
                                className="absolute top-3 right-3 z-10 p-2 bg-deep-rose text-white rounded-full shadow-lg hover:bg-deep-rose/80 transition-colors"
                                title="Remove from wishlist"
                            >
                                <FiHeart size={14} fill="white" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <FiHeart size={48} className="mx-auto text-blush mb-4" />
                    <p className="text-mid text-lg mb-2">Your wishlist is empty</p>
                    <p className="text-sm text-mid/60 mb-6">Start adding items you love</p>
                    <Link href="/categories" className="bg-deep-rose text-white px-8 py-3 text-sm hover:bg-deep-rose/90 transition-colors">
                        Explore Collections
                    </Link>
                </div>
            )}
        </div>
    );
}
