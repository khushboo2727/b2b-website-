import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, CheckCircle } from 'lucide-react';
import { messageAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [polling, setPolling] = useState(true);
  const lastTimesRef = React.useRef({});
  const initializedRef = React.useRef(false);
  const audioCtxRef = React.useRef(null);
  const selectedLastTimeRef = React.useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => {
      pollConversations();
      if (selectedConversation?.sellerId) {
        pollMessages(selectedConversation.sellerId);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [polling, selectedConversation]);

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = AC ? new AC() : null;
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      oscillator.stop(ctx.currentTime + 0.26);
    } catch (e) {
      // silently ignore audio errors
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      // Get all admin messages/conversations
      const response = await messageAPI.getAdminMessages();
      const incoming = Array.isArray(response.data) ? response.data : (response.data?.conversations || []);
      const normalized = incoming.map((c) => ({
        sellerId: c.seller?._id || c.sellerId || (c.seller && c.seller.id),
        sellerName: c.seller?.name || c.sellerName || 'Seller',
        sellerEmail: c.seller?.email || c.sellerEmail || '',
        unreadCount: c.unreadCount || 0,
        lastMessage: c.lastMessage?.content || c.lastMessage || '',
        lastMessageTime: c.lastMessage?.createdAt || c.lastMessageTime || new Date().toISOString(),
        lastMessageSenderType: c.lastMessage?.senderType || c.lastMessageSenderType || undefined
      }));
      setConversations(normalized);
      // Prime lastTimes on first load to avoid spurious beep
      if (!initializedRef.current) {
        normalized.forEach(c => {
          if (c.sellerId && c.lastMessageTime) {
            lastTimesRef.current[c.sellerId] = new Date(c.lastMessageTime).getTime();
          }
        });
        initializedRef.current = true;
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const pollConversations = async () => {
    try {
      const response = await messageAPI.getAdminMessages();
      const incoming = Array.isArray(response.data) ? response.data : (response.data?.conversations || []);
      const normalized = incoming.map((c) => ({
        sellerId: c.seller?._id || c.sellerId || (c.seller && c.seller.id),
        sellerName: c.seller?.name || c.sellerName || 'Seller',
        sellerEmail: c.seller?.email || c.sellerEmail || '',
        unreadCount: c.unreadCount || 0,
        lastMessage: c.lastMessage?.content || c.lastMessage || '',
        lastMessageTime: c.lastMessage?.createdAt || c.lastMessageTime || new Date().toISOString(),
        lastMessageSenderType: c.lastMessage?.senderType || c.lastMessageSenderType || undefined
      }));
      // Detect new seller messages
      normalized.forEach(c => {
        const ts = c.lastMessageTime ? new Date(c.lastMessageTime).getTime() : 0;
        const prev = lastTimesRef.current[c.sellerId] || 0;
        if (ts > prev && c.lastMessageSenderType === 'seller') {
          playBeep();
        }
        if (c.sellerId) lastTimesRef.current[c.sellerId] = ts;
      });
      setConversations(normalized);
    } catch (error) {
      // swallow polling errors to avoid noisy toasts
    }
  };

  const fetchMessages = async (sellerId) => {
    try {
      const response = await messageAPI.getAdminConversationWith(sellerId);
      const msgs = response.data.messages || [];
      setMessages(msgs);
      // Update last seen time for selected convo; beep on new seller msg
      const lastSellerMsg = [...msgs].reverse().find(m => m.senderType === 'seller');
      const ts = lastSellerMsg ? new Date(lastSellerMsg.createdAt).getTime() : null;
      if (selectedLastTimeRef.current && ts && ts > selectedLastTimeRef.current) {
        playBeep();
      }
      selectedLastTimeRef.current = ts || selectedLastTimeRef.current;
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const pollMessages = async (sellerId) => {
    try {
      const response = await messageAPI.getAdminConversationWith(sellerId);
      const msgs = response.data.messages || [];
      // Detect new seller message
      const lastSellerMsg = [...msgs].reverse().find(m => m.senderType === 'seller');
      const ts = lastSellerMsg ? new Date(lastSellerMsg.createdAt).getTime() : null;
      if (selectedLastTimeRef.current && ts && ts > selectedLastTimeRef.current) {
        playBeep();
      }
      selectedLastTimeRef.current = ts || selectedLastTimeRef.current;
      setMessages(msgs);
    } catch (error) {
      // ignore polling errors
    }
  };

  const sendReply = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const response = await messageAPI.sendAdminReply(
        selectedConversation.sellerId,
        { message: newMessage.trim() }
      );

      // Add message to local state (use server response if available)
      const created = response?.data?.data;
      const newMsg = created || {
        _id: Date.now().toString(),
        content: newMessage.trim(),
        senderType: 'admin',
        createdAt: new Date().toISOString(),
        isRead: false
      };

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      toast.success('Reply sent successfully');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.sellerId);
    selectedLastTimeRef.current = null; // reset per selection
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg h-96">
      <div className="flex h-full">
        {/* Conversations List */}
        <div className="w-1/3 border-r">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Seller Messages
            </h3>
          </div>
          
          <div className="overflow-y-auto h-full">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.sellerId}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.sellerId === conversation.sellerId ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 rounded-full p-2">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {conversation.sellerName || 'Seller'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {conversation.sellerEmail}
                        </p>
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 truncate">
                    {conversation.lastMessage}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(conversation.lastMessageTime).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-200 rounded-full p-2">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {selectedConversation.sellerName || 'Seller'}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.sellerEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No messages in this conversation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isFromAdmin = message.senderType === 'admin';
                      return (
                        <div key={message._id} className={`flex ${
                          isFromAdmin ? 'justify-end' : 'justify-start'
                        }`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isFromAdmin 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-white border text-gray-800 shadow-sm'
                          }`}>
                            {!isFromAdmin && (
                              <p className="text-xs font-semibold mb-1 text-gray-500">Seller</p>
                            )}
                            <p className="text-sm">{message.content || message.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className={`text-xs ${
                                isFromAdmin ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </p>
                              {isFromAdmin && message.isRead && (
                                <CheckCircle className="h-3 w-3 text-blue-200" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-white">
                <div className="flex space-x-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your reply to seller..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    disabled={sending}
                  />
                  <button
                    onClick={sendReply}
                    disabled={!newMessage.trim() || sending}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span className="text-sm">Send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a seller conversation to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;