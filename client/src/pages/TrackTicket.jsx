import React, { useState } from 'react';
import { Search, Clock, CheckCircle, AlertCircle, XCircle, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TrackTicket = () => {
  const [ticketNumber, setTicketNumber] = useState('');
  const [email, setEmail] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const statusColors = {
    'Open': { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle },
    'In Progress': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    'Resolved': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    'Closed': { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle }
  };

  const handleTrackTicket = async (e) => {
    e.preventDefault();
    
    if (!ticketNumber.trim() || !email.trim()) {
      toast.error('Please enter both Ticket Number and Email');
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      const response = await fetch(`/api/tickets/track/${ticketNumber.trim()}?email=${encodeURIComponent(email.trim())}`);
      const result = await response.json();
      
      if (result.success) {
        setTicketData(result.data);
        toast.success('Ticket found!');
      } else {
        setTicketData(null);
        toast.error(result.message || 'Ticket not found or incorrect email');
      }
    } catch (error) {
      console.error('Error tracking ticket:', error);
      setTicketData(null);
      toast.error('There was a problem tracking the ticket');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInHindi = (status) => {
    const statusMap = {
      'Open': 'Open',
      'In Progress': 'In Progress',
      'Resolved': 'Resolved',
      'Closed': 'Closed'
    };
    return statusMap[status] || status;
  };

  const getIssueTypeInHindi = (issueType) => {
    const typeMap = {
      'Technical Issue': 'Technical Issue',
      'Order / Delivery Issue': 'Order / Delivery Issue',
      'Billing / Payment Problem': 'Billing / Payment Problem',
      'Product Query': 'Product Query',
      'Other': 'Other'
    };
    return typeMap[issueType] || issueType;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Support Ticket</h1>
          <p className="text-gray-600">Enter your ticket number and email to view your ticket status</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <form onSubmit={handleTrackTicket} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticket Number
                </label>
                <input
                  type="text"
                  placeholder="e.g., T123456789"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Track Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Ticket Details */}
        {searched && (
          <div className="bg-white rounded-lg shadow-sm border">
            {ticketData ? (
              <div className="p-6">
                {/* Ticket Header */}
                <div className="border-b pb-4 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Ticket #{ticketData.ticketNumber}
                      </h2>
                      <p className="text-gray-600">{getIssueTypeInHindi(ticketData.issueType)}</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      {(() => {
                        const StatusIcon = statusColors[ticketData.status].icon;
                        return (
                          <div className={`inline-flex items-center px-4 py-2 rounded-full ${statusColors[ticketData.status].bg} ${statusColors[ticketData.status].text}`}>
                            <StatusIcon className="h-4 w-4 mr-2" />
                            {getStatusInHindi(ticketData.status)}
                          </div>
                        );
                      })()} 
                    </div>
                  </div>
                </div>

                {/* Ticket Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Ticket Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">Created:</span>
                          <span className="ml-2 font-medium">{formatDate(ticketData.createdAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">Age:</span>
                          <span className="ml-2 font-medium">{ticketData.ageInDays} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Issue Description</h3>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                      {ticketData.description}
                    </p>
                  </div>
                </div>

                {/* Responses */}
                {ticketData.responses && ticketData.responses.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Support Team Responses ({ticketData.responses.length})
                    </h3>
                    <div className="space-y-4">
                      {ticketData.responses.map((response, index) => (
                        <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-blue-900">
                              {response.respondedBy?.name || 'Support Team'}
                            </span>
                            <span className="text-xs text-blue-600">
                              {formatDate(response.respondedAt)}
                            </span>
                          </div>
                          <p className="text-blue-800">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Guide */}
                <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Status Guide:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                      <span><strong>Open:</strong> Your ticket has been received</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                      <span><strong>In Progress:</strong> Our team is working on it</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span><strong>Resolved:</strong> The issue has been resolved</span>
                    </div>
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-gray-600 mr-2" />
                      <span><strong>Closed:</strong> The ticket has been closed</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ticket not found</h3>
                <p className="text-gray-600 mb-4">
                  Please double-check your ticket number and email address
                </p>
                <div className="text-sm text-gray-500">
                  <p>• The ticket number must be in the correct format (e.g., T123456789)</p>
                  <p>• The email address must match the one used when creating the ticket</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Need help?</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• If you cannot find your ticket number, please check your email</p>
            <p>• After creating a ticket, you will receive the ticket number via email</p>
            <p>• If you still face issues, please create a new ticket</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackTicket;