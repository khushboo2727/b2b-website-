import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  Package, 
  Plus, 
  BarChart3, 
  Users,
  Settings,
  LogOut,
  FileText,
  Headphones
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SellerSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/seller/dashboard',
      icon: Home
    },
    {
      name: 'Profile',
      path: '/seller/profile',
      icon: User
    },
    {
      name: 'Add Product',
      path: '/seller/products/add',
      icon: Plus
    },
    {
      name: 'My Products',
      path: '/seller/products',
      icon: Package
    },
    // {
    //   name: 'Leads',
    //   path: '/seller/leads',
    //   icon: BarChart3
    // },
    {
      name: 'RFQs',
      path: '/seller/rfqs',
      icon: FileText
    },
    // {
    //   name: 'All Leads',
    //   path: '/seller/all-leads',
    //   icon: Users
    // },
    {
      name: 'Settings',
      path: '/seller/settings',
      icon: Settings
    }
    ,
    {
      name: 'Support',
      path: '/support',
      icon: Headphones
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-indigo-900 h-full shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white">Seller Portal</h2>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-indigo-700 text-white'
                      : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <button
          onClick={logout}
          className="inline-flex w-25 items-center px-16 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-indigo-800 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default SellerSidebar;