import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  FileText, 
  MessageSquare, 
  Settings,
  LogOut,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BuyerSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/buyer/dashboard',
      icon: Home
    },
    {
      name: 'My RFQs',
      path: '/buyer/rfqs',
      icon: FileText
    },
    {
      name: 'Browse Products',
      path: '/',
      icon: ShoppingCart
    },
    {
      name: 'Profile',
      path: '/buyer/profile',
      icon: User
    },
    {
      name: 'Messages',
      path: '/buyer/messages',
      icon: MessageSquare
    },
    {
      name: 'Settings',
      path: '/buyer/settings',
      icon: Settings
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-white h-full shadow-lg border-r border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800">Buyer Portal</h2>
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
                      ? 'bg-green-100 text-green-700 border-r-2 border-green-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
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
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default BuyerSidebar;