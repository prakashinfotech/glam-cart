'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  MdDashboard, MdShoppingBag, MdReceipt,
  MdLocalOffer, MdPeople, MdLogout
} from 'react-icons/md'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: MdDashboard },
  { href: '/admin/products', label: 'Products', icon: MdShoppingBag },
  { href: '/admin/orders', label: 'Orders', icon: MdReceipt },
  { href: '/admin/coupons', label: 'Coupons', icon: MdLocalOffer },
  { href: '/admin/users', label: 'Users', icon: MdPeople },
]

export default function AdminLayout({ children }) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (!loading && !isLoginPage && (!user || user.role !== 'ADMIN')) {
      router.replace('/admin/login')
    }
  }, [user, loading, router, isLoginPage])

  if (isLoginPage) return <>{children}</>

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-glamcart-primary border-t-transparent" />
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') return null

  return (
    <div className="min-h-screen flex bg-[#f4f6fb]">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col fixed h-full bg-white shadow-md z-10">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="text-xl font-bold text-glamcart-primary tracking-tight">GlamCart</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mt-0.5">Admin Portal</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-glamcart-primary text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-glamcart-primary-pale flex items-center justify-center text-glamcart-primary font-bold text-sm">
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{user.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => { signOut(); router.replace('/admin/login') }}
            className="flex items-center gap-2 w-full px-4 py-2 text-xs text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <MdLogout size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-60 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shadow-sm">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
            {NAV.find((n) => n.href === pathname)?.label || 'Admin'}
          </h2>
          <span className="text-xs bg-glamcart-primary-pale text-glamcart-primary px-3 py-1 rounded-full font-semibold">
            Admin
          </span>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
