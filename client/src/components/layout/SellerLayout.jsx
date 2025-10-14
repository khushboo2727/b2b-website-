import React from 'react';
import SellerSidebar from './SellerSidebar';
import AdminChatbot from '../AdminChatbot';

const SellerLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <SellerSidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      
      {/* Admin Chatbot - Available on all seller pages */}
      <AdminChatbot />
    </div>
  );
};

export default SellerLayout;