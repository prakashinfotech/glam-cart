'use client'

import { useEffect, useState, useCallback } from 'react'
import { FiSearch, FiX, FiShield, FiShieldOff } from 'react-icons/fi'
import { adminGetUsers, adminUpdateUserRole, getApiError } from '@/lib/api'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [confirmRole, setConfirmRole] = useState(null) // { user, newRole }
  const PAGE_SIZE = 15

  const load = useCallback(() => {
    setLoading(true)
    adminGetUsers({ page, limit: PAGE_SIZE, search })
      .then((r) => { setUsers(r.data.users); setTotal(r.data.total) })
      .catch((e) => toast.error(getApiError(e)))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])

  const toggleRole = (u) => {
    setConfirmRole({ user: u, newRole: u.role === 'ADMIN' ? 'USER' : 'ADMIN' })
  }

  const handleRoleConfirm = async () => {
    if (!confirmRole) return
    try {
      await adminUpdateUserRole(confirmRole.user.id, confirmRole.newRole)
      toast.success(`Role updated to ${confirmRole.newRole}`)
      load()
    } catch (e) { toast.error(getApiError(e)) }
    finally { setConfirmRole(null) }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} registered users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-glamcart-primary bg-white shadow-sm"
          placeholder="Search by name or email..."
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50 p-4 space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                <th className="px-5 py-3.5 text-left">User</th>
                <th className="px-5 py-3.5 text-left">Email</th>
                <th className="px-5 py-3.5 text-left">Phone</th>
                <th className="px-5 py-3.5 text-center">Role</th>
                <th className="px-5 py-3.5 text-center">Joined</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 && (
                <tr><td colSpan={6} className="text-center py-14 text-gray-400 text-sm">No users found</td></tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-glamcart-primary-pale text-glamcart-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {(u.name || u.email)[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-700">{u.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3.5 text-gray-500">{u.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      u.role === 'ADMIN' ? 'bg-glamcart-primary-pale text-glamcart-primary' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => toggleRole(u)}
                      title={u.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors mx-auto ${
                        u.role === 'ADMIN'
                          ? 'bg-red-50 text-red-400 hover:bg-red-100'
                          : 'bg-green-50 text-green-500 hover:bg-green-100'
                      }`}
                    >
                      {u.role === 'ADMIN' ? <FiShieldOff size={15} /> : <FiShield size={15} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <ConfirmDialog
        open={!!confirmRole}
        title={confirmRole?.newRole === 'ADMIN' ? 'Grant Admin Access' : 'Remove Admin Access'}
        message={`Change ${confirmRole?.user?.email} role to ${confirmRole?.newRole}?`}
        confirmLabel="Confirm"
        danger={confirmRole?.newRole !== 'ADMIN'}
        onConfirm={handleRoleConfirm}
        onCancel={() => setConfirmRole(null)}
      />

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
