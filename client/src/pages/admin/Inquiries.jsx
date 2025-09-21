import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { adminAPI } from '../../services/apiWithToast';
import { toast } from 'react-hot-toast';
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Inquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // NEW: Filters state
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // NEW: Pie chart colors
  const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#84CC16', '#E11D48'];
  
  // Dummy data for initial development
  const dummyInquiries = [
    { _id: '1', inquiryId: 'INQ001', buyerName: 'John Doe', productName: 'Industrial Machinery', message: 'Looking for bulk purchase options', date: '2023-08-15T10:30:00Z', status: 'new' },
    { _id: '2', inquiryId: 'INQ002', buyerName: 'Jane Smith', productName: 'Organic Cotton Textiles', message: 'Interested in your organic cotton products', date: '2023-08-14T14:20:00Z', status: 'contacted' },
    { _id: '3', inquiryId: 'INQ003', buyerName: 'Robert Johnson', productName: 'Solar Panels', message: 'Need information about your solar panel efficiency', date: '2023-08-12T09:15:00Z', status: 'closed' },
    { _id: '4', inquiryId: 'INQ004', buyerName: 'Emily Davis', productName: 'Handcrafted Furniture', message: 'Requesting catalog and pricing for bulk order', date: '2023-08-10T11:45:00Z', status: 'new' },
    { _id: '5', inquiryId: 'INQ005', buyerName: 'Michael Wilson', productName: 'Spices and Herbs', message: 'Looking for export quality spices', date: '2023-08-08T16:30:00Z', status: 'contacted' },
  ];

  useEffect(() => {
    // In a real implementation, this would fetch from the API
    // const fetchInquiries = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await adminAPI.getInquiries({
    //       sort: sortField,
    //       order: sortDirection,
    //       search: searchTerm || undefined,
    //       status: statusFilter !== 'all' ? statusFilter : undefined,
    //       product: productFilter !== 'all' ? productFilter : undefined,
    //       startDate: startDate || undefined,
    //       endDate: endDate || undefined
    //     });
    //     setInquiries(response.data.inquiries);
    //   } catch (error) {
    //     toast.error('Failed to load inquiries');
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    // Using dummy data for now
    setTimeout(() => {
      // Sort the dummy data based on current sort settings
      const sortedInquiries = [...dummyInquiries].sort((a, b) => {
        if (sortField === 'date') {
          return sortDirection === 'asc' 
            ? new Date(a.date) - new Date(b.date)
            : new Date(b.date) - new Date(a.date);
        } else if (sortField === 'buyerName') {
          return sortDirection === 'asc'
            ? a.buyerName.localeCompare(b.buyerName)
            : b.buyerName.localeCompare(a.buyerName);
        } else if (sortField === 'inquiryId') {
          return sortDirection === 'asc'
            ? a.inquiryId.localeCompare(b.inquiryId)
            : b.inquiryId.localeCompare(a.inquiryId);
        }
        return 0;
      });

      // Search filter
      let result = searchTerm
        ? sortedInquiries.filter(inquiry => 
            inquiry.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inquiry.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inquiry.inquiryId.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : sortedInquiries;

      // NEW: Apply additional filters
      if (statusFilter !== 'all') {
        result = result.filter(i => i.status === statusFilter);
      }
      if (productFilter !== 'all') {
        result = result.filter(i => i.productName === productFilter);
      }
      if (startDate) {
        const sd = new Date(startDate);
        result = result.filter(i => new Date(i.date) >= sd);
      }
      if (endDate) {
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        result = result.filter(i => new Date(i.date) <= ed);
      }

      setInquiries(result);
      setLoading(false);
    }, 500);
  }, [sortField, sortDirection, searchTerm, statusFilter, productFilter, startDate, endDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already triggered by the useEffect dependency
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // NEW: Product options for filter
  const productOptions = useMemo(() => {
    return Array.from(new Set(dummyInquiries.map(d => d.productName)));
  }, []);

  useEffect(() => {
    // In a real implementation, this would fetch from the API
    // const fetchInquiries = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await adminAPI.getInquiries({
    //       sort: sortField,
    //       order: sortDirection,
    //       search: searchTerm || undefined,
    //       status: statusFilter !== 'all' ? statusFilter : undefined,
    //       product: productFilter !== 'all' ? productFilter : undefined,
    //       startDate: startDate || undefined,
    //       endDate: endDate || undefined
    //     });
    //     setInquiries(response.data.inquiries);
    //   } catch (error) {
    //     toast.error('Failed to load inquiries');
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    // Using dummy data for now
    setTimeout(() => {
      // Sort the dummy data based on current sort settings
      const sortedInquiries = [...dummyInquiries].sort((a, b) => {
        if (sortField === 'date') {
          return sortDirection === 'asc' 
            ? new Date(a.date) - new Date(b.date)
            : new Date(b.date) - new Date(a.date);
        } else if (sortField === 'buyerName') {
          return sortDirection === 'asc'
            ? a.buyerName.localeCompare(b.buyerName)
            : b.buyerName.localeCompare(a.buyerName);
        } else if (sortField === 'inquiryId') {
          return sortDirection === 'asc'
            ? a.inquiryId.localeCompare(b.inquiryId)
            : b.inquiryId.localeCompare(a.inquiryId);
        }
        return 0;
      });

      // Search filter
      let result = searchTerm
        ? sortedInquiries.filter(inquiry => 
            inquiry.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inquiry.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inquiry.inquiryId.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : sortedInquiries;

      // NEW: Apply additional filters
      if (statusFilter !== 'all') {
        result = result.filter(i => i.status === statusFilter);
      }
      if (productFilter !== 'all') {
        result = result.filter(i => i.productName === productFilter);
      }
      if (startDate) {
        const sd = new Date(startDate);
        result = result.filter(i => new Date(i.date) >= sd);
      }
      if (endDate) {
        const ed = new Date(endDate);
        ed.setHours(23, 59, 59, 999);
        result = result.filter(i => new Date(i.date) <= ed);
      }

      setInquiries(result);
      setLoading(false);
    }, 500);
  }, [sortField, sortDirection, searchTerm, statusFilter, productFilter, startDate, endDate]);

  // NEW: Chart data computed from filtered inquiries
  const productChartData = useMemo(() => {
    const counts = inquiries.reduce((acc, cur) => {
      acc[cur.productName] = (acc[cur.productName] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [inquiries]);

  // NEW: Reset filters
  const resetFilters = () => {
    setStatusFilter('all');
    setProductFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">View Inquiries</h1>

        {/* NEW: Filter Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Product</label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All</option>
                {productOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-3">
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by buyer, product, or inquiry ID..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>

        {/* NEW: Product-wise Pie Chart */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Inquiries by Product</h2>
          <div className="h-72">
            {productChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productChartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label
                  >
                    {productChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500">No data to display</p>
            )}
          </div>
        </div>

        {/* Inquiries Table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No inquiries found matching your criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('inquiryId')}
                    >
                      <div className="flex items-center">
                        Inquiry ID
                        <SortIcon field="inquiryId" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('buyerName')}
                    >
                      <div className="flex items-center">
                        Buyer Name
                        <SortIcon field="buyerName" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center">
                        Date
                        <SortIcon field="date" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{inquiry.inquiryId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{inquiry.buyerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{inquiry.productName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 truncate max-w-xs">{inquiry.message}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(inquiry.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inquiry.status === 'new' ? 'bg-green-100 text-green-800' : inquiry.status === 'contacted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Inquiries;