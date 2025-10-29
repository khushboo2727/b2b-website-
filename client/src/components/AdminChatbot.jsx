import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2, User, Mail, Phone, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messageAPI } from '../services/api';
import toast from 'react-hot-toast';

const AdminChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  // Pre-chat state
  const [showPreChat, setShowPreChat] = useState(true);
  const [isExistingSeller, setIsExistingSeller] = useState(null); // 'yes' | 'no'
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');

  useEffect(() => {
    if (isOpen && user?.role === 'seller') {
      fetchMessages();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Load previous messages when component mounts
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data } = await messageAPI.getAdminConversation();
      const formatted = (data?.messages || []).map(msg => ({
        _id: msg._id,
        message: msg.content,
        senderId: typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId,
        senderType: msg.senderType,
        createdAt: msg.createdAt,
        isRead: msg.isRead
      }));
      setMessages(formatted);
      setShowPreChat(formatted.length === 0);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startChat = async () => {
    if (!isExistingSeller) return;
    if (isExistingSeller === 'no') {
      if (!leadName.trim() || !leadEmail.trim() || !leadPhone.trim()) return;
    }
    setShowPreChat(false);
    if (isExistingSeller === 'no') {
      try {
        const initialContent = `New chat started\nName: ${leadName}\nEmail: ${leadEmail}\nPhone: ${leadPhone}`;
        await messageAPI.sendToAdmin({ content: initialContent });
        await fetchMessages();
      } catch (error) {
        // ignore, user can still type first message
      }
    }
  };

  const handleNewChat = async () => {
    try {
      await messageAPI.sendToAdmin({ content: 'New chat started by seller.' });
    } catch (e) {}
    setShowPreChat(true);
    setIsExistingSeller(null);
    setLeadName('');
    setLeadEmail('');
    setLeadPhone('');
    setMessages([]);
    setNewMessage('');
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      // Get conversation with admin
      const response = await messageAPI.getAdminConversation();
      const normalized = (response?.data?.messages || []).map(msg => ({
        _id: msg._id,
        message: msg.content,
        senderId: typeof msg.senderId === 'object' ? msg.senderId?._id : msg.senderId,
        senderType: msg.senderType,
        createdAt: msg.createdAt,
        isRead: msg.isRead
      }));
      setMessages(normalized);
      setShowPreChat(normalized.length === 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const messageData = { content: newMessage.trim() };
      const response = await messageAPI.sendToAdmin(messageData);
      
      // Add message to local state
      const newMsg = {
        _id: response.data._id || Date.now().toString(),
        message: newMessage.trim(),
        senderId: user._id,
        senderType: 'seller',
        createdAt: new Date().toISOString(),
        isRead: false
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (user?.role !== 'seller') {
    return null;
  }

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-[#ff6600] hover:bg-[#ff8533] text-white p-4 rounded-full shadow-lg transition-all duration-300 z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white border rounded-lg shadow-xl z-50 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-80 h-96'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-[#ff6600] text-white rounded-t-lg">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold text-sm">Admin Support</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-blue-700 p-1 rounded"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={handleNewChat}
                className="hover:bg-[#ff8533] p-1 rounded"
                title="New Chat"
              >
                <PlusCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-[#ff8533] p-1 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {showPreChat ? (
                <div className="p-4 h-64 overflow-y-auto bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Start a new chat</h4>
                  <p className="text-sm text-gray-700 mb-3">Kya aap pehle se seller hain?</p>
                  <div className="flex gap-2 mb-4">
                    <button
                      className={`px-3 py-1 rounded-md border text-sm ${isExistingSeller === 'yes' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800'}`}
                      onClick={() => setIsExistingSeller('yes')}
                    >
                      Yes
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md border text-sm ${isExistingSeller === 'no' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800'}`}
                      onClick={() => setIsExistingSeller('no')}
                    >
                      No
                    </button>
                  </div>
                  {isExistingSeller === 'no' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          className="flex-1 border rounded-md px-2 py-1 text-sm"
                          placeholder="Name"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <input
                          type="email"
                          value={leadEmail}
                          onChange={(e) => setLeadEmail(e.target.value)}
                          className="flex-1 border rounded-md px-2 py-1 text-sm"
                          placeholder="Email"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <input
                          type="tel"
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          className="flex-1 border rounded-md px-2 py-1 text-sm"
                          placeholder="Phone"
                        />
                      </div>
                    </div>
                  )}
                  <div className="mt-3">
                    <button
                      onClick={startChat}
                      disabled={!isExistingSeller || (isExistingSeller === 'no' && (!leadName.trim() || !leadEmail.trim() || !leadPhone.trim()))}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-3 py-1 rounded-md text-sm"
                    >
                      Start Chat
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages */}
                  <div className="flex-1 p-4 h-64 overflow-y-auto bg-gray-50">
                    {loading ? (
                      <div className="text-center py-4 text-gray-500 text-sm">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No messages yet.</p>
                        <p className="text-xs mt-1">Ask admin any questions about your account!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message) => {
                          const isFromSeller = message.senderId === user._id || message.senderType === 'seller';
                          const isFromAdmin = message.senderType === 'admin';
                          return (
                            <div key={message._id} className={`flex ${
                              isFromSeller ? 'justify-end' : 'justify-start'
                            }`}>
                              <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                isFromSeller 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-green-600 text-white'
                              }`}>
                                {isFromAdmin && (
                                  <p className="text-xs font-semibold mb-1 text-green-100">Admin</p>
                                )}
                                <p>{message.message}</p>
                                <p className={`text-xs mt-1 ${
                                  isFromSeller ? 'text-blue-100' : 'text-green-100'
                                }`}>
                                  {new Date(message.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message to admin..."
                        className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2f3284]"
                        rows={2}
                        disabled={sending}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="bg-[#2f3284] hover:bg-[#5558bd] disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Admin will respond to your queries during business hours.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AdminChatbot;