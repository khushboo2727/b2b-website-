import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rfqAPI } from '../../services/api';
import SellerLayout from '../../components/layout/SellerLayout';
import { FileText, Eye, Clock, CheckCircle, XCircle, Crown, Unlock } from 'lucide-react';

const SellerRFQs = () => {
  const [rfqs, setRFQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState('Free');

  useEffect(() => {
    const fetchRFQs = async () => {
      try {
        const response = await rfqAPI.getSellerRFQs();
        setRFQs(response.data.rfqs || []);
        setHasActiveMembership(response.data.hasActiveMembership);
        setMembershipStatus(response.data.membershipStatus);
      } catch (error) {
        console.error('Error fetching RFQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRFQs();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending', icon: Clock },
      quoted: { color: 'bg-green-100 text-green-800', text: 'Quoted', icon: CheckCircle },
      accepted: { color: 'bg-blue-100 text-blue-800', text: 'Accepted', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const MembershipUpgradeCard = () => (
    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Crown className="h-8 w-8 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">Upgrade to Premium</h3>
            <p className="text-yellow-700 text-sm">
              View complete buyer details and contact information
            </p>
          </div>
        </div>
        <Link
          to="/membership"
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Upgrade Now
        </Link>
      </div>
    </div>
  );

  const BlurredContactCard = ({ rfq }) => (
    <div className="relative">
      <div className="filter blur-sm pointer-events-none">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Buyer Contact</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Name: {rfq.buyerContact?.name || 'B***'}</div>
            <div>Email: {rfq.buyerContact?.email || '***@***.com'}</div>
            <div>Phone: {rfq.buyerContact?.phone || '***-***-****'}</div>
            {rfq.buyerContact?.companyName && (
              <div>Company: {rfq.buyerContact.companyName}</div>
            )}
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white bg-opacity-90 p-4 rounded-lg text-center">
          <Unlock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-900">Premium Required</p>
          <p className="text-xs text-gray-600 mb-3">{rfq.upgradeMessage}</p>
          <Link
            to="/membership"
            className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </div>
  );

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
              <h1 className="text-2xl font-bold text-gray-900">RFQ Management</h1>
              <p className="text-gray-600 mt-2">Manage incoming Request for Quotes</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                hasActiveMembership 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {membershipStatus} Member
              </span>
              {hasActiveMembership && (
                <Crown className="h-5 w-5 text-yellow-500" />
              )}
            </div>
          </div>
        </div>

        {/* Membership Upgrade Card */}
        {!hasActiveMembership && <MembershipUpgradeCard />}

        {/* RFQ List */}
        <div className="bg-white rounded-lg shadow">
          {rfqs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No RFQs found</h3>
              <p className="text-gray-500">
                RFQs will appear here when buyers request quotes for products in your categories
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rfqs.map((rfq) => (
                <div key={rfq._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          RFQ #{rfq.rfqNumber}
                        </h3>
                        {getStatusBadge(rfq.status)}
                        {rfq.membershipRequired && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium Required
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Product Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>Product: {rfq.productId?.title || 'N/A'}</div>
                            <div>Category: {rfq.productId?.category || 'N/A'}</div>
                            <div>Quantity: {rfq.quantity} units</div>
                            {rfq.targetPrice && (
                              <div>Target Price: ₹{rfq.targetPrice}</div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          {hasActiveMembership ? (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Buyer Contact</h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div>Name: {rfq.buyerContact?.name || rfq.buyerId?.name || 'N/A'}</div>
                                <div>Email: {rfq.buyerContact?.email || rfq.buyerId?.email || 'N/A'}</div>
                                <div>Phone: {rfq.buyerContact?.phone || rfq.buyerId?.phone || 'N/A'}</div>
                                {rfq.buyerContact?.companyName && (
                                  <div>Company: {rfq.buyerContact.companyName}</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <BlurredContactCard rfq={rfq} />
                          )}
                        </div>
                      </div>

                      {rfq.message && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                          <h4 className="font-medium text-gray-900 mb-1">Message</h4>
                          <p className="text-sm text-gray-600">{rfq.message}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      <button className="flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      
                      {rfq.status === 'pending' && hasActiveMembership && (
                        <button className="flex items-center px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Submit Quote
                        </button>
                      )}
                      
                      {rfq.status === 'pending' && !hasActiveMembership && (
                        <Link
                          to="/membership"
                          className="flex items-center px-3 py-2 text-sm text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade to Quote
                        </Link>
                      )}
                    </div>
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