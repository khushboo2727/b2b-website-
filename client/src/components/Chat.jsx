import React, { useState, useEffect } from 'react';
import { messageAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Send, MessageCircle } from 'lucide-react';

const Chat = ({ sellerId, productId, leadId, sellerName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'buyer') {
      fetchSentMessages();
    }
  }, [sellerId]);

  const fetchSentMessages = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getSent({ receiverId: sellerId });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const messageData = {
        receiverId: sellerId,
        content: newMessage.trim(),
        messageType: 'inquiry'
      };

      if (productId) messageData.productId = productId;
      if (leadId) messageData.leadId = leadId;

      const response = await messageAPI.send(messageData);
      
      // Add new message to the list
      setMessages(prev => [response.data.data, ...prev]);
      setNewMessage('');
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (user?.role !== 'buyer') {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="mx-auto h-12 w-12 mb-4" />
        <p>Only buyers can send messages to sellers</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <MessageCircle className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold">
          Chat with {sellerName || 'Seller'}
        </h3>
      </div>

      {/* Message List */}
      <div className="mb-4 max-h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
        {loading ? (
          <div className="text-center py-4 text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No messages yet. Start a conversation!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message._id} className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600 mb-1">
                  To: {message.receiverId?.name || 'Seller'}
                  {message.productId && (
                    <span className="ml-2 text-blue-600">
                      • {message.productId.name}
                    </span>
                  )}
                </div>
                <p className="text-gray-800">{message.content}</p>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(message.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {sending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;