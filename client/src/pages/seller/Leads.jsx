import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  User, 
  Package, 
  Calendar, 
  Phone, 
  Mail, 
  Building, 
  Filter, 
  Search,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mail as MailIcon,
  MailOpen,
  ChevronLeft,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { leadAPI, productAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

const Leads = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [membershipPlan, setMembershipPlan] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    isRead: '',
    dateFrom: '',
    dateTo: '',
    productId: '',
    buyerName: '',
    priority: '',
    page: 1,
    limit: 10
  });
  
  const [showContactInfo, setShowContactInfo] = useState({});

  useEffect(() => {
    fetchLeads();
    fetchProducts();
  }, [filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await leadAPI.getForSeller(filters);
      setLeads(response.data.leads || []);
      setPagination(response.data.pagination || {});
      setMembershipPlan(response.data.membershipPlan || '');
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ sellerId: user._id });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const markAsRead = async (leadId, isRead) => {
    try {
      await leadAPI.markAsRead(leadId, isRead);
      setLeads(prev => prev.map(lead => 
        lead._id === leadId 
          ? { ...lead, isRead, readAt: isRead ? new Date() : null }
          : lead
      ));
      toast.success(`Lead marked as ${isRead ? 'read' : 'unread'}`);
    } catch (error) {
      console.error('Error updating read status:', error);
      toast.error('Failed to update read status');
    }
  };

  const updateLeadStatus = async (leadId, status) => {
    try {
      await leadAPI.updateStatus(leadId, status);
      setLeads(prev => prev.map(lead => 
        lead._id === leadId ? { ...lead, status } : lead
      ));
      toast.success(`Lead marked as ${status}`);
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const canViewContactInfo = (lead) => {
    return membershipPlan === 'Premium' || membershipPlan === 'Basic';
  };

  const handleBuySingleLead = () => {
    navigate('/membership-plans');
  };

  const toggleContactInfo = (leadId) => {
    setShowContactInfo(prev => ({
      ...prev,
      [leadId]: !prev[leadId]
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      isRead: '',
      dateFrom: '',
      dateTo: '',
      productId: '',
      buyerName: '',
      priority: '',
      page: 1,
      limit: 10
    });
  };

  const LeadCard = ({ lead }) => (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${
      !lead.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : 'border-gray-200'
    }`}>
      {/* Header with read/unread status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            lead.isRead ? 'bg-gray-300' : 'bg-blue-500'
          }`}></div>
          <span className="text-sm font-medium text-gray-900">
            {lead.isRead ? 'Read' : 'Unread'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(lead.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => markAsRead(lead._id, !lead.isRead)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title={lead.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {lead.isRead ? <MailOpen className="h-4 w-4" /> : <MailIcon className="h-4 w-4" />}
          </button>
          
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            lead.status === 'open' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {lead.status}
          </span>
        </div>
      </div>

      {/* Product Info */}
      {lead.productId && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          <Package className="h-5 w-5 text-gray-600" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{lead.productId.name}</h4>
            <p className="text-sm text-gray-600">
              Price: ₹{lead.productId.price?.toLocaleString()} | 
              Quantity: {lead.quantity || 1}
            </p>
          </div>
        </div>
      )}

      {/* Buyer Info */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-900">
            {canViewContactInfo(lead) ? lead.buyerId?.name : 'Premium Required'}
          </span>
        </div>
        
        {/* Contact Information */}
        {canViewContactInfo(lead) && lead.buyerContact && (
          <div className="space-y-2">
            <button
              onClick={() => toggleContactInfo(lead._id)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              {showContactInfo[lead._id] ? (
                <><EyeOff className="h-4 w-4" /> Hide Contact Info</>
              ) : (
                <><Eye className="h-4 w-4" /> Show Contact Info</>
              )}
            </button>
            
            {showContactInfo[lead._id] && (
              <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                {lead.buyerContact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <a href={`mailto:${lead.buyerContact.email}`} className="text-blue-600 hover:underline">
                      {lead.buyerContact.email}
                    </a>
                  </div>
                )}
                {lead.buyerContact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <a href={`tel:${lead.buyerContact.phone}`} className="text-blue-600 hover:underline">
                      {lead.buyerContact.phone}
                    </a>
                  </div>
                )}
                {lead.buyerContact.companyName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">{lead.buyerContact.companyName}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {!canViewContactInfo(lead) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Upgrade to Premium to view buyer contact information
            </p>
          </div>
        )}
      </div>

      {/* Message */}
      <div className="mb-4">
        <h5 className="font-medium text-gray-900 mb-2">Message:</h5>
        <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-lg p-3">
          {lead.message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        {/* Show Buy Single Lead button if membership is Free and lead is not read */}
        {membershipPlan === 'Free' && !lead.isRead ? (
          <button
            onClick={handleBuySingleLead}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
          >
            <CreditCard className="h-4 w-4" />
            Buy Single Lead
          </button>
        ) : (
          /* Show normal status buttons for paid plans or read leads */
          lead.status === 'open' ? (
            <button
              onClick={() => updateLeadStatus(lead._id, 'closed')}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
            >
              <CheckCircle className="h-4 w-4" />
              Mark as Closed
            </button>
          ) : (
            <button
              onClick={() => updateLeadStatus(lead._id, 'open')}
              className="flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors duration-200 text-sm font-medium"
            >
              <Clock className="h-4 w-4" />
              Reopen
            </button>
          )
        )}
        
        {canViewContactInfo(lead) && lead.buyerContact?.email && (
          <a
            href={`mailto:${lead.buyerContact.email}?subject=Re: Inquiry for ${lead.productId?.name}`}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
          >
            <Mail className="h-4 w-4" />
            Reply
          </a>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 space-y-4">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Inquiry Dashboard</h1>
        <p className="text-gray-600">Manage inquiries from potential buyers</p>
        {membershipPlan && (
          <div className="mt-2">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
              membershipPlan === 'Premium' 
                ? 'bg-purple-100 text-purple-800'
                : membershipPlan === 'Basic'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {membershipPlan} Plan
            </span>
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Read Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Read Status</label>
            <select
              value={filters.isRead}
              onChange={(e) => handleFilterChange('isRead', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <select
              value={filters.productId}
              onChange={(e) => handleFilterChange('productId', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Products</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
          
          <div className="text-sm text-gray-600">
            {pagination.totalLeads || 0} total inquiries
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-4 mb-6">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <LeadCard key={lead._id} lead={lead} />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later for new inquiries.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilterChange('page', filters.page - 1)}
              disabled={!pagination.hasPrev}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            
            <span className="px-3 py-2 text-sm font-medium text-gray-700">
              {pagination.currentPage}
            </span>
            
            <button
              onClick={() => handleFilterChange('page', filters.page + 1)}
              disabled={!pagination.hasNext}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;