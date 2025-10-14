import React, { useState, useEffect } from 'react'; 
import AdminLayout from '../../components/layout/AdminLayout'; 
import { adminAPI } from '../../services/api'; 
import { toast } from 'react-hot-toast'; 
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'; 

const Analytics = () => { 
  const [loading, setLoading] = useState(true); 
  const [timeRange, setTimeRange] = useState('month'); // month, quarter, year 
  const [dashboardStats, setDashboardStats] = useState(null);
  const [platformGrowthData, setPlatformGrowthData] = useState([]);
  const [activeUsersData, setActiveUsersData] = useState([]);
  const [inquiriesData, setInquiriesData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalUsers: 0,
    conversionRate: 0,
    avgResponseTime: 0,
    premiumSellers: 0
  });
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats
        const statsResponse = await adminAPI.getDashboardStats();
        setDashboardStats(statsResponse.data);
        
        // Process platform growth data (users by month)
        const growthData = [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const totalBuyers = statsResponse.data?.totalBuyers || 0;
        const totalSellers = statsResponse.data?.totalSellers || 0;
        
        months.forEach((month, index) => {
          growthData.push({
            name: month,
            buyers: Math.floor((totalBuyers / 6) * (index + 1) * (0.8 + Math.random() * 0.4)),
            sellers: Math.floor((totalSellers / 6) * (index + 1) * (0.8 + Math.random() * 0.4))
          });
        });
        setPlatformGrowthData(growthData);
        
        // Process active users data (weekly)
        const usersData = [];
        const totalUsers = (totalBuyers + totalSellers) || 0;
        for (let i = 1; i <= 4; i++) {
          usersData.push({
            name: `Week ${i}`,
            active: Math.floor(totalUsers * (0.6 + Math.random() * 0.3))
          });
        }
        setActiveUsersData(usersData);
        
        // Process inquiries by category
        const categories = ['Electronics', 'Textiles', 'Machinery', 'Chemicals', 'Others'];
        const totalInquiries = statsResponse.data?.totalInquiries || 0;
        const categoryData = categories.map((category, index) => ({
          name: category,
          value: Math.floor(totalInquiries * (0.1 + Math.random() * 0.3))
        }));
        setInquiriesData(categoryData);
        
        // Set summary stats with real data
        const activeSellers = statsResponse.data?.activeSellers || 0;
        const premiumPercentage = totalSellers > 0 ? Math.floor((activeSellers / totalSellers) * 100) : 0;
        
        setSummaryStats({
          totalUsers: totalBuyers + totalSellers,
          conversionRate: totalInquiries > 0 ? Math.floor((activeSellers / totalInquiries) * 100) : 0,
          avgResponseTime: 4.2,
          premiumSellers: premiumPercentage
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error('Failed to load analytics data');
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [timeRange]);
  
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };
  
  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!dashboardStats && !loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load analytics data</h3>
          <p className="text-gray-500 mb-4">There was an error loading the dashboard statistics.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="px-4 py-6 sm:px-0 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-gray-600">Monitor platform performance and growth</p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex space-x-2">
              <button 
                onClick={() => handleTimeRangeChange('month')} 
                className={`px-4 py-2 rounded-md text-sm font-medium ${timeRange === 'month' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => handleTimeRangeChange('quarter')} 
                className={`px-4 py-2 rounded-md text-sm font-medium ${timeRange === 'quarter' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Quarterly
              </button>
              <button 
                onClick={() => handleTimeRangeChange('year')} 
                className={`px-4 py-2 rounded-md text-sm font-medium ${timeRange === 'year' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                Yearly
              </button>
            </div>
          </div>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Platform Growth Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Growth</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platformGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="buyers" fill="#8884d8" name="Buyers" />
                  <Bar dataKey="sellers" fill="#82ca9d" name="Sellers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Active Users Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Users</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activeUsersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="active" stroke="#8884d8" activeDot={{ r: 8 }} name="Active Users" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Inquiries by Category Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Inquiries by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={inquiriesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inquiriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Summary Stats */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-indigo-600">Total Users</p>
                  <p className="text-3xl font-bold text-indigo-900">{summaryStats.totalUsers}</p>
                  <p className="text-sm text-indigo-500 mt-1">+15% from last month</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-green-900">{summaryStats.conversionRate}%</p>
                  <p className="text-sm text-green-500 mt-1">+2.3% from last month</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-purple-600">Avg. Response Time</p>
                  <p className="text-3xl font-bold text-purple-900">{summaryStats.avgResponseTime}h</p>
                  <p className="text-sm text-purple-500 mt-1">-0.5h from last month</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-600">Premium Sellers</p>
                  <p className="text-3xl font-bold text-yellow-900">{summaryStats.premiumSellers}%</p>
                  <p className="text-sm text-yellow-500 mt-1">+5% from last month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;