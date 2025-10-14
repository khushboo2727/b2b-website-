import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  UserCheck, 
  MessageSquare, 
  BarChart3, 
  Settings,
  LogOut,
  ShieldAlert,
  Headphones
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: Home
    },
    {
      name: 'Manage Buyers',
      path: '/admin/buyers',
      icon: Users
    },
    {
      name: 'Manage Sellers',
      path: '/admin/sellers',
      icon: UserCheck
    },
    {
      name: 'View Inquiries',
      path: '/admin/inquiries',
      icon: MessageSquare
    },
    {
      name: 'Support Tickets',
      path: '/admin/support-tickets',
      icon: Headphones
    },
    {
      name: 'Analytics',
      path: '/admin/analytics',
      icon: BarChart3
    },
    {
      name: 'Settings',
      path: '/admin/settings',
      icon: Settings
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="bg-indigo-900 h-full shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-6 w-6 text-white" />
          <h2 className="text-xl font-bold text-white">Admin Portal</h2>
        </div>
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
          className="inline-flex items-center px-16 py-2 text-sm font-medium text-indigo-100 rounded-lg hover:bg-indigo-800 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;