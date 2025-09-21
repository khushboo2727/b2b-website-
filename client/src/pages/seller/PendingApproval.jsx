import React from 'react';
import { Clock, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/apiWithToast';

const PendingApproval = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const queryEmail = params.get('email') || '';
  const [statusInfo, setStatusInfo] = React.useState({
    name: user?.name || localStorage.getItem('pendingName') || '',
    email: user?.email || queryEmail || localStorage.getItem('pendingEmail') || '',
    status: 'pending',
    rejectionReason: null
  });
  const [loading, setLoading] = React.useState(false);

  const refreshStatus = async (manual = false) => {
    if (!statusInfo.email) return;
    try {
      setLoading(true);
      const resp = await authAPI.getStatusByEmail(statusInfo.email);
      const data = resp?.data || {};
      if (data.exists) {
        setStatusInfo({
          name: data.name || statusInfo.name,
          email: data.email,
          status: data.status || 'pending',
          rejectionReason: data.rejectionReason || null
        });
        if (data.status === 'active') {
          navigate('/login', { state: { message: 'Your seller account is approved. Please login.' } });
        } else if (data.status === 'pending' && manual) {
          // Optional: manual click par page reload jab tak pending hai
          navigate(0);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const tryAgain = () => {
    // Draft ko localStorage se le lo agar pehle submit ke time save kiya gaya tha
    const draftStr = localStorage.getItem('sellerRegistrationDraft');
    let prefill = null;
    try {
      prefill = draftStr ? JSON.parse(draftStr) : null;
    } catch {}
    if (!prefill) {
      prefill = { name: statusInfo.name, email: statusInfo.email };
    }
    navigate('/seller/register', {
      state: {
        fromRejected: true,
        rejectedReason: statusInfo.rejectionReason || '',
        prefill
      }
    });
  };

  React.useEffect(() => {
    // Auto-refresh once on mount if we have an email
    if (statusInfo.email) {
      refreshStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Account Pending Approval
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your seller account is currently under review
            </p>
            <p className="mt-1 text-center text-sm text-gray-600">
              Aapka seller account verification ke liye pending hai
            </p>
          </div>

          <div className="mt-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    What happens next? / Aage kya hoga?
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Our team will review your business information</li>
                      <li>Humari team aapke business documents verify karegi</li>
                      <li>We may contact you for additional verification</li>
                      <li>Zarurat padne par hum aapse additional verification ke liye contact karenge</li>
                      <li>You'll receive an email once approved (1-3 business days)</li>
                      <li>Approval ke baad aapko email milega (1-3 business din lag sakte hain)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Account Information / Aapki Jankari
              </h4>
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-20">Name:</span>
                  <span>{statusInfo.name || '-'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-20">Email:</span>
                  <span>{statusInfo.email || '-'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium w-20">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusInfo.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : statusInfo.status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {statusInfo.status === 'active'
                      ? 'Approved'
                      : statusInfo.status === 'suspended'
                        ? 'Rejected'
                        : 'Pending Approval'}
                  </span>
                </div>
              </div>
            </div>

            {statusInfo.status === 'suspended' && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Application Rejected</h4>
                {statusInfo.rejectionReason ? (
                  <p className="text-sm text-red-700">Reason: {statusInfo.rejectionReason}</p>
                ) : (
                  <p className="text-sm text-red-700">Your application was rejected.</p>
                )}
                <div className="mt-4">
                  <button
                    onClick={tryAgain}
                    className="w-full flex justify-center py-2 px-4 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Try Again (Re-Register)
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Need Help? / Madad chahiye?
              </h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>Email: support@niryatbusiness.com</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>Phone: +1 (555) 123-4567</span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => refreshStatus(true)}
                disabled={loading || !statusInfo.email}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60"
              >
                {loading ? 'Checking...' : 'Refresh Status'}
              </button>
              <button
                onClick={logout}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PendingApproval;