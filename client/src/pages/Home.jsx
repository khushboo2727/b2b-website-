import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Eye, ChevronDown, ChevronRight, Shield, Truck, CreditCard, Headphones, BadgeCheck, Menu, X } from 'lucide-react';
import { productAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

import { useAuth } from '../context/AuthContext';
// 

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
  const [expandedCategory, setExpandedCategory] = useState(null); // NEW: Track expanded category
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Real auth context
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const toast = { success: showSuccess, error: showError, info: showInfo, warning: showWarning };

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
    logout();
    navigate('/');
  };

  // Center hero search submit handler — navigates to Products page
  const handleHeroSearch = (e) => {
    e.preventDefault();
    const term = (searchTerm || '').trim();
    navigate(term ? `/products?search=${encodeURIComponent(term)}` : '/products');
  };

  // Suggestions state and debounced fetch
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    const q = (searchTerm || '').trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    const t = setTimeout(async () => {
      try {
        const resp = await productAPI.getSearchSuggestions(q);
        const items = resp?.data || [];
        setSuggestions(items);
        setShowSuggestions(items.length > 0);
      } catch (err) {
        // ignore
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSuggestionClick = (text) => {
    setShowSuggestions(false);
    navigate(`/products?search=${encodeURIComponent(text)}`);
  };

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img
          src={product.images?.[0] || 'https://placehold.co/300x200'}
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

  // NEW: Sidebar categories + hero slides
  const sidebarCategories = [
    {
      name: 'Machinery & Parts',
      subcategories: ['CNC Machines', 'Plastic Machinery', 'Food Processing', 'Textile Machinery', 'Industrial Equipment']
    },
    {
      name: 'Electronics & Electricals',
      subcategories: ['LED Lights', 'Cables & Wires', 'Switches', 'Electronic Components', 'Power Equipment']
    },
    {
      name: 'Textiles & Garments',
      subcategories: ['Fabrics', 'Readymade Garments', 'Home Textiles', 'Yarn', 'Textile Machinery']
    },
    {
      name: 'Furniture & Decor',
      subcategories: ['Home Furniture', 'Office Furniture', 'Outdoor Furniture', 'Decor Items', 'Lighting']
    },
    {
      name: 'Automobile & Spares',
      subcategories: ['Auto Parts', 'Motorcycle Parts', 'Tires & Wheels', 'Batteries', 'Lubricants']
    },
    {
      name: 'Construction & Hardware',
      subcategories: ['Building Materials', 'Hardware Tools', 'Plumbing', 'Electrical Supplies', 'Safety Equipment']
    },
    {
      name: 'Food & Beverages',
      subcategories: ['Processed Foods', 'Beverages', 'Spices & Seasonings', 'Dairy Products', 'Snacks']
    },
    {
      name: 'Health & Beauty',
      subcategories: ['Cosmetics', 'Personal Care', 'Health Supplements', 'Medical Equipment', 'Ayurvedic Products']
    },
    {
      name: 'Handicrafts & Gifts',
      subcategories: ['Handicrafts', 'Decorative Items', 'Gifts & Novelties', 'Artwork', 'Traditional Crafts']
    },
    {
      name: 'Stationery & Office',
      subcategories: ['Office Supplies', 'Writing Instruments', 'Paper Products', 'Office Equipment', 'School Supplies']
    },
    {
      name: 'IT Services',
      subcategories: ['Software Development', 'Web Design', 'Digital Marketing', 'IT Consulting', 'Mobile Apps']
    },
    {
      name: 'More Categories',
      subcategories: []
    }
  ];

  // Categories cards data (same as Categories.jsx)
  const categoriesSections = [
    {
      title: 'Industrial Supplies',
      image: '/images/categories/manufacture-steel-machine-with-control-computer-clear-room.jpg',
      columns: [
        { heading: 'Manufacturing & Processing Machinery', items: ['CNC Machines', 'Plastic Machinery', 'Food Processing', 'Textile Machinery', 'Woodworking'] },
        { heading: 'Industrial Equipment & Components', items: ['Bearings', 'Pumps', 'Valves', 'Compressors', 'Hydraulics & Pneumatics'] },
        { heading: 'Materials', items: ['Metals & Alloys', 'Plastics & Rubber', 'Composites', 'Industrial Ceramics', 'Abrasives'] },
        { heading: 'Packaging & Printing', items: ['Packaging Machines', 'Bottling', 'Labels & Tags', 'Printing Machinery', 'Cartons & Boxes'] },
      ],
    },
    {
      title: 'Home & Security',
      image: '/images/categories/Untitled design (6).png',
      columns: [
        { heading: 'Construction & Decoration', items: ['Doors & Windows', 'Flooring', 'Sanitary Ware', 'Tiles', 'Kitchen'] },
        { heading: 'Lights & Lighting', items: ['LED Lights', 'Outdoor Lighting', 'Commercial Lighting', 'Smart Lighting', 'Components'] },
        { heading: 'Furniture', items: ['Home Furniture', 'Office Furniture', 'Outdoor Furniture', 'Hotel Furniture', 'Kids Furniture'] },
        { heading: 'Security & Protection', items: ['CCTV', 'Access Control', 'Alarm', 'Safes', 'Locks & Keys'] },
      ],
    },
    {
      title: 'Transportation & Sporting Goods',
      image: '/images/categories/bicycle.png',
      columns: [
        { heading: 'Auto, Motorcycle Parts & Accessories', items: ['Auto Parts', 'Motorcycle Parts', 'Tires & Wheels', 'Batteries', 'Lubricants'] },
        { heading: 'Transport', items: ['E-Bikes', 'Electric Vehicles', 'Bicycles', 'ATVs', 'Scooters'] },
        { heading: 'Service', items: ['Maintenance', 'Repair', 'Logistics', 'Testing', 'Customization'] },
        { heading: 'Sporting Goods & Recreation', items: ['Fitness', 'Outdoor Sports', 'Camping', 'Water Sports', 'Games & Toys'] },
      ],
    },
  ];

  const promoSlides = [
    { title: 'Embrace Eco-Friendly Living', subtitle: 'Sustainable products for modern homes.', image: '/images/banners/EcoFriendly.png' },
    { title: 'Your Gateway to Global Trade', subtitle: 'Discover authentic suppliers, verified exporters & genuine buyers.', image: '/images/banners/banner2.png' },
    { title: 'Together for a World Without Hunger', subtitle: 'Let’s build a future where every plate is full and every life is nourished.', image: '/images/banners/banner3.png' },
  ];
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % promoSlides.length), 4000);
    return () => clearInterval(t);
  }, []);

  const CategorySidebar = () => (
    <div className="bg-white border rounded-lg divide-y">
      <div className="px-4 py-3 font-semibold">All Categories</div>
      <ul className="text-sm">
        {sidebarCategories.map((category) => (
          <li key={category.name}>
            <button
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50"
              onClick={() => {
                if (category.name === 'More Categories') {
                  navigate('/categories');
                } else if (category.subcategories.length > 0) {
                  setExpandedCategory(expandedCategory === category.name ? null : category.name);
                } else {
                  // Navigate to products page with selected category
                  navigate(`/products?category=${encodeURIComponent(category.name)}`);
                }
              }}
            >
              <span className="truncate">{category.name}</span>
              {category.name === 'More Categories' ? (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedCategory === category.name ? 'rotate-180' : ''
                    }`}
                />
              )}
            </button>

            {/* Subcategories */}
            {category.subcategories.length > 0 && expandedCategory === category.name && (
              <ul className="bg-gray-50 border-t">
                {category.subcategories.map((sub) => (
                  <li key={sub}>
                    <button
                      className="w-full text-left px-8 py-1.5 text-xs text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                      onClick={() => {
                        // Navigate to products page with selected subcategory
                        navigate(`/products?category=${encodeURIComponent(sub)}`);
                      }}
                    >
                      {sub}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  const HeroCarousel = () => (
    <div className="relative bg-white border rounded-lg overflow-hidden">
      <img src={promoSlides[slide].image} alt={promoSlides[slide].title} className="w-full h-48 md:h-[360px] object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

      {/* Removed centered search overlay */}

      <div className="absolute bottom-4 left-4 text-white">
        <h2 className="text-2xl font-bold">{promoSlides[slide].title}</h2>
        <p className="text-sm text-gray-100">{promoSlides[slide].subtitle}</p>
      </div>
      <div className="absolute bottom-3 right-3 flex gap-2">
        {promoSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`w-2.5 h-2.5 rounded-full ${i === slide ? 'bg-white' : 'bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );

  const RightMiniCards = () => (
    <div className="space-y-3">
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">You may like</h3>
        <div className="space-y-3">
          {(products || []).slice(0, 4).map(p => (
            <Link key={p._id} to={`/product/${p._id}`} className="flex items-center gap-3 group">
              <img src={p.images?.[0] || 'https://placehold.co/72x72'} className="w-14 h-14 object-cover rounded border" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium group-hover:text-blue-600 truncate">{p.title || p.name}</div>
                <div className="text-xs text-gray-500 truncate">{p.category || 'Category'}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Announcements</h3>
        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
          <li>Membership launch offer</li>
          <li>Upcoming Expo 2025 registrations</li>
        </ul>
      </div>
    </div>
  );

  const CategoryTiles = () => {
    const tiles = [
      { name: 'Machinery', category: 'Machinery & Parts', image: '/images/categories/manufacture-steel-machine-with-control-computer-clear-room.jpg' },
      { name: 'Electronics', category: 'Electronics & Electricals', image: '/images/categories/phone.png' },
      { name: 'Textiles', category: 'Textiles & Garments', image: '/images/categories/Untitled design (8).png' },
      { name: 'Furniture', category: 'Furniture & Decor', image: '/images/categories/Untitled design (6).png' },
      { name: 'Automobile', category: 'Automobile & Spares', image: '/images/categories/bicycle.png' },
      { name: 'Construction', category: 'Construction & Hardware', image: '/images/categories/construction.png' },
      { name: 'Food & Bev', category: 'Food & Beverages', image: '/images/categories/food.png' },
      { name: 'Beauty', category: 'Health & Beauty', image: '/images/categories/beauty.png' },
      { name: 'Handicrafts', category: 'Handicrafts & Gifts', image: '/images/categories/Untitled design (3).png' },
      { name: 'Stationery', category: 'Stationery & Office', image: '/images/categories/stationary.png' },
      { name: 'IT Services', category: 'IT Services', image: '/images/categories/phone.png' },
      // Empty slots to push More to next row
      { name: '', category: null, isEmpty: true },
      { name: '', category: null, isEmpty: true },
      { name: '', category: null, isEmpty: true },
      { name: '', category: null, isEmpty: true },
      { name: 'More', category: null, image: '/images/categories/chemical&rawmaterial.png' }
    ];

    const handleCategoryClick = (tile) => {
      if (tile.name === 'More') {
        navigate('/categories');
      } else {
        // Navigate to products page with selected category
        navigate(`/products?category=${encodeURIComponent(tile.category)}`);
      }
    };

    return (
      <section className="max-w-9xl mx-auto px-4 mt-6">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Explore Categories</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {tiles.map((tile, index) => {
              if (tile.isEmpty) {
                return <div key={index} className="invisible"></div>;
              }
              return (
                <button
                  key={tile.name}
                  onClick={() => handleCategoryClick(tile)}
                  className="group w-full"
                >
                  <div className="border rounded-lg p-2  bg-white hover:shadow-sm transition text-center cursor-pointer">
                    <img src={tile.image || '/images/categories/manufacture-steel-machine-with-control-computer-clear-room.jpg'} alt={tile.name} className="w-24 h-16 mx-auto mb-2 object-cover rounded" />
                    <div className="text-xs font-medium text-gray-700 group-hover:text-blue-600 truncate">{tile.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const EasySourcing = () => (
    <section className="max-w-9xl mx-auto px-4 mt-6">
      <div className="bg-white border rounded-lg grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2">Easy Sourcing</h3>
          <p className="text-gray-600 text-sm mb-4">Tell us what you need and get quotations from verified suppliers.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/buyer/rfqs');
            }}
            className="space-y-3"
          >
            <input className="w-full border rounded px-3 py-2" placeholder="What are you looking for?" />
            <div className="grid grid-cols-2 gap-3">
              <input className="w-full border rounded px-3 py-2" placeholder="Quantity" />
              <input className="w-full border rounded px-3 py-2" placeholder="Units" />
            </div>
            <input className="w-full border rounded px-3 py-2" placeholder="Your Email" type="email" />
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Get Quotations</button>
          </form>
        </div>
        <div className="relative">
          <img src="https://placehold.co/640x360" alt="Sourcing" className="w-full h-full object-cover" />
        </div>
      </div>
    </section>
  );

  const SecuredTrading = () => (
    <section className="max-w-9xl mx-auto px-4 mt-6">
      <div className="rounded-lg bg-gradient-to-r from-red-600 to-red-500 text-white p-5 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">Secured Trading Service</div>
          <div className="text-sm text-red-100">Payment protection, dispute resolution & on-time delivery assurance</div>
        </div>
        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded border border-white/30">Learn More</button>
      </div>
    </section>
  );

  const SourcingSolutions = () => (
    <section className="max-w-9xl mx-auto px-4 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Shield, title: 'Verified Suppliers', desc: 'Work with vetted manufacturers' },
          { icon: Truck, title: 'Customer Support', desc: ' 24-hour support' },
          { icon: CreditCard, title: 'Secure Payments', desc: 'Escrow-like protection' },
        ].map((i) => (
          <Link
            key={i.title}
            to={i.title === 'Customer Support' ? '/support' : '#'}
            className="bg-white border rounded-lg p-5 flex items-start gap-3 hover:shadow-md transition-shadow duration-200 block"
          >
            <i.icon className="w-8 h-8 text-blue-600" />
            <div>
              <div className="font-semibold">{i.title}</div>
              <div className="text-sm text-gray-600">{i.desc}</div>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4 bg-white border rounded-lg p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-700"><BadgeCheck className="w-5 h-5 text-green-600" /> Buyer Protection</div>
        <Link to="/support" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"><Headphones className="w-5 h-5 text-blue-600" /> 24x7 Support</Link>
        <Link to="/track-ticket" className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"><Eye className="w-5 h-5 text-blue-600" /> Track Ticket</Link>
        <div className="flex items-center gap-2 text-sm text-gray-700"><Shield className="w-5 h-5 text-yellow-600" /> Dispute Resolution</div>
      </div>
    </section>
  );

  // const TradeShows = () => (
  //   <section className="max-w-7xl mx-auto px-4 mt-6">
  //     <div className="bg-white border rounded-lg p-4">
  //       <h3 className="text-lg font-semibold mb-3">Trade Shows</h3>
  //       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //         {[1,2,3].map(i => (
  //           <div key={i} className="border rounded-lg overflow-hidden">
  //             <img src="https://placehold.co/480x200" className="w-full h-32 object-cover" alt="trade" />
  //             <div className="p-3">
  //               <div className="font-medium">Expo {2025 + i} — Global Trade Fair</div>
  //               <div className="text-xs text-gray-500">Pre-register now for early access</div>
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   </section>
  // );

  return (
    <div className="min-h-screen bg-[#fefcfa]">
      {/* ✅ Navbar */}
      {/* ✅ Navbar */}
      <header className="bg-[#2f3284] shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-white shrink-0">NBS World</Link>

            {/* Desktop Search */}
            <form onSubmit={handleHeroSearch} className="hidden md:flex flex-1 max-w-2xl mx-4 relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-l-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                    <div className="max-h-64 overflow-auto">
                      {loadingSuggestions && (
                        <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
                      )}
                      {!loadingSuggestions && suggestions.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">No suggestions</div>
                      )}
                      {!loadingSuggestions && suggestions.map((s, idx) => (
                        <button
                          key={`${s}-${idx}`}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSuggestionClick(s)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <Search className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700 line-clamp-1">{s}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#ff6600] text-white rounded-r-md hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </form>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/post-requirement" className="text-white hover:text-[#ff6600] font-medium transition-colors">Post Requirement</Link>
              {user && user.role !== 'buyer' && (
                <Link to="/membership-plans" className="text-[#ff6600] hover:text-white font-medium transition-colors">Membership</Link>
              )}
              {user ? (
                <div className="relative group">
                  <div className="w-10 h-10 rounded-full bg-[#ff6600] text-white flex items-center justify-center cursor-pointer border-2 border-white/20 hover:border-white transition-colors">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute right-0 mt-0 w-48 bg-white shadow-xl rounded-lg border overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all transform origin-top-right scale-95 group-hover:scale-100 z-50">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      to={user.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="text-white hover:text-[#ff6600] font-medium transition-colors">Sign In</Link>
                  <Link to="/register" className="bg-[#ff6600] hover:bg-[#ff8533] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">Sign Up</Link>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Search - Visible only on mobile */}
          <div className="md:hidden mt-3 pb-2">
            <form onSubmit={handleHeroSearch} className="flex w-full">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2 rounded-l-md border-0 focus:ring-2 focus:ring-[#ff6600]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#ff6600] text-white rounded-r-md"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-white/10 pt-4 pb-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <Link to="/post-requirement" className="block px-3 py-2 text-white hover:bg-white/10 rounded-md transition-colors">Post Requirement</Link>
              {user && user.role !== 'buyer' && (
                <Link to="/membership-plans" className="block px-3 py-2 text-[#ff6600] hover:bg-white/10 rounded-md font-medium transition-colors">Membership</Link>
              )}
              {user ? (
                <>
                  <div className="px-3 py-2 border-t border-white/10 mt-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#ff6600] text-white flex items-center justify-center text-sm">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{user.name}</p>
                        <p className="text-white/70 text-xs">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      to={user.role === 'seller' ? '/seller/dashboard' : '/buyer/dashboard'}
                      className="block py-2 text-white hover:text-[#ff6600] transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button onClick={handleLogout} className="w-full text-left py-2 text-red-300 hover:text-red-400 transition-colors">Logout</button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-4 px-1">
                  <Link to="/login" className="text-center py-2 text-white border border-white/20 rounded-lg hover:bg-white/10 transition-colors">Sign In</Link>
                  <Link to="/register" className="text-center py-2 bg-[#ff6600] text-white rounded-lg hover:bg-[#ff8533] transition-colors">Sign Up</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Top Section: Categories | Hero | Right mini cards */}
      <section className="py-6">
        <div className="max-w-9xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <aside className="hidden lg:block lg:col-span-3">
            <CategorySidebar />
          </aside>

          <div className="lg:col-span-6">
            <HeroCarousel />
          </div>

          <aside className="lg:col-span-3">
            <RightMiniCards />
          </aside>
        </div>
      </section>

      {/* Explore Categories grid */}
      <CategoryTiles />

      {/* Categories Cards snapshot (same design as /categories) */}
      <section className="max-w-9xl mx-auto px-4 mt-6">
        {categoriesSections.map((sec) => (
          <section key={sec.title} className="bg-white border rounded-lg overflow-hidden mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-2 p-4">
                <img src={sec.image} alt={sec.title} className="w-full h-80 object-cover rounded" />
                <h2 className="mt-2 font-semibold">{sec.title}</h2>
              </div>
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4">
                {sec.columns.map((col) => (
                  <div key={col.heading} className="p-4 border-t md:border-l">
                    <h3 className="font-semibold">{col.heading}</h3>
                    <ul className="mt-2 text-sm text-gray-700 space-y-1">
                      {col.items.map((it) => (
                        <li key={it}>
                          <button
                            onClick={() => navigate(`/products?category=${encodeURIComponent(it)}`)}
                            className="hover:text-blue-600 text-left"
                          >
                            {it}
                          </button>
                        </li>
                      ))}
                      <button
                        onClick={() => navigate(`/products?category=${encodeURIComponent(col.heading)}`)}
                        className="text-blue-600 text-sm"
                      >
                        More &gt;
                      </button>
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
        <div className="text-right">
          <Link to="/categories" className="text-sm text-blue-600 hover:underline">View all categories</Link>
        </div>
      </section>

      {/* Selected Trending Products */}
      <section id="products-section" className="max-w-9xl mx-auto px-2 mt-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Selected Trending Products</h3>
            <Link to="/products" className="text-sm text-blue-600 hover:underline">View more</Link>
          </div>
          {/* Subcategory chips under trending section */}
          <div className="mb-4 flex flex-wrap gap-2">
            {Array.from(new Set(sidebarCategories.flatMap(c => c.subcategories))).slice(0, 12).map((sub) => (
              <button
                key={sub}
                onClick={() => navigate(`/products?category=${encodeURIComponent(sub)}`)}
                className="px-3 py-1 text-xs rounded-full border border-gray-300 hover:border-blue-600 hover:text-blue-700 bg-white"
                title={`View products in ${sub}`}
              >
                {sub}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading products...</div>
          ) : products.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.slice(0, 8).map((p) => (
                <div key={p._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="relative">
                    <img src={p.images?.[0] || 'https://placehold.co/300x200'} alt={p.title || p.name} className="w-full h-40 object-cover" />
                    <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-medium text-sm line-clamp-2">{p.title || p.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.category || 'Category'}</div>
                    <div className="mt-3 flex gap-2">
                      <Link to={`/product/${p._id}`} className="flex-1 bg-[#ff6600] text-white py-1.5 px-3 rounded text-xs text-center">View</Link>
                      <button className="bg-green-600 text-white py-1.5 px-3 rounded text-xs">Inquire</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border rounded-lg p-10 text-center text-gray-600">No products found. Try different filters or keywords.</div>
          )}
        </div>
      </section>

      {/* Easy Sourcing */}
      {/* <EasySourcing /> */}

      {/* Secured Trading Service */}
      {/* <SecuredTrading /> */}

      {/* Sourcing Solutions & Trusted Service */}
      <SourcingSolutions />

      {/* Trade Shows */}
      {/* <TradeShows /> */}

      {/* Footer */}
      <footer className="bg-[#ff4d00] text-black">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Niryat Business</h3>
              <p className="text-gray-800 text-sm leading-relaxed">
                India's leading B2B marketplace connecting manufacturers, suppliers, and buyers worldwide.
                Discover quality products and trusted business partners.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-900 hover:text-blue-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-900 hover:text-blue-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-900 hover:text-blue-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/categories" className="text-gray-900 hover:text-blue-700 transition-colors">Categories</a></li>
                <li><a href="/products" className="text-gray-900 hover:text-blue-700 transition-colors">Products</a></li>
                <li><a href="/suppliers" className="text-gray-900 hover:text-blue-700 transition-colors">Suppliers</a></li>
                <li><a href="/post-requirement" className="text-gray-900 hover:text-blue-700 transition-colors">Post Requirement</a></li>
                <li><a href="/membership-plans" className="text-gray-900 hover:text-blue-700 transition-colors">Membership Plans</a></li>
              </ul>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-900 hover:text-blue-700 transition-colors">Trade Assurance</a></li>
                <li><a href="#" className="text-gray-900 hover:text-blue-700 transition-colors">Logistics Service</a></li>
                <li><a href="#" className="text-gray-900 hover:text-blue-700 transition-colors">Inspection Service</a></li>
                <li><a href="#" className="text-gray-900 hover:text-blue-700 transition-colors">Payment Solutions</a></li>
                <li><a href="#" className="text-gray-900 hover:text-blue-700 transition-colors">Customer Support</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Contact Us</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-900 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-900">Unit 202, 2nd Floor,EF3 Mall, Sector 20 A,
                    Faridabad, Haryana 121001</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  <span className="text-gray-900">+91 9999048686</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <span className="text-gray-900">info@niryatbusiness.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-sm text-white">
                © 2024 Niryat Business. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm">
                <a href="#" className="text-gray-900 hover:text-blue-700 transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-900 hover:text-blue-700 transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-900 hover:text-blue-700 transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
