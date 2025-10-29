import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, MessageSquare, TrendingUp, Clock, Headphones } from 'lucide-react';
import { adminAPI } from '../../services/apiWithToast';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/layout/AdminLayout';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBuyers: 0,
    totalSellers: 0,
    pendingSellers: 0,
    activeSellers: 0,
    totalInquiries: 0,
    recentInquiries: 0
  });
  const [pendingSellers, setPendingSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const toast = { success: showSuccess, error: showError, info: showInfo, warning: showWarning };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, sellersResponse] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getPendingSellers()
      ]);
      
      setStats(statsResponse.data);
      setPendingSellers(sellersResponse.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSellerAction = async (sellerId, action) => {
    try {
      if (action === 'approve') {
        await adminAPI.approveSeller(sellerId);
        toast.success('Seller approved successfully');
      } else {
        const reason = prompt('Please enter rejection reason (required):');
        if (!reason) return;
        await adminAPI.rejectSeller(sellerId, reason);
        toast.success('Seller rejected successfully');
      }
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      toast.error(`Failed to ${action} seller`);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text', 'bg').replace('600', '100')}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage users, sellers, and monitor platform activity</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Buyers"
            value={stats.totalBuyers}
            icon={Users}
            color="text-blue-600"
          />
          <StatCard
            title="Total Sellers"
            value={stats.totalSellers}
            icon={UserCheck}
            color="text-green-600"
            subtitle={`${stats.activeSellers} active`}
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingSellers}
            icon={Clock}
            color="text-yellow-600"
          />
          <StatCard
            title="Total Inquiries"
            value={stats.totalInquiries}
            icon={MessageSquare}
            color="text-purple-600"
            subtitle={`${stats.recentInquiries} this week`}
          />
          <StatCard
            title="Platform Growth"
            value={`${stats.totalBuyers + stats.totalSellers}`}
            icon={TrendingUp}
            color="text-indigo-600"
            subtitle="Total users"
          />
        </div>

        {/* Pending Sellers Section */}
        <div className="bg-white shadow-md rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Pending Seller Approvals</h2>
            <p className="text-gray-600">Review and approve new seller registrations</p>
          </div>
          
          {pendingSellers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No pending seller approvals</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingSellers.map((seller) => (
                <div key={seller._id} className="p-6 flex items-center justify-between">
                  {/* Left side clickable -> goes to full detail */}
                  <Link
                    to={`/admin/sellers/${seller._id}`}
                    className="flex-1 block group cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {seller.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:underline">
                          {seller.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{seller.email}</p>
                        {seller.companyName && (
                          <p className="text-sm text-gray-500 truncate">{seller.companyName}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {seller.phone && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          📞 {seller.phone}
                        </span>
                      )}
                      {seller.gstNumber && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          GST: {seller.gstNumber}
                        </span>
                      )}
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Registered: {new Date(seller.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                  
                  {/* Right side actions stay as-is */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleSellerAction(seller._id, 'approve')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleSellerAction(seller._id, 'reject')}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Messages moved to dedicated page; link available in Quick Actions */}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/buyers" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Buyers</h3>
            <p className="text-sm text-gray-500">View and manage buyer accounts</p>
          </Link>
          
          <Link to="/admin/sellers" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
            <UserCheck className="h-8 w-8 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Sellers</h3>
            <p className="text-sm text-gray-500">View sellers and memberships</p>
          </Link>
          
          <Link to="/admin/messages" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
            <MessageSquare className="h-8 w-8 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Messages</h3>
            <p className="text-sm text-gray-500">View and respond to seller messages</p>
          </Link>

          <Link to="/admin/inquiries" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
            <MessageSquare className="h-8 w-8 text-purple-600 mb-2" />
            <h3 className="font-medium text-gray-900">View Inquiries</h3>
            <p className="text-sm text-gray-500">Track all platform inquiries</p>
          </Link>
          
          <Link to="/admin/support-tickets" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
            <Headphones className="h-8 w-8 text-orange-600 mb-2" />
            <h3 className="font-medium text-gray-900">Support Tickets</h3>
            <p className="text-sm text-gray-500">Manage customer support requests</p>
          </Link>
          
          <Link to="/admin/analytics" className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow text-left">
            <TrendingUp className="h-8 w-8 text-indigo-600 mb-2" />
            <h3 className="font-medium text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-500">View detailed reports</p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;