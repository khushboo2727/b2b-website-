import React from 'react';

const ConfirmModal = ({ open, title = 'Confirm Action', message, onClose, onConfirm, loading = false, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md mx-4 rounded-lg shadow-lg p-5">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {message && <p className="text-sm text-gray-700 mb-4">{message}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-sm"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;