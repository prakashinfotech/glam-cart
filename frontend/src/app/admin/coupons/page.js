'use client'

import { useEffect, useState } from 'react'
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiX } from 'react-icons/fi'
import { adminGetCoupons, adminCreateCoupon, adminUpdateCoupon, adminDeleteCoupon, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

const EMPTY_FORM = {
  code: '', type: 'PERCENT', value: '', minOrder: '',
  maxDiscount: '', usageLimit: '', expiresAt: '',
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // { id, code }

  const load = () => {
    setLoading(true)
    adminGetCoupons()
      .then((r) => setCoupons(r.data.coupons || r.data))
      .catch((e) => toast.error(getApiError(e)))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (c) => {
    setEditing(c)
    setForm({
      code: c.code, type: c.type, value: c.value,
      minOrder: c.minOrder || '', maxDiscount: c.maxDiscount || '',
      usageLimit: c.usageLimit || '', expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.code.trim() || !form.value) { toast.error('Code and value are required'); return }
    setSaving(true)
    const payload = {
      ...form,
      code: form.code.toUpperCase().trim(),
      value: parseFloat(form.value),
      minOrder: form.minOrder ? parseFloat(form.minOrder) : 0,
      maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    }
    try {
      if (editing) { await adminUpdateCoupon(editing.id, payload); toast.success('Coupon updated') }
      else { await adminCreateCoupon(payload); toast.success('Coupon created') }
      setShowModal(false); load()
    } catch (e) { toast.error(getApiError(e)) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try { await adminDeleteCoupon(confirmDelete.id); toast.success('Coupon deleted'); load() }
    catch (e) { toast.error(getApiError(e)) }
    finally { setConfirmDelete(null) }
  }

  const filtered = search ? coupons.filter((c) => c.code.includes(search.toUpperCase())) : coupons

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Coupons</h1>
          <p className="text-sm text-gray-400 mt-0.5">{coupons.length} total coupons</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-glamcart-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-glamcart-primary-dark transition-colors shadow-sm">
          <FiPlus size={16} /> Add Coupon
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-glamcart-primary bg-white shadow-sm uppercase"
          placeholder="Search by coupon code..."
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <FiX size={15} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50 p-4 space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="px-5 py-3.5 text-left">Code</th>
                <th className="px-5 py-3.5 text-left">Type</th>
                <th className="px-5 py-3.5 text-right">Discount</th>
                <th className="px-5 py-3.5 text-right">Min Order</th>
                <th className="px-5 py-3.5 text-right">Used / Limit</th>
                <th className="px-5 py-3.5 text-center">Expires</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-14 text-gray-400 text-sm">
                  {search ? `No coupons matching "${search}"` : 'No coupons yet'}
                </td></tr>
              )}
              {filtered.map((c) => {
                const expired = c.expiresAt && new Date(c.expiresAt) < new Date()
                const exhausted = c.usageLimit && c.usedCount >= c.usageLimit
                const active = c.isActive && !expired && !exhausted
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-glamcart-primary font-mono tracking-wide">{c.code}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                        {c.type === 'PERCENT' ? 'Percentage' : 'Flat'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-700">
                      {c.type === 'PERCENT' ? `${c.value}%` : `₹${c.value}`}
                      {c.maxDiscount ? <span className="text-xs text-gray-400 font-normal ml-1">up to ₹{c.maxDiscount}</span> : null}
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-500">
                      {c.minOrder ? `₹${c.minOrder}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-medium ${exhausted ? 'text-red-500' : 'text-gray-600'}`}>
                        {c.usedCount}
                      </span>
                      <span className="text-gray-400"> / {c.usageLimit || '∞'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-gray-500 text-xs">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        active ? 'bg-green-100 text-green-600'
                        : expired ? 'bg-red-100 text-red-500'
                        : exhausted ? 'bg-orange-100 text-orange-500'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                        {active ? 'Active' : expired ? 'Expired' : exhausted ? 'Exhausted' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(c)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                          title="Edit">
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={() => setConfirmDelete({ id: c.id, code: c.code })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                          title="Delete">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Coupon"
        message={`Are you sure you want to delete "${confirmDelete?.code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Coupon' : 'Add Coupon'}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl transition-colors">×</button>
            </div>
            <div className="p-6 space-y-4">
              <input className="input-field uppercase font-mono" placeholder="Coupon code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="PERCENT">Percentage (%)</option>
                <option value="FLAT">Fixed Amount (₹)</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder={form.type === 'PERCENT' ? 'Discount % *' : 'Discount ₹ *'} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                <input className="input-field" placeholder="Min order (₹)" type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field" placeholder="Max discount (₹)" type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} />
                <input className="input-field" placeholder="Usage limit" type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
              </div>
              <input className="input-field" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-300 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-glamcart-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-glamcart-primary-dark transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Coupon' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
