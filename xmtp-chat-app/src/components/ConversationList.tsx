import React, { useState } from 'react';
import { Conversation } from '../types';
import './ConversationList.css';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateConversation: (address: string) => Promise<void>;
  walletAddress: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  onCreateConversation,
  walletAddress,
}) => {
  const [newAddress, setNewAddress] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      await onCreateConversation(newAddress.trim());
      setNewAddress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="conversation-list">
      <div className="conversation-header">
        <h2>Chats</h2>
        <p className="wallet-address">{formatAddress(walletAddress)}</p>
      </div>

      <form onSubmit={handleCreateConversation} className="new-conversation">
        <input
          type="text"
          placeholder="Enter wallet address (0x...)"
          value={newAddress}
          onChange={(e) => setNewAddress(e.target.value)}
          disabled={isCreating}
        />
        <button type="submit" disabled={isCreating || !newAddress.trim()}>
          {isCreating ? 'Creating...' : 'New Chat'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>

      <div className="conversations">
        {conversations.length === 0 ? (
          <p className="empty-state">No conversations yet. Start a new chat!</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${
                selectedConversation?.id === conv.id ? 'selected' : ''
              }`}
              onClick={() => onSelectConversation(conv)}
            >
              <div className="conversation-info">
                <p className="conversation-peer">{formatAddress(conv.peerAddress)}</p>
                {conv.lastMessage && (
                  <p className="conversation-preview">
                    {conv.lastMessage.content.slice(0, 50)}
                    {conv.lastMessage.content.length > 50 ? '...' : ''}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
