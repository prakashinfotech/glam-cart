'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { FiHeart, FiShoppingBag, FiStar } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { addToWishlist, removeFromWishlist } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);

  const images = (() => {
    return Array.isArray(product.images) ? product.images : [];
  })();

  const img = images[0] || '';

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to add to wishlist'); return; }
    try {
      if (wishlisted) {
        await removeFromWishlist(product.id);
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product.id);
        setWishlisted(true);
        toast.success('Added to wishlist!');
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    addItem(product.id, 1);
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="card group cursor-pointer overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-glamcart-light-gray">
          {!imgError && img ? (
            <img
              src={img}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-glamcart-primary-pale gap-2 group-hover:scale-105 transition-transform duration-300">
              <span className="text-4xl">🧴</span>
              <span className="text-xs text-glamcart-gray text-center px-2 line-clamp-2">{product.name}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isBestSeller && (
              <span className="bg-glamcart-primary text-white text-xs px-2 py-0.5 rounded font-semibold">Bestseller</span>
            )}
            {product.discount > 0 && (
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded font-semibold">{product.discount}% off</span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 ${
              wishlisted ? 'bg-glamcart-primary text-white' : 'bg-white text-glamcart-gray hover:text-glamcart-primary shadow'
            }`}
          >
            <FiHeart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Quick add to cart */}
          <button
            onClick={handleAddToCart}
            className="absolute bottom-0 left-0 right-0 bg-glamcart-primary text-white py-2 text-sm font-semibold translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex items-center justify-center gap-2"
          >
            <FiShoppingBag size={14} />
            Add to Bag
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-glamcart-gray mb-1">{product.brand?.name}</p>
          <h3 className="text-sm font-medium text-glamcart-dark line-clamp-2 mb-2">{product.name}</h3>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5 font-semibold">
                {product.rating} <FiStar size={9} fill="white" />
              </span>
              <span className="text-xs text-glamcart-gray">({product.reviewCount.toLocaleString()})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="price-tag text-base">₹{product.price.toLocaleString()}</span>
            {product.mrp > product.price && (
              <span className="mrp-tag">₹{product.mrp.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
