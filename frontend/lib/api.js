import { getSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiError extends Error {
    constructor(response, data) {
        super(data?.message || 'API Error');
        this.response = response;
        this.data = data;
    }
}

export function extractErrorMessage(err, defaultMsg = 'Something went wrong') {
    if (!err || !err.response || !err.response.data) {
        return err?.message || defaultMsg;
    }
    const data = err.response.data;
    
    if (typeof data.error === 'string') return data.error;
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.message === 'string') return data.message;
    
    // Check if data is an object with arrays of strings (DRF validation errors)
    if (typeof data === 'object') {
        for (const key in data) {
            if (Array.isArray(data[key]) && typeof data[key][0] === 'string') {
                const fieldName = key.replace(/_/g, ' ');
                const capitalizedField = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                return `${capitalizedField}: ${data[key][0]}`;
            }
            if (typeof data[key] === 'string') {
                return data[key];
            }
        }
    }
    return defaultMsg;
}

async function fetchWrapper(endpoint, options = {}) {
    let url = `${baseURL}${endpoint}`;

    if (options.params) {
        // Clean undefined or null params
        const validParams = Object.entries(options.params).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
                acc[key] = value;
            }
            return acc;
        }, {});
        if (Object.keys(validParams).length > 0) {
            const query = new URLSearchParams(validParams).toString();
            url += (url.includes('?') ? '&' : '?') + query;
        }
    }

    const method = options.method || 'GET';
    const isGet = method === 'GET';

    const headers = {
        // Only set Content-Type on requests that have a body.
        // Sending it on GET causes a CORS preflight OPTIONS round-trip.
        ...(!isGet && { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    if (typeof window !== 'undefined') {
        const session = await getSession();
        if (session?.accessToken) {
            headers.Authorization = `Bearer ${session.accessToken}`;
        } else {
            let guestId = localStorage.getItem('guest_id');
            if (!guestId) {
                const { v4: uuidv4 } = require('uuid');
                guestId = uuidv4();
                localStorage.setItem('guest_id', guestId);
            }
            headers['X-Guest-ID'] = guestId;
        }
    }

    const config = {
        method,
        headers,
    };

    if (options.data) {
        config.body = JSON.stringify(options.data);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    config.signal = controller.signal;

    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        let data = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (e) {
                // Ignore parsing errors
            }
        }

        const axiosLikeResponse = {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: options
        };

        if (!response.ok) {
            const error = new ApiError(axiosLikeResponse, data);
            
            if (response.status === 429) {
                // Rate limit exceeded — inform the user with retry-after time
                const retryAfter = response.headers.get('Retry-After');
                const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
                const waitMsg = waitSeconds >= 60
                    ? `${Math.ceil(waitSeconds / 60)} minute${Math.ceil(waitSeconds / 60) > 1 ? 's' : ''}`
                    : `${waitSeconds} second${waitSeconds !== 1 ? 's' : ''}`;
                toast.error(`Too many attempts. Please wait ${waitMsg} before trying again.`, {
                    duration: 5000,
                    icon: '🚦',
                });
            } else if (response.status === 401) {
                // Silently reject
            } else if (response.status >= 500) {
                toast.error('Something went wrong. Please try again later.');
            }
            throw error;
        }

        return axiosLikeResponse;
    } catch (error) {
        if (error.name === 'AbortError') {
             throw new Error('Request timed out');
        }
        throw error;
    }
}

const api = {
    get: (url, config = {}) => fetchWrapper(url, { ...config, method: 'GET' }),
    post: (url, data, config = {}) => fetchWrapper(url, { ...config, method: 'POST', data }),
    put: (url, data, config = {}) => fetchWrapper(url, { ...config, method: 'PUT', data }),
    delete: (url, config = {}) => fetchWrapper(url, { ...config, method: 'DELETE' }),
};

// ─── Auth ────────────────────────────────────
export const authAPI = {
    register: (data) => api.post('/auth/register/', data),
    verifyOTP: (data) => api.post('/auth/verify-otp/', data),
    resendOTP: (data) => api.post('/auth/resend-otp/', data),
    login: (data) => api.post('/auth/login/', data),
    refreshToken: (refresh) => api.post('/auth/refresh/', { refresh }),
    getProfile: () => api.get('/auth/profile/', { requireAuth: true }),
    updateProfile: (data) => api.put('/auth/profile/', data),
    getAddresses: () => api.get('/auth/addresses/', { requireAuth: true }),
    createAddress: (data) => api.post('/auth/addresses/', data),
    updateAddress: (id, data) => api.put(`/auth/addresses/${id}/`, data),
    deleteAddress: (id) => api.delete(`/auth/addresses/${id}/`),
    setDefaultAddress: (id) => api.put(`/auth/addresses/${id}/set-default/`),
};

// ─── Products ────────────────────────────────
export const productsAPI = {
    getProducts: (params) => api.get('/products/', { params }),
    getProduct: (id) => api.get(`/products/${id}/`),
    getHomepageData: () => api.get('/products/homepage/all/'),
    getHeroSliders: () => api.get('/products/homepage/hero/'),
    getInstagramPosts: () => api.get('/products/homepage/instagram/'),
    getBestSellers: () => api.get('/products/homepage/bestsellers/'),
    getQuickPicks: () => api.get('/products/homepage/quick-picks/'),
    getNewArrivals: () => api.get('/products/homepage/new-arrivals/'),
    getCategories: () => api.get('/categories/'),
    getCategoryProducts: (slug, params) => api.get(`/categories/${slug}/products/`, { params }),
    getCategorySubcategories: (slug) => api.get(`/categories/${slug}/subcategories/`),
    getSubcategoryProducts: (slug, params) => api.get(`/subcategories/${slug}/products/`, { params }),
};

// ─── Cart ────────────────────────────────────
export const cartAPI = {
    getCart: async () => {
        const session = await getSession();
        if (session?.accessToken) {
            const localCartStr = typeof window !== 'undefined' ? localStorage.getItem('local_cart') : null;
            if (localCartStr) {
                try {
                    const localItems = JSON.parse(localCartStr);
                    if (localItems && localItems.length > 0) {
                        for (const item of localItems) {
                            try {
                                await api.post('/cart/items/', { variant_id: item.variant_id, quantity: item.quantity }, { headers: { Authorization: `Bearer ${session.accessToken}` } });
                            } catch (e) {
                                console.error('Failed to sync local cart item', e);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing local cart', e);
                }
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('local_cart');
                }
            }
            return api.get('/cart/');
        } else {
            const items = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('local_cart') || '[]') : [];
            const subtotal = items.reduce((acc, item) => acc + Number(item.line_total), 0);
            return { data: { data: { items, subtotal, total_items: items.length } } };
        }
    },
    addItem: async (data) => {
        const session = await getSession();
        if (session?.accessToken) {
            return api.post('/cart/items/', { variant_id: data.variant_id, quantity: data.quantity });
        } else {
            const items = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('local_cart') || '[]') : [];
            const existingIndex = items.findIndex(i => i.variant_id === data.variant_id);
            if (existingIndex >= 0) {
                items[existingIndex].quantity += data.quantity;
                items[existingIndex].line_total = items[existingIndex].quantity * data.price;
            } else {
                items.push({
                    id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    variant_id: data.variant_id,
                    quantity: data.quantity,
                    product_name: data.product_name,
                    primary_image: data.primary_image,
                    variant_detail: data.variant_detail,
                    price: data.price,
                    line_total: data.quantity * data.price
                });
            }
            if (typeof window !== 'undefined') {
                localStorage.setItem('local_cart', JSON.stringify(items));
            }
            return { data: { data: { items } } };
        }
    },
    updateItem: async (id, data) => {
        const session = await getSession();
        if (session?.accessToken) {
            return api.put(`/cart/items/${id}/`, data);
        } else {
            const items = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('local_cart') || '[]') : [];
            const existingIndex = items.findIndex(i => i.id === id);
            if (existingIndex >= 0) {
                items[existingIndex].quantity = data.quantity;
                items[existingIndex].line_total = items[existingIndex].quantity * items[existingIndex].price;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('local_cart', JSON.stringify(items));
                }
            }
            return { data: { data: { items } } };
        }
    },
    removeItem: async (id) => {
        const session = await getSession();
        if (session?.accessToken) {
            return api.delete(`/cart/items/${id}/delete/`);
        } else {
            let items = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('local_cart') || '[]') : [];
            items = items.filter(i => i.id !== id);
            if (typeof window !== 'undefined') {
                localStorage.setItem('local_cart', JSON.stringify(items));
            }
            return { data: { data: { items } } };
        }
    },
    clearCart: async () => {
        const session = await getSession();
        if (session?.accessToken) {
            return api.delete('/cart/clear/');
        } else {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('local_cart');
            }
            return { data: { data: { items: [], subtotal: 0, total_items: 0 } } };
        }
    },
};

// ─── Wishlist ────────────────────────────────
export const wishlistAPI = {
    getWishlist: () => api.get('/wishlist/', { requireAuth: false }),
    addToWishlist: (productId) => api.post('/wishlist/add/', { product: productId }, { requireAuth: false }),
    removeFromWishlist: (id) => api.delete(`/wishlist/${id}/`, { requireAuth: false }),
};

// ─── Orders ──────────────────────────────────
export const ordersAPI = {
    createOrder: (data) => api.post('/orders/create/', data),
    verifyPayment: (data) => api.post('/orders/verify-payment/', data),
    markPaymentFailed: (data) => api.post('/orders/payment-failed/', data),
    getOrders: () => api.get('/orders/', { requireAuth: true }),
    getOrder: (id) => api.get(`/orders/${id}/`, { requireAuth: true }),
    cancelOrder: (id) => api.post(`/orders/${id}/cancel/`),
    getOrderPayments: (id) => api.get(`/orders/${id}/payments/`, { requireAuth: true }),
};

export default api;
