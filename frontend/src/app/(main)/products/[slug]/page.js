'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProduct, getProducts, addToWishlist, removeFromWishlist } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';
import { FiStar, FiHeart, FiShoppingBag, FiTruck, FiShield, FiRefreshCw, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    getProduct(slug)
      .then(async (res) => {
        setProduct(res.data);
        const related = await getProducts({ category: res.data.category?.slug, limit: 4 });
        setRelated(related.data.products.filter((p) => p.id !== res.data.id).slice(0, 4));
      })
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20 text-glamcart-gray">Product not found</div>;

  const images = Array.isArray(product.images) ? product.images : [];
  const img = images[selectedImg] || `https://via.placeholder.com/600x600?text=${encodeURIComponent(product.name)}`;

  const handleWishlist = async () => {
    if (!user) { router.push(`/login?redirect=/products/${slug}`); return; }
    try {
      if (wishlisted) { await removeFromWishlist(product.id); setWishlisted(false); toast.success('Removed from wishlist'); }
      else { await addToWishlist(product.id); setWishlisted(true); toast.success('Added to wishlist!'); }
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-glamcart-gray mb-6">
        <Link href="/" className="hover:text-glamcart-primary">Home</Link>
        <FiChevronRight size={14} />
        <Link href={`/products?category=${product.category?.slug}`} className="hover:text-glamcart-primary capitalize">
          {product.category?.name}
        </Link>
        <FiChevronRight size={14} />
        <span className="text-glamcart-dark truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-lg overflow-hidden bg-glamcart-light-gray mb-3">
            <img src={img} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={`w-16 h-16 rounded border-2 overflow-hidden ${i === selectedImg ? 'border-glamcart-primary' : 'border-glamcart-border'}`}
                >
                  <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <Link href={`/products?brand=${product.brand?.slug}`} className="text-glamcart-gray text-sm hover:text-glamcart-primary">
            {product.brand?.name}
          </Link>
          <h1 className="text-2xl font-bold text-glamcart-dark mt-1 mb-3">{product.name}</h1>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-green-600 text-white px-2 py-1 rounded text-sm font-semibold flex items-center gap-1">
                {product.rating} <FiStar size={12} fill="white" />
              </span>
              <span className="text-glamcart-gray text-sm">{product.reviewCount.toLocaleString()} reviews</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-glamcart-primary-pale rounded-lg">
            <span className="text-3xl font-black text-glamcart-primary">₹{product.price.toLocaleString()}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-lg text-glamcart-gray line-through">₹{product.mrp.toLocaleString()}</span>
                <span className="text-green-600 font-semibold">{product.discount}% off</span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="mb-4">
            {product.stock > 0 ? (
              <span className="text-green-600 text-sm font-medium">✓ In Stock ({product.stock} available)</span>
            ) : (
              <span className="text-red-500 text-sm font-medium">✗ Out of Stock</span>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium text-glamcart-dark">Quantity:</span>
            <div className="flex items-center border border-glamcart-border rounded">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-glamcart-light-gray transition-colors text-lg font-bold"
              >−</button>
              <span className="px-4 py-2 font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="px-3 py-2 hover:bg-glamcart-light-gray transition-colors text-lg font-bold"
              >+</button>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => {
                if (!user) {
                  router.push(`/login?redirect=/products/${slug}&addToCart=${product.id}&qty=${quantity}`);
                  return;
                }
                addItem(product.id, quantity);
              }}
              disabled={product.stock === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <FiShoppingBag size={18} />
              Add to Bag
            </button>
            <button
              onClick={handleWishlist}
              className={`w-12 h-12 rounded border-2 flex items-center justify-center transition-colors ${
                wishlisted ? 'border-glamcart-primary bg-glamcart-primary text-white' : 'border-glamcart-border hover:border-glamcart-primary hover:text-glamcart-primary'
              }`}
            >
              <FiHeart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-glamcart-light-gray rounded-lg">
            {[
              { icon: FiTruck, text: 'Free delivery above ₹499' },
              { icon: FiShield, text: '100% authentic' },
              { icon: FiRefreshCw, text: '15-day returns' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1 text-center">
                <Icon size={18} className="text-glamcart-primary" />
                <span className="text-xs text-glamcart-gray">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-10 border border-glamcart-border rounded-lg overflow-hidden">
        <div className="flex border-b border-glamcart-border">
          {['description', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab ? 'text-glamcart-primary border-b-2 border-glamcart-primary bg-glamcart-primary-pale' : 'text-glamcart-gray hover:text-glamcart-dark'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'description' && (
            <div>
              <p className="text-glamcart-dark leading-relaxed whitespace-pre-line">
                {product.description || 'No description available.'}
              </p>
              {product.tags && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.tags.split(',').map((tag) => (
                    <span key={tag} className="bg-glamcart-primary-light text-glamcart-primary text-xs px-3 py-1 rounded-full font-medium">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {product.reviews?.length === 0 ? (
                <p className="text-glamcart-gray text-center py-8">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {product.reviews?.map((review) => (
                    <div key={review.id} className="border border-glamcart-border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-glamcart-primary text-white flex items-center justify-center text-sm font-bold">
                          {review.user.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{review.user.name}</p>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} size={12} className={i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.title && <p className="font-semibold text-sm mb-1">{review.title}</p>}
                      {review.body && <p className="text-sm text-glamcart-gray">{review.body}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="section-title">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
