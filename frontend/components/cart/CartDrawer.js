'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { FiX, FiMinus, FiPlus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '@/providers/CartProvider';
import { cartAPI, extractErrorMessage } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/queryClient';
import Link from 'next/link';
import Image from 'next/image';
import { normalizeImageUrl } from '@/lib/images';
import toast from 'react-hot-toast';

// Extracted Component for individual cart items to manage local state and debouncing
function CartItemRow({ item, updateMutation, removeMutation }) {
    const [localQuantity, setLocalQuantity] = useState(item.quantity);
    const primaryImage = normalizeImageUrl(item.primary_image || '');

    // Sync local state if the server pushes a new quantity (e.g., from another tab)
    // Only sync if we aren't currently waiting for a mutation to fire
    useEffect(() => {
        setLocalQuantity(item.quantity);
    }, [item.quantity]);

    // Handle debounced API update
    useEffect(() => {
        // Don't fire if the local quantity perfectly matches the server OR is invalid
        if (localQuantity === item.quantity || localQuantity === '' || localQuantity < 1) return;

        const timeoutId = setTimeout(() => {
            updateMutation.mutate({ id: item.id, quantity: localQuantity });
        }, 400); // 400ms debounce to wait for user to finish typing/clicking

        return () => clearTimeout(timeoutId);
    }, [localQuantity, item.quantity, item.id, updateMutation]);

    const handleInputChange = (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            setLocalQuantity(val);
        } else if (e.target.value === '') {
            setLocalQuantity(''); // Allow erasing before typing a new number
        }
    };

    const handleInputBlur = () => {
        if (localQuantity === '' || localQuantity < 1) {
            setLocalQuantity(1); // Reset to 1 if left empty
        }
    };

    return (
        <div className="flex gap-4 pb-5 border-b border-blush/30">
            {/* Thumbnail */}
            <div className="relative w-24 h-24 bg-petal flex-shrink-0">
                {primaryImage ? (
                    <Image
                        src={primaryImage}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                        sizes="96px"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-blush">
                        <FiShoppingBag size={24} />
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-noir truncate">{item.product_name}</h3>
                <p className="text-xs text-mid mt-1 font-light">
                    {item.variant_detail?.metal_type}
                    {item.variant_detail?.size && ` · Size ${item.variant_detail.size}`}
                </p>

                {/* Quantity stepper & Price */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-blush bg-white">
                        <button
                            onClick={() => {
                                if (localQuantity > 1) setLocalQuantity(prev => (prev === '' ? 1 : prev) - 1);
                            }}
                            className="p-2 text-mid hover:text-noir transition-colors"
                        >
                            <FiMinus size={14} />
                        </button>

                        {/* Typed Input Field instead of Span */}
                        <input
                            type="number"
                            min="1"
                            value={localQuantity}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            className="w-10 text-center text-sm font-medium text-noir outline-none border-x border-blush/30 p-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />

                        <button
                            onClick={() => setLocalQuantity(prev => (prev === '' ? 0 : prev) + 1)}
                            className="p-2 text-mid hover:text-noir transition-colors"
                        >
                            <FiPlus size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-noir">₹{Number(item.line_total).toLocaleString('en-IN')}</span>
                            {/* Show subtle loading state while updating */}
                            {localQuantity !== item.quantity && (
                                <span className="text-[10px] text-mid animate-pulse mt-0.5">updating...</span>
                            )}
                        </div>
                        <button
                            onClick={() => removeMutation.mutate(item.id)}
                            className="p-2 -mr-2 text-mid hover:text-deep-rose transition-colors"
                            disabled={removeMutation.isPending}
                        >
                            <FiTrash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


export default function CartDrawer({ isOpen }) {
    const { closeCart } = useCart();
    const { data: session } = useSession();
    const queryClient = useQueryClient();

    const { data: cart, isLoading } = useQuery({
        queryKey: QUERY_KEYS.cart,
        queryFn: async () => {
            const res = await cartAPI.getCart();
            return res.data?.data || res.data;
        },
        enabled: isOpen,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, quantity }) => cartAPI.updateItem(id, { quantity }),

        // Optimistic Update: Instantly update the UI before the server responds
        onMutate: async (newQuantityObj) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEYS.cart });
            const previousCart = queryClient.getQueryData(QUERY_KEYS.cart);

            queryClient.setQueryData(QUERY_KEYS.cart, old => {
                if (!old) return old;
                return {
                    ...old,
                    items: old.items.map(item =>
                        item.id === newQuantityObj.id
                            ? {
                                ...item,
                                quantity: newQuantityObj.quantity,
                                // Optimistically calculate new line total too!
                                line_total: (Number(item.line_total) / item.quantity) * newQuantityObj.quantity
                            }
                            : item
                    )
                };
            });
            return { previousCart };
        },
        onError: (err, newQuantityObj, context) => {
            queryClient.setQueryData(QUERY_KEYS.cart, context.previousCart);
            toast.error(extractErrorMessage(err, 'Failed to update stock'));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart });
        }
    });

    const removeMutation = useMutation({
        mutationFn: (id) => cartAPI.removeItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cart });
            toast.success('Item removed');
        },
    });

    const items = cart?.items || [];

    // Recalculate subtotal optimistically based on the current items in state
    const subtotal = items.reduce((acc, item) => acc + Number(item.line_total), 0);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-noir/50 z-50 transition-opacity"
                onClick={closeCart}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white z-50 shadow-2xl animate-slide-in-right flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-blush/50">
                    <h2 className="font-cormorant text-3xl text-noir">Your Cart</h2>
                    <button onClick={closeCart} className="p-2 text-mid hover:text-noir transition-colors rounded-full hover:bg-petal">
                        <FiX size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4 pb-5 border-b border-blush/30">
                                    <div className="skeleton w-24 h-24" />
                                    <div className="flex-1 space-y-3 pt-1">
                                        <div className="skeleton h-4 w-3/4" />
                                        <div className="skeleton h-3 w-1/2" />
                                        <div className="flex justify-between mt-4">
                                            <div className="skeleton h-8 w-24" />
                                            <div className="skeleton h-4 w-16" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <FiShoppingBag size={64} className="text-blush mb-6" />
                            <p className="text-xl font-cormorant text-noir mb-2">Your cart is empty</p>
                            <p className="text-sm text-mid/80 mb-8 font-light max-w-[250px]">Explore our collections and discover something extraordinary.</p>
                            <Link
                                href="/categories"
                                onClick={closeCart}
                                className="bg-deep-rose text-white px-8 py-3 text-sm font-medium tracking-wide hover:bg-deep-rose/90 transition-colors"
                            >
                                Shop Now
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {items.map((item) => (
                                <CartItemRow
                                    key={item.id}
                                    item={item}
                                    updateMutation={updateMutation}
                                    removeMutation={removeMutation}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-blush/50 bg-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] p-6 z-10">
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-base">
                                <span className="text-mid font-light">Subtotal</span>
                                <span className="font-medium text-noir tracking-wide">₹{Number(subtotal).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-base">
                                <span className="text-mid font-light">Shipping</span>
                                <span className="text-green-600 font-medium tracking-wide">FREE</span>
                            </div>
                        </div>
                        <Link
                            href="/checkout"
                            onClick={closeCart}
                            className="block w-full bg-deep-rose text-white text-center py-4 text-sm font-medium tracking-widest uppercase hover:bg-deep-rose/90 transition-colors shadow-md hover:shadow-lg"
                        >
                            Proceed to Checkout
                        </Link>
                        <button
                            onClick={closeCart}
                            className="block w-full text-center mt-4 text-sm text-mid/80 font-light hover:text-noir transition-colors underline underline-offset-4 decoration-blush"
                        >
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
