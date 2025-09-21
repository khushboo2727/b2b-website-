// SellerDetail component (imports and component)
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import { adminAPI } from "../../services/apiWithToast";
// import { toast } from "react-toastify";
import RejectReasonModal from "../../components/common/RejectReasonModal";
import ConfirmModal from '../../components/common/ConfirmModal';
// import RejectReasonModal from "../../components/common/RejectReasonModal"; 
import {Link} from 'react-router-dom';



const Row = ({ label, value }) => (
  <div className="grid grid-cols-12 py-1">
    <div className="col-span-4 text-gray-600">{label}</div>
    <div className="col-span-8 font-medium break-words">{value || '-'}</div>
  </div>
);

const SellerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await adminAPI.getSellerDetail(id);
        if (mounted) setDetail(data);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load seller details');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const approve = async () => {
    if (!confirm('Approve this seller?')) return;
    await adminAPI.approveSeller(id);
    navigate('/admin/sellers');
  };

  const openReject = () => setRejectModalOpen(true);

  const submitReject = async (reason) => {
    try {
      setRejectLoading(true);
      await adminAPI.rejectSeller(id, reason);
      navigate('/admin/sellers');
    } finally {
      setRejectLoading(false);
      setRejectModalOpen(false);
    }
  };

  const submitApprove = async () => {
    try {
      setApproveLoading(true);
      await adminAPI.approveSeller(id);
      toast.success('Seller approved successfully');
      navigate('/admin/sellers');
    } catch (e) {
      toast.error('Failed to approve seller');
    } finally {
      setApproveLoading(false);
      setApproveModalOpen(false);
    }
  };


  const user = detail?.user;
  const p = detail?.profile;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Seller Detail Review</h1>
        <div className="space-x-2">
          <Link to="/admin/sellers" className="px-3 py-2 border rounded">Back</Link>
          <div className="flex gap-3">
            <button onClick={openReject} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
            <button onClick={approve} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
          </div>
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {detail && (
        <div className="space-y-6">
          {/* Basic */}
          <section className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Basic</h2>
            <Row label="Name" value={user?.name} />
            <Row label="Email" value={user?.email} />
            <Row label="Phone" value={p?.contact?.phone || user?.phone} />
            <Row label="Status" value={user?.status} />
            <Row label="Registered On" value={new Date(user?.createdAt).toLocaleString()} />
          </section>

          {/* Company */}
          <section className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Company</h2>
            <Row label="Company Name" value={p?.companyName} />
            <Row label="Business Type" value={p?.businessType} />
            <Row label="Business Category" value={p?.businessCategory} />
            <Row label="Years in Business" value={p?.yearsInBusiness} />
            <Row label="Total Employees" value={p?.totalEmployees} />
            <Row label="Description" value={p?.description} />
          </section>

          {/* GST & PAN */}
          <section className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Compliance</h2>
            <Row label="GST Number" value={p?.gstNumber} />
            <Row label="PAN Number" value={p?.panNumber} />
            <Row label="GST Certificate" value={p?.gstCertificate ? 'Uploaded' : '—'} />
          </section>

          {/* Contact */}
          <section className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Contact</h2>
            <Row label="Business Email" value={p?.contact?.businessEmail || user?.email} />
            <Row label="Alternate Phone" value={p?.contact?.alternatePhone} />
          </section>

          {/* Address */}
          <section className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Address</h2>
            <Row label="Street" value={p?.address?.street} />
            <Row label="City" value={p?.address?.city} />
            <Row label="State" value={p?.address?.state} />
            <Row label="Pincode" value={p?.address?.pincode} />
            <Row label="Country" value={p?.address?.country} />
          </section>

          {/* Online Presence */}
          <section className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Online Presence</h2>
            <Row label="Website" value={p?.websiteUrl} />
            <Row label="Facebook" value={p?.facebook} />
            <Row label="Instagram" value={p?.instagram} />
            <Row label="LinkedIn" value={p?.linkedin} />
          </section>

          {/* Bank Details */}
          <section className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Bank Details</h2>
            <Row label="Account Holder" value={p?.bankDetails?.accountHolderName} />
            <Row label="Account Number" value={p?.bankDetails?.accountNumber} />
            <Row label="IFSC" value={p?.bankDetails?.ifscCode} />
            <Row label="UPI ID" value={p?.bankDetails?.upiId} />
          </section>

          <RejectReasonModal
            open={rejectModalOpen}
            onClose={() => setRejectModalOpen(false)}
            onSubmit={submitReject}
            loading={rejectLoading}
            title="Reject Seller"
          />

          {/* Approve Confirm Modal */}
          <ConfirmModal
              open={approveModalOpen}
              onClose={() => setApproveModalOpen(false)}
              onConfirm={submitApprove}
              loading={approveLoading}
              title="Approve Seller"
              message="Are you sure you want to approve this seller?"
              confirmText="Approve"
              cancelText="Cancel"
          />

          {/* Images */}
          <section className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Business Images</h2>
            {Array.isArray(p?.images) && p.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {p.images.map((img, i) => (
                  <figure key={i} className="border rounded overflow-hidden">
                    {/* If you store base64, this tag will still render; if URL, ensure CORS/host path correct */}
                    <img src={img.url} alt={img.tag || `image-${i}`} className="w-full h-32 object-cover" />
                    <figcaption className="text-sm p-2 text-center text-gray-600">{img.tag || '-'}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No images uploaded</div>
            )}
          </section>
        </div>
      )}
    </AdminLayout>
  );
}


export default SellerDetail;

