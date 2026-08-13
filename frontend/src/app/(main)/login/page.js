'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { login, addToCart, forgotPassword } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { FiEye, FiEyeOff, FiX, FiMail } from 'react-icons/fi'
import toast from 'react-hot-toast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const { fetchCart } = useCart()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const redirect = searchParams.get('redirect') || '/'
  const addToCartId = searchParams.get('addToCart')
  const qty = parseInt(searchParams.get('qty') || '1', 10)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(form.email.trim())) { toast.error('Please enter a valid email address'); return }
    if (!form.password) { toast.error('Please enter your password'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const res = await login({ email: form.email.trim(), password: form.password })
      signIn(res.data.user, res.data.token)
      toast.success(`Welcome back, ${res.data.user.name}!`)

      if (addToCartId) {
        try {
          await addToCart(parseInt(addToCartId, 10), qty)
          await fetchCart()
          toast.success('Item added to your bag!')
        } catch {
          toast.error('Could not add item to bag. Please try again.')
        }
      }

      router.push(redirect)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(forgotEmail.trim())) { toast.error('Please enter a valid email address'); return }
    setForgotLoading(true)
    try {
      await forgotPassword(forgotEmail.trim())
      setForgotSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  const closeForgot = () => {
    setForgotOpen(false)
    setForgotEmail('')
    setForgotSent(false)
  }

  const fillDemo = () => setForm({ email: 'demo@glamcart.com', password: 'Demo@1234' })

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-glamcart-primary-pale">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-4xl font-black text-glamcart-primary">GlamCart</span>
          </Link>
          <p className="text-glamcart-gray mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-glamcart-dark mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-glamcart-dark mb-1">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field pr-12"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-glamcart-gray hover:text-glamcart-dark">
                {showPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            <div className="text-right mt-1.5">
              <button
                type="button"
                onClick={() => { setForgotEmail(form.email); setForgotOpen(true) }}
                className="text-xs text-glamcart-primary font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 p-3 bg-glamcart-primary-pale rounded-lg text-center">
          <p className="text-xs text-glamcart-gray mb-2">Try the demo account:</p>
          <button onClick={fillDemo} className="text-sm text-glamcart-primary font-semibold hover:underline">
            demo@glamcart.com / Demo@1234
          </button>
        </div>

        <p className="text-center text-sm text-glamcart-gray mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-glamcart-primary font-semibold hover:underline">Create one</Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-glamcart-dark">Reset Password</h3>
              <button onClick={closeForgot} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <div className="p-6">
              {forgotSent ? (
                <div className="text-center py-2">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiMail size={28} className="text-green-500" />
                  </div>
                  <h4 className="font-bold text-glamcart-dark text-lg mb-3">Reset link sent!</h4>
                  <p className="text-glamcart-gray text-sm mb-1">
                    A password reset link has been sent to
                  </p>
                  <p className="text-glamcart-primary font-semibold text-sm mb-4">{forgotEmail}</p>
                  <p className="text-glamcart-gray text-xs mb-6">
                    Please check your inbox and spam folder. The link expires in <strong>1 hour</strong>.
                  </p>
                  <button onClick={closeForgot} className="btn-primary w-full">
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <p className="text-glamcart-gray text-sm">
                    Enter your registered email address and we&apos;ll send you a link to reset your password.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-glamcart-dark mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <button type="submit" disabled={forgotLoading} className="btn-primary w-full">
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
