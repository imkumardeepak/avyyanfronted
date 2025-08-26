import React, { useState } from 'react';
import { useWebSocket, useNotifications, useChat } from '@/hooks';

const WebSocketDemo: React.FC = () => {
  const { 
    notifications, 
    messages, 
    connectionStatus, 
    sendMessage, 
    markNotificationAsRead,
    unreadNotificationCount
  } = useWebSocket();
  
  // Alternatively, you can use individual hooks:
  // const { notifications, unreadCount, connectionStatus: notificationStatus } = useNotifications();
  // const { messages, connectionStatus: chatStatus, sendMessage } = useChat();
  
  const [messageInput, setMessageInput] = useState('');
  const [recipientId, setRecipientId] = useState('');

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage({
        message: messageInput,
        receiverId: recipientId || undefined,
        timestamp: new Date().toISOString()
      });
      setMessageInput('');
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">WebSocket Demo</h2>
      
      {/* Connection Status */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Notifications:</p>
            <span className={`px-2 py-1 rounded ${
              connectionStatus.notifications === 'connected' ? 'bg-green-200' :
              connectionStatus.notifications === 'connecting' ? 'bg-yellow-200' :
              connectionStatus.notifications === 'error' ? 'bg-red-200' : 'bg-gray-200'
            }`}>
              {connectionStatus.notifications}
            </span>
          </div>
          <div>
            <p className="font-medium">Chat:</p>
            <span className={`px-2 py-1 rounded ${
              connectionStatus.chat === 'connected' ? 'bg-green-200' :
              connectionStatus.chat === 'connecting' ? 'bg-yellow-200' :
              connectionStatus.chat === 'error' ? 'bg-red-200' : 'bg-gray-200'
            }`}>
              {connectionStatus.chat}
            </span>
          </div>
        </div>
      </div>
      
      {/* Notifications Section */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm">
            {unreadNotificationCount} unread
          </span>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-500">No notifications</p>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`p-3 rounded border ${
                  notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between">
                  <h4 className="font-medium">{notification.title}</h4>
                  {!notification.isRead && (
                    <button 
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Chat Section */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Chat</h3>
        
        {/* Message Input */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="Recipient ID (optional)"
            className="flex-1 p-2 border rounded"
          />
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
        
        {/* Messages */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages</p>
          ) : (
            messages.map(message => (
              <div key={message.id} className="p-3 bg-white rounded border">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {message.senderId === 'me' ? 'You' : `User ${message.senderId}`}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1">{message.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketDemo;