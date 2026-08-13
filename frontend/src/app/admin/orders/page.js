'use client'

import { useEffect, useState, useCallback } from 'react'
import { FiSearch, FiX, FiChevronDown, FiChevronUp, FiCalendar } from 'react-icons/fi'
import { adminGetOrders, adminUpdateOrder, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED']

const STATUS_COLORS = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  SHIPPED:   'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  PAID:      'bg-green-100 text-green-700',
  FAILED:    'bg-red-100 text-red-600',
  REFUNDED:  'bg-gray-100 text-gray-600',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const PAGE_SIZE = 15

  const hasDateFilter = dateFrom || dateTo

  const clearDates = () => { setDateFrom(''); setDateTo(''); setPage(1) }

  const load = useCallback(() => {
    setLoading(true)
    adminGetOrders({
      page, limit: PAGE_SIZE,
      status: statusFilter || undefined,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then((r) => { setOrders(r.data.orders); setTotal(r.data.total) })
      .catch((e) => toast.error(getApiError(e)))
      .finally(() => setLoading(false))
  }, [page, statusFilter, search, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, field, value) => {
    try { await adminUpdateOrder(id, { [field]: value }); toast.success('Order updated'); load() }
    catch (e) { toast.error(getApiError(e)) }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total orders</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-glamcart-primary bg-white shadow-sm"
          placeholder="Search by order #, name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        {search && (
          <button onClick={() => { setSearch(''); setPage(1) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <FiX size={15} />
          </button>
        )}
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <FiCalendar size={14} className="text-gray-400 shrink-0" />
          <span className="text-xs text-gray-400 font-medium">From</span>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="text-sm text-gray-700 bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <FiCalendar size={14} className="text-gray-400 shrink-0" />
          <span className="text-xs text-gray-400 font-medium">To</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="text-sm text-gray-700 bg-transparent focus:outline-none"
          />
        </div>
        {hasDateFilter && (
          <button
            onClick={clearDates}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors font-medium"
          >
            <FiX size={13} /> Clear dates
          </button>
        )}
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {['', ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              statusFilter === s
                ? 'bg-glamcart-primary text-white border-glamcart-primary shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-glamcart-primary hover:text-glamcart-primary'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50 p-4 space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="px-5 py-3.5 text-left">Order</th>
                <th className="px-5 py-3.5 text-left">Customer</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-center">Order Status</th>
                <th className="px-5 py-3.5 text-center">Payment</th>
                <th className="px-5 py-3.5 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length === 0 && (
                <tr><td colSpan={6} className="text-center py-14 text-gray-400 text-sm">No orders found</td></tr>
              )}
              {orders.map((o) => (
                <>
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-700">#{o.id}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-700">{o.user?.name || '—'}</div>
                      <div className="text-xs text-gray-400">{o.user?.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-gray-700">
                      ₹{Number(o.total).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, 'status', e.target.value)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold cursor-pointer border-0 outline-none ${STATUS_COLORS[o.status]}`}
                      >
                        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <select
                        value={o.paymentStatus}
                        onChange={(e) => updateStatus(o.id, 'paymentStatus', e.target.value)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold cursor-pointer border-0 outline-none ${STATUS_COLORS[o.paymentStatus]}`}
                      >
                        {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors mx-auto"
                        title="View items"
                      >
                        {expanded === o.id ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                      </button>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr key={`${o.id}-items`}>
                      <td colSpan={6} className="bg-gray-50 px-6 pb-4 pt-2">
                        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                          {o.items?.map((item, i) => (
                            <div key={item.id} className={`flex justify-between items-center px-4 py-2.5 text-sm ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                              <span className="text-gray-700 font-medium">{item.product?.name} <span className="text-gray-400 font-normal">× {item.quantity}</span></span>
                              <span className="font-semibold text-gray-700">₹{Number(item.price * item.quantity).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-glamcart-primary transition-colors">
            ← Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-glamcart-primary transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
