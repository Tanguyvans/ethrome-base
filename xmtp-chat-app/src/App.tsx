import { useState } from 'react';
import { Dm, ConsentState } from '@xmtp/browser-sdk';
import { WalletConnect } from './components/WalletConnect';
import { ConversationList } from './components/ConversationList';
import { ChatWindow } from './components/ChatWindow';
import { useXmtp } from './hooks/useXmtp';
import { useConversations } from './hooks/useConversations';
import { useMessages } from './hooks/useMessages';
import { Conversation } from './types';
import './App.css';

function App() {
  const { client, walletAddress, isLoading, error, connectWallet } = useXmtp();
  const {
    conversations,
    createConversation,
  } = useConversations(client);

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [xmtpDm, setXmtpDm] = useState<Dm | null>(null);

  const { messages, sendMessage } = useMessages(xmtpDm);

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    if (client) {
      // Get the actual XMTP DM object
      await client.conversations.sync();
      const dms = await client.conversations.listDms({
        consentStates: [ConsentState.Allowed, ConsentState.Unknown],
      });
      const dm = dms.find((d) => d.id === conversation.id);
      if (dm) {
        setXmtpDm(dm);
      }
    }
  };

  const handleCreateConversation = async (address: string) => {
    const dm = await createConversation(address);
    if (dm) {
      const peerInboxId = await dm.peerInboxId();
      const newConv: Conversation = {
        id: dm.id,
        peerAddress: peerInboxId,
        createdAt: dm.createdAtNs ? new Date(Number(dm.createdAtNs) / 1000000) : new Date(),
      };
      handleSelectConversation(newConv);
    }
  };

  if (!client || !walletAddress) {
    return <WalletConnect onConnect={connectWallet} isLoading={isLoading} error={error} />;
  }

  return (
    <div className="app">
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={handleCreateConversation}
        walletAddress={walletAddress}
      />
      {selectedConversation && xmtpDm && client && client.inboxId ? (
        <ChatWindow
          messages={messages}
          peerAddress={selectedConversation.peerAddress}
          walletAddress={client.inboxId}
          onSendMessage={sendMessage}
        />
      ) : (
        <div className="empty-chat">
          <h2>Select a conversation or start a new one</h2>
          <p>Choose a chat from the sidebar to start messaging</p>
        </div>
      )}
    </div>
  );
}

export default App;
