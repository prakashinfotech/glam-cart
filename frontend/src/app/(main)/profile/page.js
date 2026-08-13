'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/lib/api';
import { FiUser, FiPackage, FiHeart, FiMapPin, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, signIn } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone || '' });
  }, [user]);

  if (!user) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Please login to view profile</h2>
      <Link href="/login" className="btn-primary">Login</Link>
    </div>
  );

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) { toast.error('Name must be at least 2 characters'); return; }
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) { toast.error('Phone number must be 10 digits'); return; }
    setLoading(true);
    try {
      const res = await updateProfile({ name: form.name.trim(), phone: form.phone.trim() || undefined });
      signIn({ ...user, ...res.data }, localStorage.getItem('glamcart_token'));
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const QUICK_LINKS = [
    { icon: FiPackage, label: 'My Orders', href: '/orders', desc: 'Track and manage orders' },
    { icon: FiHeart, label: 'Wishlist', href: '/wishlist', desc: 'Saved products' },
    { icon: FiMapPin, label: 'Addresses', href: '/checkout', desc: 'Manage delivery addresses' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-glamcart-dark mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="md:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-glamcart-primary text-white flex items-center justify-center text-2xl font-bold">
                  {user.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-glamcart-dark">{user.name}</h2>
                  <p className="text-sm text-glamcart-gray">{user.email}</p>
                </div>
              </div>
              <button onClick={() => setEditing(!editing)} className="flex items-center gap-1 text-glamcart-primary text-sm hover:underline">
                <FiEdit2 size={14} /> Edit
              </button>
            </div>

            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-glamcart-dark mb-1">Full Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-glamcart-dark mb-1">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving...' : 'Save Changes'}</button>
                  <button type="button" onClick={() => setEditing(false)} className="btn-outline">Cancel</button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {[['Email', user.email], ['Phone', user.phone || 'Not added'], ['Member since', new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })]].map(([label, value]) => (
                  <div key={label} className="flex">
                    <span className="w-36 text-sm text-glamcart-gray">{label}</span>
                    <span className="text-sm font-medium text-glamcart-dark">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          {QUICK_LINKS.map(({ icon: Icon, label, href, desc }) => (
            <Link key={href} href={href}>
              <div className="card p-4 flex items-center gap-3 hover:border-glamcart-primary transition-colors">
                <div className="w-10 h-10 rounded-full bg-glamcart-primary-light flex items-center justify-center text-glamcart-primary">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm text-glamcart-dark">{label}</p>
                  <p className="text-xs text-glamcart-gray">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
