import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leadAPI } from '../../services/api';
import BuyerLayout from '../../components/layout/BuyerLayout';
import { FileText, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    openLeads: 0,
    closedLeads: 0,
    inactiveLeads: 0,
    recentLeads: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await leadAPI.getBuyerLeads();
        const leads = response.data.leads || [];
        
        setStats({
          totalLeads: leads.length,
          openLeads: leads.filter(lead => lead.status === 'open').length,
          closedLeads: leads.filter(lead => lead.status === 'closed').length,
          inactiveLeads: leads.filter(lead => lead.status === 'inactive').length,
          recentLeads: leads.slice(0, 5)
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Open Leads',
      value: stats.openLeads,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Closed Leads',
      value: stats.closedLeads,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Inactive Leads',
      value: stats.inactiveLeads,
      icon: XCircle,
      color: 'bg-gray-500'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { color: 'bg-yellow-100 text-yellow-800', text: 'Open' },
      closed: { color: 'bg-green-100 text-green-800', text: 'Closed' },
      inactive: { color: 'bg-gray-100 text-gray-800', text: 'Inactive' }
    };
    
    const config = statusConfig[status] || statusConfig.open;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">Here's an overview of your Lead activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Leads */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
          </div>
          <div className="p-6">
            {stats.recentLeads.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No Leads submitted yet</p>
                <p className="text-sm text-gray-400 mt-2">Start by browsing products and sending inquiries</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentLeads.map((lead) => (
                  <div key={lead._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">Lead</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Product: {lead.productId?.title || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantity: {lead.quantity || 1} units
                        </p>
                        {lead.budget && (
                          <p className="text-sm text-gray-600">Budget: ₹{lead.budget}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted: {new Date(lead.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(lead.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </BuyerLayout>
  );
};

export default BuyerDashboard;