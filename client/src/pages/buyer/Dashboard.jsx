import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { rfqAPI } from '../../services/api';
import BuyerLayout from '../../components/layout/BuyerLayout';
import { FileText, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRFQs: 0,
    pendingRFQs: 0,
    respondedRFQs: 0,
    recentRFQs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await rfqAPI.getBuyerRFQs();
        const rfqs = response.data.rfqs || [];
        
        setStats({
          totalRFQs: rfqs.length,
          pendingRFQs: rfqs.filter(rfq => rfq.status === 'pending').length,
          respondedRFQs: rfqs.filter(rfq => rfq.status === 'quoted').length,
          recentRFQs: rfqs.slice(0, 5)
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
      title: 'Total RFQs',
      value: stats.totalRFQs,
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending RFQs',
      value: stats.pendingRFQs,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Responded RFQs',
      value: stats.respondedRFQs,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Response Rate',
      value: stats.totalRFQs > 0 ? `${Math.round((stats.respondedRFQs / stats.totalRFQs) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      quoted: { color: 'bg-green-100 text-green-800', text: 'Seller Responded' },
      accepted: { color: 'bg-blue-100 text-blue-800', text: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      expired: { color: 'bg-gray-100 text-gray-800', text: 'Expired' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
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
          <p className="text-gray-600 mt-2">Here's an overview of your RFQ activities</p>
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

        {/* Recent RFQs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent RFQs</h2>
          </div>
          <div className="p-6">
            {stats.recentRFQs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No RFQs submitted yet</p>
                <p className="text-sm text-gray-400 mt-2">Start by browsing products and requesting quotes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentRFQs.map((rfq) => (
                  <div key={rfq._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          RFQ #{rfq.rfqNumber}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Product: {rfq.productId?.title || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Quantity: {rfq.quantity} units
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted: {new Date(rfq.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(rfq.status)}
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