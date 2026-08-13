'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrder } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FiCheck, FiPackage, FiTruck, FiMapPin } from 'react-icons/fi';

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getOrder(id).then((res) => setOrder(res.data)).finally(() => setLoading(false));
  }, [id, user]);

  if (!user) return <div className="text-center py-20"><Link href="/login" className="btn-primary">Login</Link></div>;
  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="h-96 bg-gray-200 animate-pulse rounded-lg" /></div>;
  if (!order) return <div className="text-center py-20 text-glamcart-gray">Order not found</div>;

  const stepIdx = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-glamcart-dark">Order #{order.id}</h1>
        <Link href="/orders" className="text-glamcart-primary text-sm hover:underline">← All Orders</Link>
      </div>

      {/* Status tracker */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-glamcart-dark mb-6">Order Status</h2>
        <div className="flex items-center">
          {STATUS_STEPS.map((s, i) => {
            const done = i < stepIdx
            const active = i === stepIdx
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                {/* Step */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    done    ? 'bg-green-500 border-green-500 text-white' :
                    active  ? 'bg-glamcart-primary border-glamcart-primary text-white' :
                              'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {done ? <FiCheck size={16} /> : i + 1}
                  </div>
                  <span className={`mt-2 text-xs font-semibold whitespace-nowrap ${
                    done ? 'text-green-500' : active ? 'text-glamcart-primary' : 'text-gray-400'
                  }`}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </span>
                </div>
                {/* Connector line */}
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < stepIdx ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 card p-6">
          <h2 className="font-semibold text-glamcart-dark mb-4">Items Ordered</h2>
          <div className="space-y-4">
            {order.items.map((item) => {
              const images = Array.isArray(item.product.images) ? item.product.images : [];
              return (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-glamcart-border last:border-0 last:pb-0">
                  <img src={images[0] || ''} alt="" className="w-16 h-16 object-cover rounded bg-glamcart-light-gray flex-shrink-0" />
                  <div className="flex-1">
                    <Link href={`/products/${item.product.slug}`} className="font-medium hover:text-glamcart-primary">{item.product.name}</Link>
                    <p className="text-xs text-glamcart-gray mt-1">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                  </div>
                  <p className="font-semibold text-glamcart-primary">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {/* Price */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Price Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-glamcart-gray">Subtotal</span><span>₹{order.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-glamcart-gray">Delivery</span><span className={order.deliveryCharge === 0 ? 'text-green-600' : ''}>{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount}</span></div>}
              <hr className="border-glamcart-border" />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-glamcart-primary">₹{order.total.toLocaleString()}</span></div>
            </div>
            <p className="text-xs text-glamcart-gray mt-3">Payment: {order.paymentMethod}</p>
          </div>

          {/* Address */}
          {order.address && (
            <div className="card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><FiMapPin size={14} /> Delivery Address</h3>
              <div className="text-sm text-glamcart-gray">
                <p className="font-medium text-glamcart-dark">{order.address.name}</p>
                <p>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}</p>
                <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                <p className="mt-1">📞 {order.address.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
