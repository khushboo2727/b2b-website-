import React, { useState, useEffect } from 'react';
import SellerLayout from '../../components/layout/SellerLayout';
import { leadAPI } from '../../services/api';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

const SellerRFQs = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membershipPlan, setMembershipPlan] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await leadAPI.getForSeller();
        setLeads(response.data.leads || []);
        setMembershipPlan(response.data.membershipPlan || '');
      } catch (error) {
        console.error('Error fetching Leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { color: 'bg-yellow-100 text-yellow-800', text: 'Open', icon: Clock },
      closed: { color: 'bg-green-100 text-green-800', text: 'Closed', icon: CheckCircle },
      inactive: { color: 'bg-gray-200 text-gray-700', text: 'Inactive', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
              <p className="text-gray-600 mt-2">Manage incoming buyer inquiries</p>
            </div>
            <div className="flex items-center space-x-3">
              {membershipPlan && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  membershipPlan === 'Premium' 
                    ? 'bg-purple-100 text-purple-800' 
                    : membershipPlan === 'Basic'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {membershipPlan} Member
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div className="bg-white rounded-lg shadow">
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-500">Leads will appear here when buyers inquire about your products</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {leads.map((lead) => (
                <div key={lead._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">Lead</h3>
                        {getStatusBadge(lead.status)}
                        {!lead.isActive && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">Inactive</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Product Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>Product: {lead.productId?.name || lead.productId?.title || 'N/A'}</div>
                            <div>Category: {lead.category || lead.productId?.category || 'N/A'}</div>
                            <div>Quantity: {lead.quantity || 1} units</div>
                            {lead.budget && (
                              <div>Budget: {lead.budget}</div>
                            )}
                          </div>
                        </div>

                        {/* Buyer details intentionally hidden */}
                      </div>

                      {lead.message && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <h4 className="font-medium text-gray-900 mb-1">Message</h4>
                          <p className="text-sm text-gray-600">{lead.message}</p>
                        </div>
                      )}
                    </div>

                    {/* RFQ-specific actions removed */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerRFQs;
