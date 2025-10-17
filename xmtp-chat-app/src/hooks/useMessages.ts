import { useState, useEffect, useCallback } from 'react';
import { Dm } from '@xmtp/browser-sdk';
import { Message } from '../types';

export const useMessages = (dm: Dm | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!dm) return;

    try {
      setIsLoading(true);
      setError(null);

      // Sync to get latest messages
      await dm.sync();
      const xmtpMessages = await dm.messages();

      const messageList: Message[] = xmtpMessages.map((msg) => {
        // Handle content - it could be a string or an object with fallback
        let content: string;
        if (typeof msg.content === 'string') {
          content = msg.content;
        } else if (msg.content && typeof msg.content === 'object') {
          // For encoded content, try to get the fallback text
          content = (msg.content as any).fallback || JSON.stringify(msg.content);
        } else {
          content = '[Unsupported content type]';
        }

        return {
          id: msg.id,
          content,
          senderAddress: msg.senderInboxId,
          sentAt: new Date(Number(msg.sentAtNs) / 1000000),
        };
      });

      setMessages(messageList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMessage);
      console.error('Error loading messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dm]);

  const sendMessage = useCallback(async (content: string) => {
    if (!dm) {
      throw new Error('No conversation selected');
    }

    try {
      setError(null);
      await dm.send(content);

      // Reload messages after sending
      await loadMessages();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Error sending message:', err);
      throw err;
    }
  }, [dm, loadMessages]);

  useEffect(() => {
    if (dm) {
      loadMessages();
    }
  }, [dm, loadMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    loadMessages,
  };
};
