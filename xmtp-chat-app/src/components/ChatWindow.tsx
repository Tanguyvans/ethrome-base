import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import './ChatWindow.css';

interface ChatWindowProps {
  messages: Message[];
  peerAddress: string;
  walletAddress: string;
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  peerAddress,
  walletAddress,
  onSendMessage,
  isLoading,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{formatAddress(peerAddress)}</h3>
      </div>

      <div className="messages-container">
        {isLoading ? (
          <p className="loading">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="empty-state">No messages yet. Send a message to start the conversation!</p>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderAddress.toLowerCase() === walletAddress.toLowerCase();
            return (
              <div
                key={message.id}
                className={`message ${isOwn ? 'message-own' : 'message-peer'}`}
              >
                <div className="message-content">
                  <p>{message.content}</p>
                  <span className="message-time">{formatTime(message.sentAt)}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !newMessage.trim()}>
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};
