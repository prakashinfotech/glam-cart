'use client'

import { useEffect, useState, useCallback } from 'react'
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiX, FiAlertCircle } from 'react-icons/fi'
import {
  adminGetProducts, adminCreateProduct, adminUpdateProduct,
  adminDeleteProduct, getCategories, getBrands, getApiError,
} from '@/lib/api'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

const EMPTY_FORM = {
  name: '', description: '', price: '', mrp: '', stock: '',
  categoryId: '', brandId: '', images: '', isFeatured: false, isBestSeller: false,
}

function validate(form) {
  const e = {}
  const name = form.name.trim()
  const price = parseFloat(form.price)
  const mrp = form.mrp !== '' && form.mrp !== undefined ? parseFloat(form.mrp) : null
  const stock = form.stock !== '' && form.stock !== undefined ? Number(form.stock) : null

  if (!name) e.name = 'Product name is required'
  else if (name.length < 3) e.name = 'Name must be at least 3 characters'
  else if (name.length > 120) e.name = 'Name must be under 120 characters'

  if (form.description && form.description.trim().length > 0 && form.description.trim().length < 10)
    e.description = 'Description must be at least 10 characters if provided'

  if (form.price === '' || form.price === null || form.price === undefined) e.price = 'Selling price is required'
  else if (isNaN(price) || price <= 0) e.price = 'Price must be greater than ₹0'
  else if (price > 999999) e.price = 'Price cannot exceed ₹9,99,999'

  if (mrp !== null) {
    if (isNaN(mrp) || mrp <= 0) e.mrp = 'MRP must be greater than ₹0'
    else if (!isNaN(price) && mrp < price) e.mrp = 'MRP must be ≥ selling price'
  }

  if (stock === null) e.stock = 'Stock quantity is required'
  else if (isNaN(stock) || stock < 0) e.stock = 'Stock cannot be negative'
  else if (!Number.isInteger(stock)) e.stock = 'Stock must be a whole number'
  else if (stock > 99999) e.stock = 'Stock cannot exceed 99,999 units'

  if (!form.categoryId) e.categoryId = 'Please select a category'
  if (!form.brandId) e.brandId = 'Please select a brand'

  if (form.images) {
    const urls = form.images.split(',').map((s) => s.trim()).filter(Boolean)
    const invalid = urls.some((u) => !u.startsWith('http'))
    if (invalid) e.images = 'Every image URL must start with http:// or https://'
  }

  return e
}

