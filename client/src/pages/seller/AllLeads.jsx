import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import SellerLayout from '../../components/layout/SellerLayout';
import { leadAPI } from '../../services/leadAPI';
import { productAPI } from '../../services/productAPI';
import {
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building,
  User,
  Mail,
  Phone,
  Package,
  Eye,
  CreditCard
} from 'lucide-react';

const AllLeads = () => {
  const [allLeads, setAllLeads] = useState([]);
  const [purchasedLeads, setPurchasedLeads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'purchased'
  const [membershipPlan, setMembershipPlan] = useState('Free');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllLeads();
  }, [currentPage, selectedCategory, activeTab]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchAllLeads = async () => {
    try {
      setLoading(true);
      if (activeTab === 'available') {
        const response = await leadAPI.getSellerLeads(currentPage, 10, selectedCategory);
        setAllLeads(response.leads || []);
        setTotalPages(response.totalPages || 1);
      } else {
        const response = await leadAPI.getPurchasedLeads(currentPage, 10, selectedCategory);
        setPurchasedLeads(response.leads || []);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === 'category') {
      setSelectedCategory(value);
      setCurrentPage(1);
    }
  };

  const handlePurchaseLead = async (leadId) => {
    try {
      await leadAPI.purchaseLead(leadId);
      toast.success('Lead purchased successfully!');
      fetchAllLeads(); // Refresh the list
    } catch (error) {
      toast.error(error.message || 'Failed to purchase lead');
    }
  };

  const handleViewLead = async (leadId) => {
    try {
      const leadData = await leadAPI.viewLead(leadId);
      toast.success('Lead details loaded');
      fetchAllLeads(); // Refresh to update view count
    } catch (error) {
      toast.error(error.message || 'Failed to view lead');
    }
  };

  const handleBuySingleLead = () => {
    navigate('/membership-plans');
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const getTimeRemaining = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInHours = (now - created) / (1000 * 60 * 60);
    const remainingHours = Math.max(0, 48 - diffInHours);
    
    if (remainingHours <= 0) return 'Expired';
    if (remainingHours < 1) return `${Math.floor(remainingHours * 60)}m left`;
    return `${Math.floor(remainingHours)}h left`;
  };

  const isExpiringSoon = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInHours = (now - created) / (1000 * 60 * 60);
    return (48 - diffInHours) <= 6; // Less than 6 hours remaining
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">All Leads</h1>
          <div className="flex items-center gap-4">
             <div className="text-sm text-gray-500">
               Total: {(activeTab === 'available' ? allLeads : purchasedLeads).length} leads
             </div>
             {membershipPlan === 'Free' && (
               <button
                 onClick={handleBuySingleLead}
                 className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
               >
                 <CreditCard className="h-4 w-4" />
                 Buy Single Lead
               </button>
             )}
           </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'available'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Available Leads
          </button>
          <button
            onClick={() => setActiveTab('purchased')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'purchased'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Purchased Leads
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Leads List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (activeTab === 'available' ? allLeads : purchasedLeads).length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'available' 
                ? 'No leads match your current filters.'
                : 'You haven\'t purchased any leads yet.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(activeTab === 'available' ? allLeads : purchasedLeads).map((lead) => (
              <div key={lead._id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {lead.buyerDetails?.name || 'Anonymous Buyer'}
                      </span>
                      {lead.buyerDetails?.companyName && (
                        <>
                          <Building className="h-4 w-4 text-gray-400 ml-2" />
                          <span className="text-sm text-gray-600">
                            {lead.buyerDetails.companyName}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <h3 className="font-medium text-gray-900 mb-1">
                        Product: {lead.productDetails?.title || 'Product not found'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Category: {lead.productDetails?.category || 'N/A'}
                      </p>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-gray-700">
                        <strong>Message:</strong> {lead.message}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Quantity:</strong> {lead.quantity}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {lead.buyerDetails?.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{lead.buyerDetails.email}</span>
                        </div>
                      )}
                      {lead.buyerDetails?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{lead.buyerDetails.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      isExpiringSoon(lead.createdAt)
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <Clock className="h-3 w-3" />
                      {getTimeRemaining(lead.createdAt)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-4">
                  {activeTab === 'available' ? (
                     membershipPlan === 'Free' ? (
                       <button
                         onClick={handleBuySingleLead}
                         className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                       >
                         Buy Single Lead
                       </button>
                     ) : (
                       <button
                         onClick={() => handlePurchaseLead(lead._id)}
                         className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         disabled={getTimeRemaining(lead.createdAt) === 'Expired'}
                       >
                         {getTimeRemaining(lead.createdAt) === 'Expired' ? 'Lead Expired' : 'Purchase Lead (₹100)'}
                       </button>
                     )
                  ) : (
                    <button
                      onClick={() => handleViewLead(lead._id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      View Full Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </SellerLayout>
  );
};

export default AllLeads;