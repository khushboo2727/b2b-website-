import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { productAPI, leadAPI } from '../../services/api';
import SellerLayout from '../../components/layout/SellerLayout';
import { Package, Users, TrendingUp, DollarSign } from 'lucide-react';

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
      </div>
    </SellerLayout>
  );
};

export default SellerDashboard;