const blockInvalidNumericKeys = (e) => {
  if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault()
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(false)  // true after first save attempt
  const [blurred, setBlurred] = useState({})          // tracks individually touched fields
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const PAGE_SIZE = 10

  // Errors are always derived fresh — never stale state
  const errors = validate(form)
  const hasErrors = Object.values(errors).some(Boolean)
  const showErr = (field) => !!(errors[field] && (submitted || blurred[field]))

  const load = useCallback(() => {
    setLoading(true)
    adminGetProducts({ page, limit: PAGE_SIZE, search })
      .then((r) => { setProducts(r.data.products); setTotal(r.data.total) })
      .catch((e) => toast.error(getApiError(e)))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.categories || r.data))
    getBrands().then((r) => setBrands(r.data.brands || r.data))
  }, [])

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM)
    setSubmitted(false); setBlurred({})
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      name: p.name, description: p.description || '',
      price: p.price, mrp: p.mrp || '',
      stock: p.stock, categoryId: p.categoryId || '', brandId: p.brandId || '',
      images: (p.images || []).join(', '), isFeatured: p.isFeatured, isBestSeller: p.isBestSeller,
    })
    setSubmitted(false); setBlurred({})
    setShowModal(true)
  }

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const blur = (field) => setBlurred((b) => ({ ...b, [field]: true }))

  const handleSave = async () => {
    setSubmitted(true)
    if (hasErrors) return  // inline errors now visible for every field

    setSaving(true)
    const payload = {
      ...form,
      price: parseFloat(form.price),
      mrp: form.mrp !== '' ? parseFloat(form.mrp) : undefined,
      stock: Math.max(0, parseInt(form.stock, 10)),
      categoryId: form.categoryId ? parseInt(form.categoryId, 10) : undefined,
      brandId: form.brandId ? parseInt(form.brandId, 10) : undefined,
      images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
    }
    try {
      if (editing) { await adminUpdateProduct(editing.id, payload); toast.success('Product updated') }
      else { await adminCreateProduct(payload); toast.success('Product created') }
      setShowModal(false); load()
    } catch (e) { toast.error(getApiError(e)) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try { await adminDeleteProduct(confirmDelete.id); toast.success('Product removed'); load() }
    catch (e) { toast.error(getApiError(e)) }
    finally { setConfirmDelete(null) }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fieldCls = (field) =>
    `input-field transition-colors ${showErr(field) ? 'border-red-400 focus:border-red-400 bg-red-50/50' : ''}`

  const Err = ({ field }) =>
    showErr(field) ? (
      <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
        <FiAlertCircle size={11} className="shrink-0" />
        {errors[field]}
      </p>
    ) : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total products</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-glamcart-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-glamcart-primary-dark transition-colors shadow-sm">
          <FiPlus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full border border-gray-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-glamcart-primary bg-white shadow-sm"
          placeholder="Search products..."
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
                <th className="px-5 py-3.5 text-left">Product</th>
                <th className="px-5 py-3.5 text-left">Category</th>
                <th className="px-5 py-3.5 text-right">Price</th>
                <th className="px-5 py-3.5 text-right">Stock</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.length === 0 && (
                <tr><td colSpan={6} className="text-center py-14 text-gray-400 text-sm">No products found</td></tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-gray-800 line-clamp-1">{p.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{p.brand?.name}</div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{p.category?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-700">
                    ₹{Number(p.price).toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`font-semibold text-sm ${p.stock === 0 ? 'text-red-500' : p.stock < 10 ? 'text-orange-500' : 'text-gray-600'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(p)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                        title="Edit"><FiEdit2 size={14} /></button>
                      <button onClick={() => setConfirmDelete({ id: p.id, name: p.name })}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                        title="Delete"><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
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

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? It will be marked inactive.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 text-xl transition-colors">×</button>
            </div>

            <div className="p-6 space-y-4">

              {/* Error summary banner */}
              {submitted && hasErrors && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  <FiAlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>Please fix the highlighted fields before saving.</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  className={fieldCls('name')}
                  placeholder="e.g. Lakme 9to5 Primer + Matte Lipstick"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  onBlur={() => blur('name')}
                  maxLength={120}
                />
                <Err field="name" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  className={`${fieldCls('description')} resize-none`}
                  rows={3}
                  placeholder="Brief product description (min 10 characters if provided)"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  onBlur={() => blur('description')}
                />
                <Err field="description" />
              </div>

              {/* Price + MRP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Selling Price (₹) <span className="text-red-400">*</span>
                  </label>
                  <input
                    className={fieldCls('price')}
                    placeholder="e.g. 299"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.price}
                    onKeyDown={blockInvalidNumericKeys}
                    onChange={(e) => set('price', e.target.value === '' ? '' : Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    onBlur={() => blur('price')}
                  />
                  <Err field="price" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    MRP (₹) <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    className={fieldCls('mrp')}
                    placeholder="e.g. 399"
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.mrp}
                    onKeyDown={blockInvalidNumericKeys}
                    onChange={(e) => set('mrp', e.target.value === '' ? '' : Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    onBlur={() => blur('mrp')}
                  />
                  <Err field="mrp" />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Stock Quantity <span className="text-red-400">*</span>
                </label>
                <input
                  className={fieldCls('stock')}
                  placeholder="e.g. 100"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onKeyDown={blockInvalidNumericKeys}
                  onChange={(e) => set('stock', e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                  onBlur={() => blur('stock')}
                />
                <Err field="stock" />
                {!errors.stock && form.stock !== '' && Number(form.stock) === 0 && (
                  <p className="flex items-center gap-1 text-orange-500 text-xs mt-1.5">
                    <FiAlertCircle size={11} />
                    Product will appear as &quot;Out of Stock&quot; to customers
                  </p>
                )}
              </div>

              {/* Category + Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    className={`input-field ${showErr('categoryId') ? 'border-red-400 bg-red-50/50' : ''}`}
                    value={form.categoryId}
                    onChange={(e) => set('categoryId', e.target.value)}
                    onBlur={() => blur('categoryId')}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <Err field="categoryId" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Brand <span className="text-red-400">*</span>
                  </label>
                  <select
                    className={`input-field ${showErr('brandId') ? 'border-red-400 bg-red-50/50' : ''}`}
                    value={form.brandId}
                    onChange={(e) => set('brandId', e.target.value)}
                    onBlur={() => blur('brandId')}
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <Err field="brandId" />
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Image URLs <span className="text-gray-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  className={fieldCls('images')}
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                  value={form.images}
                  onChange={(e) => set('images', e.target.value)}
                  onBlur={() => blur('images')}
                />
                <Err field="images" />
              </div>

              {/* Flags */}
              <div className="flex gap-6 text-sm text-gray-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="accent-glamcart-primary w-4 h-4" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
                  Featured
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="accent-glamcart-primary w-4 h-4" checked={form.isBestSeller} onChange={(e) => set('isBestSeller', e.target.checked)} />
                  Bestseller
                </label>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 border-2 border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-300 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-glamcart-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-glamcart-primary-dark transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
