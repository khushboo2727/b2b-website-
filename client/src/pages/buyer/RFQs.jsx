import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rfqAPI } from '../../services/api';
import BuyerLayout from '../../components/layout/BuyerLayout';
import { FileText, Eye, Clock, CheckCircle, XCircle, Calendar, Package } from 'lucide-react';

const BuyerRFQs = () => {
  const [rfqs, setRFQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRFQs = async () => {
      try {
        const response = await rfqAPI.getBuyerRFQs();
        setRFQs(response.data.rfqs || []);
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
      quoted: { color: 'bg-green-100 text-green-800', text: 'Seller Responded', icon: CheckCircle },
      accepted: { color: 'bg-blue-100 text-blue-800', text: 'Accepted', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected', icon: XCircle },
      expired: { color: 'bg-gray-100 text-gray-800', text: 'Expired', icon: XCircle }
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

  const filteredRFQs = rfqs.filter(rfq => {
    const matchesFilter = filter === 'all' || rfq.status === filter;
    const matchesSearch = rfq.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.productId?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filterOptions = [
    { value: 'all', label: 'All RFQs', count: rfqs.length },
    { value: 'pending', label: 'Pending', count: rfqs.filter(r => r.status === 'pending').length },
    { value: 'quoted', label: 'Responded', count: rfqs.filter(r => r.status === 'quoted').length },
    { value: 'accepted', label: 'Accepted', count: rfqs.filter(r => r.status === 'accepted').length },
    { value: 'rejected', label: 'Rejected', count: rfqs.filter(r => r.status === 'rejected').length }
  ];

  if (loading) {
    return (
      <BuyerLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My RFQs</h1>
              <p className="text-gray-600 mt-2">Manage and track your Request for Quotes</p>
            </div>
            <Link
              to="/"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === option.value
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="lg:w-80">
              <input
                type="text"
                placeholder="Search RFQs or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* RFQ List */}
        <div className="bg-white rounded-lg shadow">
          {filteredRFQs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No RFQs found</h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? "You haven't submitted any RFQs yet"
                  : `No RFQs with status: ${filter}`
                }
              </p>
              <Link
                to="/"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRFQs.map((rfq) => (
                <div key={rfq._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          RFQ #{rfq.rfqNumber}
                        </h3>
                        {getStatusBadge(rfq.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Package className="w-4 h-4 mr-2" />
                          <span>Product: {rfq.productId?.title || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium mr-2">Qty:</span>
                          <span>{rfq.quantity} units</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Submitted: {new Date(rfq.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {rfq.targetPrice && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Target Price:</span> ₹{rfq.targetPrice}
                        </div>
                      )}

                      {rfq.message && (
                        <div className="text-sm text-gray-600 mb-4">
                          <span className="font-medium">Message:</span> {rfq.message}
                        </div>
                      )}

                      {rfq.sellerQuote && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-green-800 mb-2">Seller Quote</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                            <div>Price: ₹{rfq.sellerQuote.quotedPrice}</div>
                            <div>Quantity: {rfq.sellerQuote.quotedQuantity} units</div>
                            {rfq.sellerQuote.deliveryTerms && (
                              <div className="md:col-span-2">Delivery: {rfq.sellerQuote.deliveryTerms}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      <button className="flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      
                      {rfq.status === 'quoted' && (
                        <>
                          <button className="flex items-center px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Accept Quote
                          </button>
                          <button className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Quote
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BuyerLayout>
  );
};

export default BuyerRFQs;