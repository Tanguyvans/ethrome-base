export interface Message {
  id: string;
  content: string;
  senderAddress: string;
  sentAt: Date;
}

export interface Conversation {
  id: string;
  peerAddress: string;
  createdAt: Date;
  lastMessage?: Message;
}
