import { useState, useEffect, useCallback, useRef } from 'react';
import { Dm } from '@xmtp/browser-sdk';
import { Message } from '../types';

export const useMessages = (dm: Dm | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dmRef = useRef(dm);

  // Keep dmRef up to date
  useEffect(() => {
    dmRef.current = dm;
  }, [dm]);

  const loadMessages = useCallback(async () => {
    const currentDm = dmRef.current;
    if (!currentDm) return;

    try {
      setIsLoading(true);
      setError(null);

      // Sync to get latest messages
      await currentDm.sync();
      const xmtpMessages = await currentDm.messages();

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
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const currentDm = dmRef.current;
    if (!currentDm) {
      throw new Error('No conversation selected');
    }

    try {
      setError(null);
      await currentDm.send(content);

      // Reload messages after sending
      await loadMessages();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Error sending message:', err);
      throw err;
    }
  }, [loadMessages]);

  useEffect(() => {
    if (dm) {
      setMessages([]); // Clear old messages
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
