'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getAddresses, addAddress, placeOrder, createRazorpayOrder, verifyPayment, validateCoupon } from '@/lib/api';
import { FiTag } from 'react-icons/fi';
import { FiCheck, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'COD', label: 'Cash on Delivery', icon: '💵' },
  { id: 'UPI', label: 'UPI Payment', icon: '📱' },
  { id: 'CARD', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'NETBANKING', label: 'Net Banking', icon: '🏦' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart, cartTotal, emptyCart } = useCart();
  const { user } = useAuth();

  const couponCode = searchParams.get('coupon') || '';

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [newAddress, setNewAddress] = useState({
    name: user?.name || '', phone: user?.phone || '', line1: '', line2: '', city: '', state: '', pincode: '', type: 'HOME', isDefault: false
  });

  const deliveryCharge = cartTotal >= 499 ? 0 : 49;
  const finalTotal = cartTotal + deliveryCharge - discount;

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });

  const initiateRazorpayPayment = async () => {
    setPlacing(true);
    try {
      await loadRazorpayScript();
      const { data } = await createRazorpayOrder(finalTotal);

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'GlamCart',
        description: 'Order Payment',
        order_id: data.orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            const orderRes = await placeOrder({
              addressId: selectedAddress,
              paymentMethod,
              couponCode: couponCode || undefined,
              razorpayPaymentId: response.razorpay_payment_id,
            });
            await emptyCart();
            toast.success('Payment successful! Order placed 🎉');
            router.push(`/orders/${orderRes.data.id}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
            setPlacing(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#ff5c8d' },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            toast('Payment cancelled', { icon: '❌' });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initiate payment');
      setPlacing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    getAddresses().then((res) => {
      setAddresses(res.data);
      const def = res.data.find((a) => a.isDefault);
      if (def) setSelectedAddress(def.id);
    });
  }, [user]);

  useEffect(() => {
    if (!couponCode || !cartTotal) return;
    validateCoupon(couponCode, cartTotal)
      .then((res) => setDiscount(res.data.discount))
      .catch(() => setDiscount(0));
  }, [couponCode, cartTotal]);

  if (!user) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Please login to checkout</h2>
      <Link href="/login" className="btn-primary">Login</Link>
    </div>
  );

  if (cart.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
      <Link href="/products" className="btn-primary">Shop Now</Link>
    </div>
  );

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (newAddress.name.trim().length < 2) { toast.error('Name must be at least 2 characters'); return; }
    if (!/^\d{10}$/.test(newAddress.phone.trim())) { toast.error('Phone number must be 10 digits'); return; }
    if (!/^\d{6}$/.test(newAddress.pincode.trim())) { toast.error('Pincode must be 6 digits'); return; }
    try {
      const res = await addAddress(newAddress);
      setAddresses([...addresses, res.data]);
      setSelectedAddress(res.data.id);
      setShowAddAddress(false);
      toast.success('Address added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    if (paymentMethod !== 'COD') {
      await initiateRazorpayPayment();
      return;
    }
    setPlacing(true);
    try {
      const res = await placeOrder({ addressId: selectedAddress, paymentMethod, couponCode: couponCode || undefined });
      await emptyCart();
      toast.success('Order placed successfully! 🎉');
      router.push(`/orders/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const STEPS = ['Address', 'Payment', 'Review'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-glamcart-dark mb-6">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-glamcart-primary text-white' : 'bg-glamcart-border text-glamcart-gray'
            }`}>
              {step > i + 1 ? <FiCheck size={14} /> : i + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${step === i + 1 ? 'text-glamcart-primary' : 'text-glamcart-gray'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`w-16 h-0.5 mx-4 ${step > i + 1 ? 'bg-green-500' : 'bg-glamcart-border'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main form */}
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Delivery Address</h2>

              {addresses.map((addr) => (
                <label key={addr.id} className={`flex gap-3 p-4 border-2 rounded-lg mb-3 cursor-pointer transition-colors ${selectedAddress === addr.id ? 'border-glamcart-primary bg-glamcart-primary-pale' : 'border-glamcart-border hover:border-glamcart-primary'}`}>
                  <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1 accent-glamcart-primary" />
                  <div>
                    <p className="font-semibold">{addr.name} <span className="text-xs bg-glamcart-light-gray px-2 py-0.5 rounded ml-1">{addr.type}</span></p>
                    <p className="text-sm text-glamcart-gray mt-1">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                    <p className="text-sm text-glamcart-gray">{addr.city}, {addr.state} - {addr.pincode}</p>
                    <p className="text-sm text-glamcart-gray">📞 {addr.phone}</p>
                  </div>
                </label>
              ))}

              {showAddAddress ? (
                <form onSubmit={handleAddAddress} className="border-2 border-glamcart-primary rounded-lg p-4 mt-3">
                  <h3 className="font-semibold mb-3">Add New Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input required placeholder="Full Name" value={newAddress.name} onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })} className="input-field col-span-2" />
                    <input required placeholder="Phone (10 digits)" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="input-field" inputMode="numeric" maxLength={10} />
                    <select value={newAddress.type} onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })} className="input-field">
                      <option value="HOME">Home</option>
                      <option value="WORK">Work</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <input required placeholder="Address Line 1" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} className="input-field col-span-2" />
                    <input placeholder="Address Line 2 (optional)" value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} className="input-field col-span-2" />
                    <input required placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="input-field" />
                    <input required placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="input-field" />
                    <input required placeholder="Pincode (6 digits)" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} className="input-field" inputMode="numeric" maxLength={6} />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button type="submit" className="btn-primary">Save Address</button>
                    <button type="button" onClick={() => setShowAddAddress(false)} className="btn-outline">Cancel</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowAddAddress(true)} className="flex items-center gap-2 text-glamcart-primary font-semibold mt-2 hover:underline">
                  <FiPlus size={18} /> Add New Address
                </button>
              )}

              <button onClick={() => step === 1 && setStep(2)} disabled={!selectedAddress} className="btn-primary w-full mt-6">
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Payment Method</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label key={method.id} className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === method.id ? 'border-glamcart-primary bg-glamcart-primary-pale' : 'border-glamcart-border hover:border-glamcart-primary'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="accent-glamcart-primary" />
                    <span className="text-xl">{method.icon}</span>
                    <span className="font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">Review Order</button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Review Order</h2>
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item) => {
                  const images = Array.isArray(item.product.images) ? item.product.images : [];
                  return (
                    <div key={item.id} className="flex items-center gap-3 py-2 border-b border-glamcart-border last:border-0">
                      <img src={images[0] || ''} alt="" className="w-12 h-12 object-cover rounded bg-glamcart-light-gray" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-glamcart-gray">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-glamcart-primary">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-outline flex-1">Back</button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="btn-primary flex-1"
                >
                  {placing ? 'Placing Order...' : `Place Order — ₹${finalTotal.toLocaleString()}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="card p-6 h-fit sticky top-24">
          <h2 className="text-lg font-bold mb-4">Price Details</h2>
          <div className="space-y-3 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-glamcart-gray">Price ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-glamcart-gray">Delivery</span>
              <span className={deliveryCharge === 0 ? 'text-green-600 font-medium' : ''}>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center gap-1"><FiTag size={12} /> Coupon ({couponCode})</span>
                <span className="font-medium">− ₹{discount.toLocaleString()}</span>
              </div>
            )}
          </div>
          <hr className="border-glamcart-border mb-4" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-glamcart-primary">₹{finalTotal.toLocaleString()}</span>
          </div>
          {discount > 0 && (
            <p className="text-xs text-green-600 mt-2 text-center font-medium">
              You save ₹{discount.toLocaleString()} on this order!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
