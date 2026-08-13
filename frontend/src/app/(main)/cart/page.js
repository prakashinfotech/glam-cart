'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getCoupons, validateCoupon } from '@/lib/api';
import { FiTrash2, FiShoppingBag, FiTag, FiGift, FiChevronDown, FiChevronUp, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const STATIC_COUPONS = [
  { code: 'GLAMCART10', type: 'PERCENT', value: 10, minOrder: 500,  maxDiscount: 200, desc: '10% off up to ₹200' },
  { code: 'FIRST50',    type: 'FLAT',    value: 50, minOrder: 299,  maxDiscount: 50,  desc: '₹50 flat off'      },
  { code: 'BEAUTY20',   type: 'PERCENT', value: 20, minOrder: 799,  maxDiscount: 300, desc: '20% off up to ₹300'},
  { code: 'SKINCARE15', type: 'PERCENT', value: 15, minOrder: 599,  maxDiscount: 250, desc: '15% off up to ₹250'},
  { code: 'FREESHIP',   type: 'FLAT',    value: 49, minOrder: 0,    maxDiscount: 49,  desc: '₹49 off (free delivery)' },
  { code: 'MEGA30',     type: 'PERCENT', value: 30, minOrder: 1499, maxDiscount: 500, desc: '30% off up to ₹500'},
];

export default function CartPage() {
  const { cart, cartTotal, updateItem, removeItem, loading } = useCart();
  const { user } = useAuth();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState(STATIC_COUPONS);
  const [showCoupons, setShowCoupons] = useState(false);

  useEffect(() => {
    getCoupons()
      .then((res) => {
        if (res.data?.length) {
          const merged = res.data.map((c) => ({
            ...c,
            desc: c.type === 'PERCENT'
              ? `${c.value}% off${c.maxDiscount ? ` up to ₹${c.maxDiscount}` : ''}`
              : `₹${c.value} flat off`,
          }));
          setAvailableCoupons(merged);
        }
      })
      .catch(() => {});
  }, []);

  // Reset coupon when cart total changes — the saved discount amount is stale
  useEffect(() => {
    if (couponApplied) {
      setDiscount(0);
      setCouponApplied('');
      setCoupon('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartTotal]);

  const deliveryCharge = cartTotal >= 499 ? 0 : 49;
  const finalTotal = cartTotal + deliveryCharge - discount;

  const applyCouponCode = async (code) => {
    if (couponApplied === code) return;
    setCouponLoading(true);
    try {
      const res = await validateCoupon(code, cartTotal);
      setDiscount(res.data.discount);
      setCouponApplied(code);
      setCoupon(code);
      toast.success(`Coupon ${code} applied! ₹${res.data.discount} off`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Coupon not applicable');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    await applyCouponCode(coupon.trim().toUpperCase());
  };

  const removeCoupon = () => {
    setCoupon('');
    setDiscount(0);
    setCouponApplied('');
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <FiShoppingBag size={64} className="mx-auto text-glamcart-border mb-4" />
        <h2 className="text-2xl font-bold mb-2">Please login to view your bag</h2>
        <p className="text-glamcart-gray mb-6">Sign in to access your saved items</p>
        <Link href="/login" className="btn-primary">Login</Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-8xl mb-4">🛍️</div>
        <h2 className="text-2xl font-bold mb-2">Your bag is empty</h2>
        <p className="text-glamcart-gray mb-6">Add some products to get started!</p>
        <Link href="/products" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-glamcart-dark mb-6">My Bag ({cart.length} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const images = Array.isArray(item.product.images) ? item.product.images : [];
            const img = images[0] || `https://via.placeholder.com/100x100?text=${encodeURIComponent(item.product.name)}`;

            return (
              <div key={item.id} className="card p-4 flex gap-4">
                <Link href={`/products/${item.product.slug}`}>
                  <img src={img} alt={item.product.name} className="w-24 h-24 object-cover rounded-lg bg-glamcart-light-gray flex-shrink-0" />
                </Link>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-glamcart-gray">{item.product.brand?.name}</p>
                  <Link href={`/products/${item.product.slug}`}>
                    <h3 className="font-medium text-glamcart-dark line-clamp-2 hover:text-glamcart-primary transition-colors">
                      {item.product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity */}
                    <div className="flex items-center border border-glamcart-border rounded">
                      <button
                        onClick={() => updateItem(item.product.id, item.quantity - 1)}
                        disabled={loading}
                        className="px-2 py-1 hover:bg-glamcart-light-gray text-lg font-bold"
                      >−</button>
                      <span className="px-3 py-1 font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.product.id, item.quantity + 1)}
                        disabled={loading || item.quantity >= item.product.stock}
                        className="px-2 py-1 hover:bg-glamcart-light-gray text-lg font-bold"
                      >+</button>
                    </div>

                    {/* Price & remove */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-glamcart-primary">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-glamcart-gray">₹{item.product.price.toLocaleString()} each</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-glamcart-dark mb-4">Order Summary</h2>

            {/* Coupon */}
            <div className="mb-4">
              {/* Input row */}
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <FiTag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-glamcart-gray" />
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value.toUpperCase()); if (couponApplied) removeCoupon(); }}
                    className="input-field py-2 pl-8 text-sm w-full font-mono tracking-wider"
                    disabled={!!couponApplied}
                  />
                </div>
                {couponApplied ? (
                  <button onClick={removeCoupon} className="px-3 py-2 rounded text-sm font-semibold border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 whitespace-nowrap">
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !coupon.trim()}
                    className="px-4 py-2 rounded text-sm font-bold bg-glamcart-primary text-white hover:bg-glamcart-primary-dark disabled:opacity-50 whitespace-nowrap"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                )}
              </div>

              {/* Applied confirmation */}
              {couponApplied && (
                <div className="flex items-center gap-1.5 text-green-600 text-xs mb-2 bg-green-50 border border-green-200 rounded px-2 py-1.5">
                  <FiCheck size={13} />
                  <span><strong>{couponApplied}</strong> applied — you save ₹{discount}!</span>
                </div>
              )}

              {/* Collapsible coupon list */}
              <button
                onClick={() => setShowCoupons(!showCoupons)}
                className="w-full flex items-center justify-between text-xs text-glamcart-primary font-semibold py-1.5 hover:opacity-80"
              >
                <span className="flex items-center gap-1">
                  <FiGift size={12} /> View available coupons ({availableCoupons.length})
                </span>
                {showCoupons ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
              </button>

              {showCoupons && (
                <div className="mt-1 border border-glamcart-border rounded-lg overflow-hidden">
                  {availableCoupons.map((c, i) => {
                    const isApplied = couponApplied === c.code;
                    return (
                      <div
                        key={c.code}
                        className={`flex items-center gap-3 px-3 py-2.5 ${i !== 0 ? 'border-t border-glamcart-border' : ''} ${isApplied ? 'bg-green-50' : 'bg-white hover:bg-glamcart-primary-pale'}`}
                      >
                        {/* Code + desc */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-black tracking-wider ${isApplied ? 'text-green-600' : 'text-glamcart-dark'}`}>
                            {c.code}
                          </p>
                          <p className="text-xs text-glamcart-gray leading-tight mt-0.5">{c.desc}</p>
                          {c.minOrder > 0 && (
                            <p className="text-xs text-glamcart-gray opacity-60">Min order ₹{c.minOrder}</p>
                          )}
                        </div>
                        {/* Apply / Applied */}
                        <button
                          onClick={() => isApplied ? removeCoupon() : applyCouponCode(c.code)}
                          disabled={couponLoading}
                          className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 transition-colors ${
                            isApplied
                              ? 'bg-green-100 text-green-600 border border-green-300'
                              : 'bg-glamcart-primary text-white hover:bg-glamcart-primary-dark'
                          }`}
                        >
                          {isApplied ? '✓ Applied' : 'Apply'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <hr className="border-glamcart-border mb-4" />

            {/* Price breakdown */}
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-glamcart-gray">Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-medium">₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-glamcart-gray">Delivery</span>
                <span className={deliveryCharge === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span>- ₹{discount}</span>
                </div>
              )}
            </div>

            <hr className="border-glamcart-border mb-4" />

            <div className="flex justify-between font-bold text-lg mb-6">
              <span>Total</span>
              <span className="text-glamcart-primary">₹{finalTotal.toLocaleString()}</span>
            </div>

            {cartTotal < 499 && (
              <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded mb-4 text-center">
                Add ₹{499 - cartTotal} more for free delivery!
              </p>
            )}

            <Link
              href={`/checkout${couponApplied ? `?coupon=${couponApplied}` : ''}`}
              className="btn-primary w-full block text-center"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
