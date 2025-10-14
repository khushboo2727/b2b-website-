import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productAPI, leadAPI } from '../../services/api';
import SellerLayout from '../../components/layout/SellerLayout';
import { Package, Users, TrendingUp, DollarSign, Filter, ChevronLeft, ChevronRight, Clock, Building, User, Mail, Phone } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

// All Leads Section Component
const AllLeadsSection = () => {
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    page: 1,
    limit: 5
  });
  const [categories, setCategories] = useState([]);
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const toast = { success: showSuccess, error: showError, info: showInfo, warning: showWarning };

  useEffect(() => {
    fetchAllLeads();
    fetchCategories();
  }, [filters]);

  const fetchAllLeads = async () => {
    try {
      setLoading(true);
      const response = await leadAPI.getAllLeads(filters);
      setAllLeads(response.data.leads || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching all leads:', error);
      toast.error('Failed to fetch leads');
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
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const formatTimeRemaining = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = (48 * 60 * 60 * 1000) - (now - created);
    
    if (diffMs <= 0) return 'Expired';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">All Leads (48h Auto-Remove)</h2>
          <div className="flex items-center gap-4">
            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : allLeads.length > 0 ? (
          <div className="space-y-4">
            {allLeads.map((lead) => (
              <div key={lead._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {lead.buyerContact?.companyName || lead.buyer?.name || 'Unknown Company'}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        lead.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                    
                    {lead.product && (
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">
                          {lead.product.name} - {lead.product.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          ₹{lead.product.price?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 mb-2">{lead.message}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Qty: {lead.quantity || 1}</span>
                      {lead.budget && <span>Budget: ₹{lead.budget.toLocaleString()}</span>}
                      <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-orange-600 mb-2">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeRemaining(lead.createdAt)}</span>
                    </div>
                    
                    {lead.buyerContact && (
                      <div className="text-xs text-gray-500 space-y-1">
                        {lead.buyerContact.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{lead.buyerContact.email}</span>
                          </div>
                        )}
                        {lead.buyerContact.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{lead.buyerContact.phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  
                  <span className="px-3 py-1 text-sm font-medium text-gray-700">
                    {pagination.currentPage}
                  </span>
                  
                  <button
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    disabled={!pagination.hasNext}
                    className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
            <p className="text-gray-600">No leads match your current filters or all leads have expired.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SellerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalLeads: 0,
    activeProducts: 0,
    recentLeads: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch products and leads data
        const [productsResponse, leadsResponse] = await Promise.all([
          productAPI.getAll({ sellerId: user._id }),
          leadAPI.getForSeller()
        ]);
        
        const products = productsResponse.data.products || [];
        const leads = leadsResponse.data.leads || [];
        
        setStats({
          totalProducts: products.length,
          activeProducts: products.filter(p => p.isActive).length,
          totalLeads: leads.length,
          recentLeads: leads.slice(0, 5)
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user._id]);

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Products',
      value: stats.activeProducts,
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'bg-purple-500'
    }
    // {
    //   title: 'Revenue',
    //   value: '$0',
    //   icon: DollarSign,
    //   color: 'bg-orange-500'
    // }
  ];

  if (loading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SellerLayout>
    );
  }

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} rounded-lg p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Leads</h2>
          </div>
          <div className="p-6">
            {stats.recentLeads.length > 0 ? (
              <div className="space-y-4">
                {stats.recentLeads.map((lead) => (
                  <div key={lead._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{lead.buyerContact?.companyName || 'Unknown Company'}</p>
                      <p className="text-sm text-gray-600">{lead.message}</p>
                      <p className="text-xs text-gray-500">Quantity: {lead.quantity}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        lead.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {lead.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No leads yet</p>
            )}
          </div>
        </div>

        {/* All Leads Section */}
        <AllLeadsSection />
      </div>
    </SellerLayout>
  );
};

export default SellerDashboard;