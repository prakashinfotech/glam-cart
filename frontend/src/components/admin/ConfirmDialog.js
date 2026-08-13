'use client'

import { FiAlertTriangle } from 'react-icons/fi'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, danger = true }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-100' : 'bg-yellow-100'}`}>
            <FiAlertTriangle size={22} className={danger ? 'text-red-500' : 'text-yellow-500'} />
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
        <div className="flex border-t border-gray-100">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              danger ? 'text-red-500 hover:bg-red-50' : 'text-glamcart-primary hover:bg-glamcart-primary-pale'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
