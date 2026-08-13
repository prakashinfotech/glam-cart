'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getWishlist, removeFromWishlist } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = () => {
    if (!user) return;
    getWishlist().then((res) => setWishlist(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchWishlist(); }, [user]);

  const handleRemove = async (productId) => {
    await removeFromWishlist(productId);
    setWishlist((prev) => prev.filter((i) => i.productId !== productId));
    toast.success('Removed from wishlist');
  };

  const handleMoveToCart = async (item) => {
    await addItem(item.productId, 1);
    await handleRemove(item.productId);
  };

  if (!user) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Please login to view wishlist</h2>
      <Link href="/login" className="btn-primary">Login</Link>
    </div>
  );

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-64 bg-gray-200 animate-pulse rounded-lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-glamcart-dark mb-6 flex items-center gap-2">
        <FiHeart className="text-glamcart-primary" /> My Wishlist ({wishlist.length})
      </h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-8xl mb-4">💝</div>
          <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
          <p className="text-glamcart-gray mb-6">Save your favorite products here</p>
          <Link href="/products" className="btn-primary">Explore Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.map((item) => {
            const images = Array.isArray(item.product.images) ? item.product.images : [];
            return (
              <div key={item.id} className="card overflow-hidden group">
                <Link href={`/products/${item.product.slug}`}>
                  <div className="aspect-[3/4] overflow-hidden bg-glamcart-light-gray">
                    <img src={images[0] || ''} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                </Link>
                <div className="p-3">
                  <p className="text-xs text-glamcart-gray">{item.product.brand?.name}</p>
                  <Link href={`/products/${item.product.slug}`}>
                    <h3 className="text-sm font-medium text-glamcart-dark line-clamp-2 hover:text-glamcart-primary mt-1">{item.product.name}</h3>
                  </Link>
                  <p className="price-tag mt-2">₹{item.product.price.toLocaleString()}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleMoveToCart(item)} className="btn-primary flex-1 py-2 text-xs">Add to Bag</button>
                    <button onClick={() => handleRemove(item.productId)} className="w-9 h-9 border border-red-300 text-red-400 hover:bg-red-50 rounded flex items-center justify-center">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
