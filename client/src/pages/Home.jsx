import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Eye, ChevronDown } from 'lucide-react';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    sortBy: 'createdAt'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Dummy auth (replace with real auth context)
  const [user, setUser] = useState({ name: "Khushboo Gupta", email: "demo@test.com" });
  const navigate = useNavigate();

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        ...filters,
        page: 1,
        limit: 12
      };
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await productAPI.getAll(params);
      setProducts(response.data.products || response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      sortBy: 'createdAt'
    });
    setSearchTerm('');
  };

  const handleLogout = () => {
    setUser(null);
    toast.success("Logged out successfully");
    navigate("/");
  };

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img
          src={product.images?.[0] || '/api/placeholder/300/200'}
          alt={product.title || product.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2 bg-white rounded-full p-1">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
          {product.title || product.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        <div className="mb-3">
          <span className="text-sm text-gray-500">
            MOQ: {product.minimumOrderQuantity ?? '—'}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{product.sellerLocation || 'Location'}</span>
        </div>
        
        <div className="flex gap-2">
          <Link
            to={`/product/${product._id}`}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-center text-sm font-medium"
          >
            <Eye className="h-4 w-4 inline mr-1" />
            View Details
          </Link>
          <button className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-200 text-sm font-medium">
            Inquire
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Navbar */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">
            Indoorsy
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link to="/membership" className="text-gray-700 hover:text-blue-600 font-medium">
              Membership
            </Link>
            
            {user ? (
              <div className="relative group">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg border opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition">
                  <Link 
                    to="/dashboard"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#2F3284] to-[#2F3254] text-white py-16">   
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Find Quality Products
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Connect with verified suppliers and manufacturers
            </p>
            
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search products, categories, or suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Filters + Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top bar: Filters toggle and Clear */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded-md hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700">Sort by:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="bg-white border px-3 py-2 rounded-md"
            >
              <option value="createdAt">Newest</option>
              <option value="priceRange.min">Price: Low to High</option>
              <option value="priceRange.max">Price: High to Low</option>
            </select>

            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Category</label>
                <input
                  type="text"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  placeholder="e.g. Electronics"
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Min Price</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="0"
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Max Price</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="100000"
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Location</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="City/State/Pincode"
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="w-full h-48 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        ) : (
          <div className="bg-white border rounded-lg p-10 text-center text-gray-600">
            Koi product nahi mila. Filters/Keywords change karke try karein.
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
