import React, { useEffect, useState } from 'react';
import SellerLayout from '../../components/layout/SellerLayout';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { leadAPI, authAPI, membershipAPI } from '../../services/api';
import { 
  Package,
  CreditCard,
  User,
  Mail,
  Phone,
  Building
} from 'lucide-react';

function SellerLeads() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasedLeadIds, setPurchasedLeadIds] = useState({});
  const [purchasedCount, setPurchasedCount] = useState(0);
  const [remainingLeads, setRemainingLeads] = useState(null); // number or 'Unlimited'
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    fetchLeads();
    fetchMembershipAndPurchased();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await leadAPI.getForSeller();
      const data = res.data || {};
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching seller leads:', error);
      showError('Leads fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembershipAndPurchased = async () => {
    try {
      const me = await authAPI.getCurrentUser();
      const user = me.data || {};
      let plan = user.membershipPlan;
      let leadsPerMonth = 0;
      let name = '';

      if (plan && typeof plan === 'object') {
        leadsPerMonth = plan?.limits?.leadsPerMonth ?? 0;
        name = plan?.name || '';
      } else if (plan) {
        const plansRes = await membershipAPI.getPlans();
        const plans = plansRes.data || [];
        const match = plans.find(p => String(p._id) === String(plan));
        leadsPerMonth = match?.limits?.leadsPerMonth ?? 0;
        name = match?.name || '';
      }

      setPlanName(name);

      // Purchased leads for this seller
      const purchasedRes = await leadAPI.getPurchasedLeads({ page: 1, limit: 50 });
      const purchasedTotal = purchasedRes.data?.total ?? 0;
      setPurchasedCount(purchasedTotal);

      const purchasedList = purchasedRes.data?.leads || [];
      const map = {};
      purchasedList.forEach(l => { map[l._id] = true; });
      setPurchasedLeadIds(map);

      // 0 means unlimited per MembershipPlan schema
      if (!leadsPerMonth || leadsPerMonth === 0) {
        setRemainingLeads('Unlimited');
      } else {
        setRemainingLeads(Math.max(0, leadsPerMonth - purchasedTotal));
      }
    } catch (error) {
      console.error('Error fetching membership/purchased info:', error);
    }
  };

  const handleBuySingleLead = () => {
    navigate('/membership-plans');
  };

  const handlePurchaseLead = async (lead) => {
    try {
      // Block if purchase limit reached (fallback to 5 if undefined)
      const max = typeof lead.maxPurchases === 'number' ? lead.maxPurchases : 5;
      const currentPurchases = (lead.purchasedBy?.length ?? 0);
      if (currentPurchases >= max) {
        showError(`Is lead par ${max} sellers already purchase kar chuke hain.`);
        return;
      }

      const allowed = remainingLeads === 'Unlimited' || (typeof remainingLeads === 'number' && remainingLeads > 0);
      if (!planName || planName === 'Free' || !allowed) {
        showError('Membership required or insufficient lead allowance');
        return navigate('/membership-plans');
      }

      await leadAPI.purchase(lead._id);
      const viewed = await leadAPI.view(lead._id);
      const detailedLead = viewed.data;

      setLeads(prev => prev.map(l => l._id === lead._id ? { ...l, ...detailedLead } : l));
      setPurchasedLeadIds(prev => ({ ...prev, [lead._id]: true }));
      setPurchasedCount(prev => prev + 1);
      if (typeof remainingLeads === 'number') {
        setRemainingLeads(prev => Math.max(0, (prev ?? 0) - 1));
      }
      showSuccess('Lead purchased. Buyer details unlocked.');
    } catch (error) {
      console.error('Error purchasing lead:', error);
      showError(error?.response?.data?.message || 'Failed to purchase lead');
    }
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Leads Sent To You</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">Purchased: {purchasedCount}</div>
            <div className="text-sm text-gray-500">Remaining: {remainingLeads ?? '-'}</div>
            <button
              onClick={handleBuySingleLead}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              <CreditCard className="h-4 w-4" />
              Buy Single Lead
            </button>
          </div>
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
            <p className="mt-1 text-sm text-gray-500">Leads will appear here when buyers inquire about your products.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <div key={lead._id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="mb-3">
                      <h3 className="font-medium text-gray-900 mb-1">
                        Product: {lead.productDetails?.title || lead.product?.title || lead.product?.name || lead.productId?.title || lead.productId?.name || 'Product not found'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Category: {lead.productDetails?.category || lead.product?.category || lead.productId?.category || 'N/A'}
                      </p>
                      {!purchasedLeadIds[lead._id] ? (
                        <p className="text-xs text-gray-500 mt-1">Buyer details hidden. Purchase to unlock.</p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900">
                              {lead.buyerId?.name || lead.buyer?.name || 'Buyer'}
                            </span>
                          </div>
                          {lead.buyerContact?.companyName && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Building className="h-4 w-4 text-gray-500" />
                              <span>{lead.buyerContact.companyName}</span>
                            </div>
                          )}
                          {lead.buyerContact?.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <span>{lead.buyerContact.email}</span>
                            </div>
                          )}
                          {lead.buyerContact?.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone className="h-4 w-4 text-blue-600" />
                              <span>{lead.buyerContact.phone}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {!purchasedLeadIds[lead._id] ? (
                    (() => {
                      const max = typeof lead.maxPurchases === 'number' ? lead.maxPurchases : 5;
                      const soldOut = (lead.purchasedBy?.length ?? 0) >= max;
                      return soldOut ? (
                        <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded">Sold Out</span>
                      ) : (
                        <button
                          onClick={() => handlePurchaseLead(lead)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800"
                        >
                          <CreditCard className="h-4 w-4" />
                          Purchase Lead
                        </button>
                      );
                    })()
                  ) : (
                    <span className="px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded">Purchased</span>
                  )}
                </div>
                {lead.message && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">Message</h4>
                    <p className="text-sm text-gray-600">{lead.message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SellerLayout>
  );
}

export default SellerLeads;