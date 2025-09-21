import React, { useEffect, useState } from 'react';

const RejectReasonModal = ({ open, title = 'Reject Seller', onClose, onSubmit, loading = false }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError('Please enter at least 5 characters.');
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg mx-4 rounded-lg shadow-lg p-5">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea
            className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[120px]"
            placeholder="Enter reason for rejection..."
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
            maxLength={1000}
          />
          {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectReasonModal;