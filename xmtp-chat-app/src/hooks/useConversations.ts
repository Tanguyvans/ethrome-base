import { useState, useEffect, useCallback } from 'react';
import { Client, Dm as XmtpDm, type Identifier, ConsentState } from '@xmtp/browser-sdk';
import { Conversation } from '../types';

export const useConversations = (client: Client | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!client) return;

    try {
      setIsLoading(true);
      setError(null);

      // Sync to get latest data from network
      await client.conversations.sync();

      // Get all DM conversations
      const xmtpDms = await client.conversations.listDms({
        consentStates: [ConsentState.Allowed, ConsentState.Unknown],
      });

      const conversationList: Conversation[] = await Promise.all(
        xmtpDms.map(async (dm: XmtpDm) => {
          // Sync conversation to get latest messages
          await dm.sync();
          const messages = await dm.messages();
          const lastMessage = messages[messages.length - 1];
          const peerInboxId = await dm.peerInboxId(); // Call the function

          // Handle last message content
          let lastMessageContent: string | undefined;
          if (lastMessage) {
            if (typeof lastMessage.content === 'string') {
              lastMessageContent = lastMessage.content;
            } else if (lastMessage.content && typeof lastMessage.content === 'object') {
              lastMessageContent = (lastMessage.content as any).fallback || '[Message]';
            } else {
              lastMessageContent = '[Message]';
            }
          }

          return {
            id: dm.id,
            peerAddress: peerInboxId, // Using inbox ID as identifier
            createdAt: dm.createdAtNs ? new Date(Number(dm.createdAtNs) / 1000000) : new Date(),
            lastMessage: lastMessage ? {
              id: lastMessage.id,
              content: lastMessageContent!,
              senderAddress: lastMessage.senderInboxId,
              sentAt: new Date(Number(lastMessage.sentAtNs) / 1000000),
            } : undefined,
          };
        })
      );

      setConversations(conversationList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const createConversation = useCallback(async (peerAddress: string) => {
    if (!client) {
      throw new Error('Client not initialized');
    }

    try {
      setError(null);

      // Create identifier for the peer address
      const peerIdentifier: Identifier = {
        identifier: peerAddress,
        identifierKind: 'Ethereum',
      };

      console.log('Checking if can message:', peerAddress);

      // Check if address is on XMTP network using instance method
      const canMessageResult = await client.canMessage([peerIdentifier]);
      console.log('canMessage result:', canMessageResult);

      const canMessage = canMessageResult.get(peerAddress);
      console.log('Can message this address:', canMessage);

      if (!canMessage) {
        throw new Error('This address is not registered on XMTP network');
      }

      // Get the inbox ID for the peer address
      console.log('Finding inbox ID for:', peerAddress);
      const peerInboxId = await client.findInboxIdByIdentifier(peerIdentifier);
      console.log('Found inbox ID:', peerInboxId);

      if (!peerInboxId) {
        throw new Error('Could not find inbox ID for this address');
      }

      // Create new DM conversation
      const dm = await client.conversations.newDm(peerInboxId);
      const resolvedPeerInboxId = await dm.peerInboxId(); // Call the function

      const newConv: Conversation = {
        id: dm.id,
        peerAddress: resolvedPeerInboxId,
        createdAt: dm.createdAtNs ? new Date(Number(dm.createdAtNs) / 1000000) : new Date(),
      };

      setConversations(prev => [newConv, ...prev]);
      return dm;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      console.error('Error creating conversation:', err);
      throw err;
    }
  }, [client]);

  useEffect(() => {
    if (client) {
      loadConversations();
    }
  }, [client, loadConversations]);

  return {
    conversations,
    isLoading,
    error,
    loadConversations,
    createConversation,
  };
};
