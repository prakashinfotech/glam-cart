'use client'

import { useEffect, useState } from 'react'
import { adminGetStats, getApiError } from '@/lib/api'
import { MdPeople, MdShoppingBag, MdReceipt, MdAttachMoney } from 'react-icons/md'

const STAT_CONFIG = [
  { key: 'users',    label: 'Total Users',    icon: MdPeople,      color: 'bg-blue-50 text-blue-500' },
  { key: 'products', label: 'Active Products', icon: MdShoppingBag, color: 'bg-purple-50 text-purple-500' },
  { key: 'orders',   label: 'Total Orders',   icon: MdReceipt,     color: 'bg-orange-50 text-orange-500' },
  { key: 'revenue',  label: 'Revenue',        icon: MdAttachMoney, color: 'bg-green-50 text-green-500', currency: true },
]

const STATUS_COLORS = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  SHIPPED:   'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminGetStats()
      .then((r) => setStats(r.data))
      .catch((e) => setError(getApiError(e)))
  }, [])

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-5 text-sm">{error}</div>
  )

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {STAT_CONFIG.map(({ key, label, icon: Icon, color, currency }) => (
          <div key={key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 font-medium">{label}</p>
              {stats ? (
                <p className="text-2xl font-bold text-gray-800 mt-0.5">
                  {currency
                    ? `₹${Number(stats[key] || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                    : stats[key]}
                </p>
              ) : (
                <div className="h-7 w-20 bg-gray-100 rounded animate-pulse mt-1" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Recent Orders</h2>
          <span className="text-xs text-gray-400">Last 5</span>
        </div>

        {!stats ? (
          <div className="divide-y">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 mx-4 my-2 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stats.recentOrders?.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">No orders yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Order</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-gray-700">#{o.id}</td>
                  <td className="px-6 py-3.5 text-gray-500">{o.user?.name || o.user?.email}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-gray-700">
                    ₹{Number(o.total).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-500'}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
