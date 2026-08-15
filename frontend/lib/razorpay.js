/**
 * Razorpay integration utility.
 * Loads the Razorpay script and opens the checkout modal.
 */

export function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (typeof window !== 'undefined' && window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export async function openRazorpayCheckout({
    orderId,
    razorpayOrderId,
    amount,
    currency = 'INR',
    keyId,
    user,
    onSuccess,
    onFailure,
}) {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
        throw new Error('Failed to load Razorpay SDK');
    }

    const options = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency,
        name: 'Lumière Jewels',
        description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
        order_id: razorpayOrderId,
        prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '',
        },
        theme: {
            color: '#8B1D52',
        },
        config: {
            display: {
                hide: [
                    { method: 'paylater' },
                ],
            },
        },
        handler: function (response) {
            onSuccess?.({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
            });
        },
        modal: {
            ondismiss: function () {
                onFailure?.('Payment cancelled by user');
            },
        },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
        onFailure?.(response.error?.description || 'Payment failed', {
            razorpay_order_id: response.error?.metadata?.order_id,
            razorpay_payment_id: response.error?.metadata?.payment_id,
            error_code: response.error?.code,
            error_description: response.error?.description,
            error_reason: response.error?.reason,
            error_source: response.error?.source,
            error_step: response.error?.step,
        });
    });
    rzp.open();
}
