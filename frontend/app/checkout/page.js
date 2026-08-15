'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { authAPI, cartAPI, ordersAPI, extractErrorMessage } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/queryClient';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { FiCheck, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        full_name: '', street: '', city: '', state: '', pincode: '',
    });
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    // Synchronous ref lock — prevents double-click race condition.
    // Unlike setState, ref updates are immediate and don't wait for a re-render,
    // so a second click within the same event loop tick is blocked instantly.
    const processingRef = useRef(false);

    const { data: addresses, refetch: refetchAddresses } = useQuery({
        queryKey: QUERY_KEYS.addresses,
        queryFn: async () => {
            const res = await authAPI.getAddresses();
            return res.data?.data || res.data;
        },
        enabled: !!session,
    });

    const { data: cart } = useQuery({
        queryKey: QUERY_KEYS.cart,
        queryFn: async () => {
            const res = await cartAPI.getCart();
            return res.data?.data || res.data;
        },
        enabled: !!session,
    });

    const addAddressMutation = useMutation({
        mutationFn: (data) => authAPI.createAddress(data),
        onSuccess: (res) => {
            refetchAddresses();
            setSelectedAddress(res.data?.data || res.data.id);
            setShowAddressForm(false);
            setNewAddress({ full_name: '', street: '', city: '', state: '', pincode: '' });
            toast.success('Address added');
        },
        onError: () => toast.error('Failed to add address'),
    });

    // Set default address when addresses load
    useEffect(() => {
        if (!selectedAddress && addresses?.length > 0) {
            const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
            setSelectedAddress(defaultAddr.id);
        }
    }, [addresses, selectedAddress]);

    // Auth gate — after all hooks
    if (status === 'unauthenticated') {
        router.push('/auth/login?callbackUrl=/checkout');
        return null;
    }

    const items = cart?.items || [];
    const subtotal = cart?.subtotal || 0;
    const shipping = paymentMethod === 'COD' ? 99 : 0;
    const total = subtotal + shipping;

    const handleCheckout = async () => {
        // Synchronous guard — blocks re-entrant calls from double-clicks before
        // React has had a chance to re-render the button as disabled.
        if (processingRef.current) return;
        processingRef.current = true;

        if (!selectedAddress) {
            toast.error('Please select a delivery address');
            processingRef.current = false;
            return;
        }
        if (items.length === 0) {
            toast.error('Your cart is empty');
            processingRef.current = false;
            return;
        }

        setProcessing(true);
        try {
            const res = await ordersAPI.createOrder({ address_id: selectedAddress, payment_method: paymentMethod });
            const orderData = res.data?.data || res.data;

            if (paymentMethod === 'COD') {
                toast.success('Order placed successfully!');
                router.push(`/account/orders/${orderData.order_id}`);
                return;
            }

            await openRazorpayCheckout({
                orderId: orderData.order_id,
                razorpayOrderId: orderData.razorpay_order_id,
                amount: orderData.amount,
                keyId: orderData.key_id,
                user: orderData.user,
                onSuccess: async (paymentData) => {
                    try {
                        await ordersAPI.verifyPayment(paymentData);
                        toast.success('Payment successful!');
                        router.push(`/account/orders/${orderData.order_id}`);
                    } catch {
                        toast.error('Payment verification failed');
                    }
                },
                onFailure: async (msg, failureData) => {
                    if (failureData?.razorpay_order_id) {
                        try {
                            await ordersAPI.markPaymentFailed(failureData);
                        } catch {
                            // Webhook can still reconcile this failure if local reporting fails.
                        }
                    }
                    toast.error(msg || 'Payment failed');
                },
            });
        } catch (err) {
            toast.error(extractErrorMessage(err, 'Failed to create order'));
        } finally {
            processingRef.current = false;
            setProcessing(false);
        }
    };

    if (status === 'loading') {
        return <div className="max-w-7xl mx-auto px-4 py-12"><div className="skeleton h-96 w-full" /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
            <h1 className="font-cormorant text-3xl lg:text-4xl text-noir mb-10 text-center">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                {/* Left — Addresses */}
                <div className="lg:col-span-3">
                    <h2 className="text-sm font-jost font-medium text-noir uppercase tracking-wider mb-4">
                        Delivery Address
                    </h2>

                    <div className="space-y-3 mb-6">
                        {(addresses || []).map((addr) => (
                            <button
                                key={addr.id}
                                onClick={() => setSelectedAddress(addr.id)}
                                className={`w-full text-left p-4 border transition-colors ${selectedAddress === addr.id
                                        ? 'border-deep-rose bg-petal'
                                        : 'border-blush hover:border-deep-rose/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-sm text-noir">{addr.full_name}</p>
                                        <p className="text-sm text-mid font-light mt-1">{addr.street}</p>
                                        <p className="text-sm text-mid font-light">{addr.city}, {addr.state} — {addr.pincode}</p>
                                    </div>
                                    {selectedAddress === addr.id && (
                                        <FiCheck className="text-deep-rose mt-1" size={18} />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {showAddressForm ? (
                        <div className="border border-blush p-5 space-y-3">
                            <h3 className="text-sm font-medium text-noir mb-2">New Address</h3>
                            {['full_name', 'street', 'city', 'state', 'pincode'].map((field) => (
                                <input
                                    key={field}
                                    type="text"
                                    placeholder={field.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                    value={newAddress[field]}
                                    onChange={(e) => setNewAddress({ ...newAddress, [field]: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-blush text-sm outline-none focus:border-deep-rose transition-colors"
                                />
                            ))}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => addAddressMutation.mutate(newAddress)}
                                    disabled={addAddressMutation.isPending}
                                    className="bg-deep-rose text-white px-6 py-2.5 text-sm hover:bg-deep-rose/90 transition-colors"
                                >
                                    Save Address
                                </button>
                                <button
                                    onClick={() => setShowAddressForm(false)}
                                    className="text-mid text-sm hover:text-noir transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddressForm(true)}
                            className="flex items-center gap-2 text-sm text-deep-rose hover:underline"
                        >
                            <FiPlus size={16} /> Add New Address
                        </button>
                    )}
                </div>

                {/* Right — Order Summary */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-blush p-6 sticky top-28">
                        <h2 className="text-sm font-jost font-medium text-noir uppercase tracking-wider mb-5">
                            Order Summary
                        </h2>

                        <div className="space-y-3 mb-5 max-h-60 overflow-y-auto">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <div className="flex-1">
                                        <p className="text-noir">{item.product_name}</p>
                                        <p className="text-xs text-mid font-light">
                                            {item.variant_detail?.metal_type} × {item.quantity}
                                        </p>
                                    </div>
                                    <p className="text-noir font-medium ml-4">
                                        ₹{Number(item.line_total).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-blush pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-mid">Subtotal</span>
                                <span className="text-noir">₹{Number(subtotal).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-mid">Shipping</span>
                                <span className={paymentMethod === 'COD' ? "text-noir" : "text-green-600 font-medium"}>
                                    {paymentMethod === 'COD' ? '₹99' : 'FREE'}
                                </span>
                            </div>
                            <div className="flex justify-between text-base font-medium pt-2 border-t border-blush">
                                <span className="text-noir">Total</span>
                                <span className="text-noir">₹{Number(total).toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="mt-6 border border-blush p-4 space-y-3 bg-petal/30">
                            <h3 className="text-sm font-medium text-noir mb-2">Payment Method</h3>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="payment_method"
                                    value="razorpay"
                                    checked={paymentMethod === 'razorpay'}
                                    onChange={() => setPaymentMethod('razorpay')}
                                    className="text-deep-rose focus:ring-deep-rose"
                                />
                                <span className="text-sm text-noir">Online Payment</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="payment_method"
                                    value="COD"
                                    checked={paymentMethod === 'COD'}
                                    onChange={() => setPaymentMethod('COD')}
                                    className="text-deep-rose focus:ring-deep-rose"
                                />
                                <span className="text-sm text-noir">Cash on Delivery (Extra ₹99)</span>
                            </label>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={processing || items.length === 0}
                            className="w-full mt-6 bg-deep-rose text-white py-4 text-sm font-jost font-medium tracking-wider uppercase hover:bg-deep-rose/90 transition-colors disabled:opacity-50"
                        >
                            {processing ? 'Processing...' : (paymentMethod === 'COD' ? 'Place Order with COD' : 'Pay with Razorpay')}
                        </button>

                        {paymentMethod === 'razorpay' && (
                            <p className="text-xs text-mid text-center mt-3 font-light">
                                🔒 Secured by Razorpay · 256-bit SSL encryption
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
