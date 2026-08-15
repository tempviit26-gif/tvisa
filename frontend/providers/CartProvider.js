'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext({
    isCartOpen: false,
    openCart: () => { },
    closeCart: () => { },
    toggleCart: () => { },
});

export function CartProvider({ children }) {
    const [isCartOpen, setIsCartOpen] = useState(false);

    const openCart = useCallback(() => setIsCartOpen(true), []);
    const closeCart = useCallback(() => setIsCartOpen(false), []);
    const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

    return (
        <CartContext.Provider value={{ isCartOpen, openCart, closeCart, toggleCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
