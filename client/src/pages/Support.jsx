import React from 'react';
import { Link } from 'react-router-dom';
import SupportTicket from '../components/SupportTicket';
import { Headphones, MessageCircle, Clock, CheckCircle, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Support = () => {
  // const { user } = useAuth();

  // If user is not logged in, show login prompt
  // if (!user) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow-lg p-8">
  //         <LogIn className="h-16 w-16 text-[#2f3284] mx-auto mb-6" />
  //         <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
  //         <p className="text-gray-600 mb-6">
  //           You need to log in first to create a support ticket.
  //         </p>
  //         <div className="space-y-3">
  //           <Link 
  //             to="/login" 
  //             className="block w-full bg-[#2f3284] hover:bg-[#2f3284] text-white font-medium py-3 px-4 rounded-lg transition-colors"
  //           >
  //             Login 
  //           </Link>
  //           <Link 
  //             to="/register" 
  //             className="block w-full bg-[#ff6600] hover:bg-[#ff6600] text-white font-medium py-3 px-4 rounded-lg transition-colors"
  //           >
  //             Create New Account
  //           </Link>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Headphones className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Customer Support</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Need help? We're here to assist you. Create a support ticket and our team will get back to you promptly.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-600">Simple steps to get the help you need</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Describe Your Issue</h3>
            <p className="text-gray-600">Tell us about your problem in detail</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Get Ticket Number</h3>
            <p className="text-gray-600">Receive a unique ticket number for tracking</p>
          </div>
          
          <div className="text-center">
            <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">3. We Review</h3>
            <p className="text-gray-600">Our support team reviews your request</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Get Response</h3>
            <p className="text-gray-600">Receive a solution or follow-up</p>
          </div>
        </div>
      </div>

      {/* Ticket Tracking Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Track Your Ticket</h2>
            <p className="text-gray-600 mb-6">Already submitted a ticket? Track its progress here</p>
            <Link 
              to="/track-ticket"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Track Ticket Status
            </Link>
          </div>
        </div>
      </div>

      {/* Support Ticket Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <SupportTicket />
      </div>

      {/* Contact Information */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Other Ways to Reach Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
                <p className="text-gray-600">support@niryatbusiness.com</p>
                <p className="text-sm text-gray-500 mt-1">Response within 24 hours</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Headphones className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
                <p className="text-gray-600">+1 (555) 123-4567</p>
                <p className="text-sm text-gray-500 mt-1">Mon-Fri, 9 AM - 6 PM</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
                <p className="text-gray-600">Available on website</p>
                <p className="text-sm text-gray-500 mt-1">Mon-Fri, 9 AM - 6 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Track Ticket Button (Bottom-Right) */}
      <Link 
        to="/track-ticket"
        aria-label="Track your support ticket status"
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Track Ticket</span>
      </Link>
    </div>
  );
};

export default Support;