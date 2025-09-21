import React, { useState, useEffect } from 'react';
import { messageAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { MessageCircle, Mail, MailOpen, Filter, User, Package } from 'lucide-react';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'seller') {
      fetchMessages();
    }
  }, [filter]);

  const fetchMessages = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (filter !== 'all') {
        params.isRead = filter === 'read';
      }

      const response = await messageAPI.getReceived(params);
      setMessages(response.data.messages);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await messageAPI.markAsRead(messageId);
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, isRead: true, readAt: new Date() }
            : msg
        )
      );
      toast.success('Message marked as read');
    } catch (error) {
      console.error('Error marking message as read:', error);
      toast.error('Failed to mark message as read');
    }
  };

  if (user?.role !== 'seller') {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="mx-auto h-12 w-12 mb-4" />
        <p>Only sellers can view received messages</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <MessageCircle className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">Messages</h2>
        </div>
        
        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="mx-auto h-12 w-12 mb-4" />
          <p>No messages found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`border rounded-lg p-4 transition-colors ${
                message.isRead ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Sender Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-800">
                      {message.senderId?.name || 'Unknown Buyer'}
                    </span>
                    {message.senderId?.companyName && (
                      <span className="text-sm text-gray-600">
                        ({message.senderId.companyName})
                      </span>
                    )}
                    {!message.isRead && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  {message.productId && (
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                      <Package className="h-4 w-4" />
                      <span>Product: {message.productId.name}</span>
                      {message.productId.price && (
                        <span>• ₹{message.productId.price}</span>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <p className="text-gray-800 mb-3">{message.content}</p>

                  {/* Contact Info */}
                  {message.senderId?.email && (
                    <div className="text-sm text-gray-600">
                      <strong>Contact:</strong> {message.senderId.email}
                      {message.senderId.phone && (
                        <span> • {message.senderId.phone}</span>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-500 mt-2">
                    Received: {new Date(message.createdAt).toLocaleString()}
                    {message.readAt && (
                      <span className="ml-2">
                        • Read: {new Date(message.readAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  {!message.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(message._id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <MailOpen className="h-3 w-3" />
                      Mark Read
                    </button>
                  )}
                  
                  {message.isRead ? (
                    <MailOpen className="h-5 w-5 text-green-600" />
                  ) : (
                    <Mail className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => fetchMessages(page)}
                    className={`px-3 py-1 rounded ${
                      page === pagination.current
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Messages;