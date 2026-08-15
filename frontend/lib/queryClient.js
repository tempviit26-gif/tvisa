import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                // Never retry on 401 (unauthorized) — prevents infinite loops
                if (error?.response?.status === 401) return false;
                return failureCount < 2;
            },
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
        },
    },
});

export default queryClient;

// Query keys
export const QUERY_KEYS = {
    products: ['products'],
    product: (id) => ['product', id],
    categories: ['categories'],
    categoryProducts: (slug) => ['categoryProducts', slug],
    subcategoryProducts: (slug) => ['subcategoryProducts', slug],
    cart: ['cart'],
    wishlist: ['wishlist'],
    orders: ['orders'],
    order: (id) => ['order', id],
    profile: ['profile'],
    addresses: ['addresses'],
};

