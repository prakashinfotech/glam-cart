'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '@/lib/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const res = await getCart();
      setCart(res.data);
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    if (user) fetchCart();
    else setCart([]);
  }, [user, fetchCart]);

  const addItem = async (productId, quantity = 1, opts = {}) => {
    if (!user) { toast.error('Please login to add items to cart'); return; }
    setLoading(true);
    try {
      await addToCart(productId, quantity, opts);
      await fetchCart();
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (productId, quantity) => {
    setLoading(true);
    try {
      await updateCartItem(productId, quantity);
      await fetchCart();
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    setLoading(true);
    try {
      await removeFromCart(productId);
      await fetchCart();
      toast.success('Removed from cart');
    } finally {
      setLoading(false);
    }
  };

  const emptyCart = async () => {
    await clearCart();
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, cartCount, cartTotal, loading, addItem, updateItem, removeItem, emptyCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
