'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOrders } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FiPackage, FiChevronRight } from 'react-icons/fi';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getOrders()
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Please login to view orders</h2>
      <Link href="/login" className="btn-primary">Login</Link>
    </div>
  );

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 animate-pulse rounded-lg" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-glamcart-dark mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <FiPackage size={64} className="mx-auto text-glamcart-border mb-4" />
          <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
          <p className="text-glamcart-gray mb-6">Start shopping to see your orders here</p>
          <Link href="/products" className="btn-primary">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="card p-5 hover:border-glamcart-primary transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-glamcart-dark">Order #{order.id}</p>
                    <p className="text-xs text-glamcart-gray mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                    <FiChevronRight className="text-glamcart-gray" />
                  </div>
                </div>

                {/* Order items preview */}
                <div className="flex gap-2 mb-3">
                  {order.items.slice(0, 4).map((item) => {
                    const images = Array.isArray(item.product.images) ? item.product.images : [];
                    return (
                      <img
                        key={item.id}
                        src={images[0] || ''}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded bg-glamcart-light-gray"
                      />
                    );
                  })}
                  {order.items.length > 4 && (
                    <div className="w-12 h-12 rounded bg-glamcart-light-gray flex items-center justify-center text-xs text-glamcart-gray font-medium">
                      +{order.items.length - 4}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-glamcart-gray">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                  <span className="font-bold text-glamcart-primary">₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
