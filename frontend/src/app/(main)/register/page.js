'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_CHAR_RE = /[!@#$%^&*()\-_=+\[\]{};:",.<>/?\\|`~]/;

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (form.name.trim().length < 2) { toast.error('Name must be at least 2 characters'); return false; }
    if (!EMAIL_RE.test(form.email.trim())) { toast.error('Please enter a valid email address'); return false; }
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) { toast.error('Phone number must be 10 digits'); return false; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return false; }
    if (!SPECIAL_CHAR_RE.test(form.password)) { toast.error('Password must contain at least one special character (e.g. @, #, $)'); return false; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined, password: form.password });
      signIn(res.data.user, res.data.token);
      toast.success('Account created! Welcome to GlamCart 🎉');
      router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-glamcart-primary-pale py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Link href="/"><span className="text-4xl font-black text-glamcart-primary">GlamCart</span></Link>
          <p className="text-glamcart-gray mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Jane Doe', required: true },
            { id: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
            { id: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: '9876543210', required: false },
          ].map(({ id, label, type, placeholder, required }) => (
            <div key={id}>
              <label className="block text-sm font-medium text-glamcart-dark mb-1">{label}</label>
              <input
                type={type}
                required={required}
                placeholder={placeholder}
                value={form[id]}
                onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                className="input-field"
              />
            </div>
          ))}

          {['password', 'confirmPassword'].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-glamcart-dark mb-1">
                {field === 'password' ? 'Password' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="input-field pr-12"
                />
                {field === 'password' && (
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-glamcart-gray">
                    {showPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                )}
              </div>
              {field === 'password' && (
                <p className="text-xs text-glamcart-gray mt-1">Min. 8 characters with at least one special character (e.g. @, #, $)</p>
              )}
            </div>
          ))}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-glamcart-gray mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-glamcart-primary font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
