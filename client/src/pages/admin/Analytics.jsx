import React, { useState, useEffect } from 'react'; 
import AdminLayout from '../../components/layout/AdminLayout'; 
import { adminAPI } from '../../services/apiWithToast'; 
import { toast } from 'react-hot-toast'; 
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'; 

const Analytics = () => { 
  const [loading, setLoading] = useState(true); 
  const [timeRange, setTimeRange] = useState('month'); // month, quarter, year 
  
  // Dummy data for charts 
  const platformGrowthData = [ 
    { name: 'Jan', buyers: 20, sellers: 15 }, 
    { name: 'Feb', buyers: 25, sellers: 18 },
    { name: 'Mar', buyers: 30, sellers: 20 },
    { name: 'Apr', buyers: 35, sellers: 22 },
    { name: 'May', buyers: 40, sellers: 25 },
    { name: 'Jun', buyers: 48, sellers: 30 }
  ]; 
  
  const activeUsersData = [
    { name: 'Week 1', active: 150 },
    { name: 'Week 2', active: 180 },
    { name: 'Week 3', active: 200 },
    { name: 'Week 4', active: 250 }
  ];
  
  const inquiriesData = [
    { name: 'Electronics', value: 35 },
    { name: 'Textiles', value: 25 },
    { name: 'Machinery', value: 20 },
    { name: 'Chemicals', value: 15 },
    { name: 'Others', value: 5 }
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  useEffect(() => {
    // In a real application, you would fetch data from the API
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        // const response = await adminAPI.getAnalytics(timeRange);
        // Update state with real data
        
        // For now, we're using dummy data
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
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
                  <p className="text-3xl font-bold text-indigo-900">245</p>
                  <p className="text-sm text-indigo-500 mt-1">+15% from last month</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-green-900">12.5%</p>
                  <p className="text-sm text-green-500 mt-1">+2.3% from last month</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-purple-600">Avg. Response Time</p>
                  <p className="text-3xl font-bold text-purple-900">4.2h</p>
                  <p className="text-sm text-purple-500 mt-1">-0.5h from last month</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-600">Premium Sellers</p>
                  <p className="text-3xl font-bold text-yellow-900">35%</p>
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