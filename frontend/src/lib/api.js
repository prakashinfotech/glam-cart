import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('glamcart_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('glamcart_token');
      localStorage.removeItem('glamcart_user');
    }
    return Promise.reject(err);
  }
);

export const getApiError = (err) => {
  if (!err.response) {
    if (err.code === 'ECONNABORTED') return 'Request timed out. Please try again.'
    if (typeof navigator !== 'undefined' && !navigator.onLine)
      return 'No internet connection. Please check your network.'
    return 'Server is unavailable. Please try again later.'
  }
  return err.response.data?.error || `Something went wrong (${err.response.status})`
}

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (slug) => api.get(`/products/${slug}`);

// Categories
export const getCategories = () => api.get('/categories');
export const getCategory = (slug) => api.get(`/categories/${slug}`);

// Brands
export const getBrands = () => api.get('/brands');

// Cart
export const getCart = () => api.get('/cart');
export const addToCart = (productId, quantity = 1, opts = {}) =>
  api.post('/cart', { productId, quantity, ...opts });
export const updateCartItem = (productId, quantity) =>
  api.patch(`/cart/${productId}`, { quantity });
export const removeFromCart = (productId) => api.delete(`/cart/${productId}`);
export const clearCart = () => api.delete('/cart');

// Wishlist
export const getWishlist = () => api.get('/wishlist');
export const addToWishlist = (productId) => api.post('/wishlist', { productId });
export const removeFromWishlist = (productId) => api.delete(`/wishlist/${productId}`);

// Orders
export const getOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const placeOrder = (data) => api.post('/orders', data);

// Users
export const getProfile = () => api.get('/users/profile');
export const updateProfile = (data) => api.patch('/users/profile', data);
export const getAddresses = () => api.get('/users/addresses');
export const addAddress = (data) => api.post('/users/addresses', data);
export const deleteAddress = (id) => api.delete(`/users/addresses/${id}`);

// Coupons
export const getCoupons = () => api.get('/coupons');
export const validateCoupon = (code, orderAmount) =>
  api.post('/coupons/validate', { code, orderAmount });

// Payments
export const createRazorpayOrder = (amount) => api.post('/payments/create-order', { amount });
export const verifyPayment = (data) => api.post('/payments/verify', data);

// Password Reset
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password })

// Admin
export const adminGetStats = () => api.get('/admin/stats');
export const adminGetProducts = (params) => api.get('/admin/products', { params });
export const adminCreateProduct = (data) => api.post('/admin/products', data);
export const adminUpdateProduct = (id, data) => api.put(`/admin/products/${id}`, data);
export const adminDeleteProduct = (id) => api.delete(`/admin/products/${id}`);
export const adminGetOrders = (params) => api.get('/admin/orders', { params });
export const adminUpdateOrder = (id, data) => api.patch(`/admin/orders/${id}`, data);
export const adminGetCoupons = () => api.get('/admin/coupons');
export const adminCreateCoupon = (data) => api.post('/admin/coupons', data);
export const adminUpdateCoupon = (id, data) => api.patch(`/admin/coupons/${id}`, data);
export const adminDeleteCoupon = (id) => api.delete(`/admin/coupons/${id}`);
export const adminGetUsers = (params) => api.get('/admin/users', { params });
export const adminUpdateUserRole = (id, role) => api.patch(`/admin/users/${id}/role`, { role });

export default api;
