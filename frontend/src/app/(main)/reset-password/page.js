'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { resetPassword } from '@/lib/api'
import { FiEye, FiEyeOff, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi'
import toast from 'react-hot-toast'

const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) router.replace('/login')
  }, [token, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!PASSWORD_RE.test(form.password)) {
      toast.error('Password must be 8+ chars with uppercase, number and special character')
      return
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, form.password)
      setSuccess(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset link is invalid or has expired')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return null

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-glamcart-primary-pale">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-4xl font-black text-glamcart-primary">GlamCart</span>
          </Link>
          <p className="text-glamcart-gray mt-2">Create a new password</p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle size={32} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-glamcart-dark mb-2">Password Changed!</h3>
            <p className="text-glamcart-gray text-sm mb-1">
              Your password has been changed successfully.
            </p>
            <p className="text-glamcart-gray text-sm mb-6">
              Please login again with your new password.
            </p>
            <Link href="/login" className="btn-primary w-full block text-center">
              Login with New Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <FiAlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>This link expires in 1 hour. Choose a strong password you haven&apos;t used before.</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-glamcart-dark mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  placeholder="Min 8 chars, uppercase, number, symbol"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-12"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-glamcart-gray hover:text-glamcart-dark">
                  {showPwd ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-glamcart-dark mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  placeholder="Re-enter your new password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="input-field pr-12"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-glamcart-gray hover:text-glamcart-dark">
                  {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {form.confirm && form.password !== form.confirm && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Updating...' : 'Update Password'}
            </button>

            <p className="text-center text-sm text-glamcart-gray">
              Remember your password?{' '}
              <Link href="/login" className="text-glamcart-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
