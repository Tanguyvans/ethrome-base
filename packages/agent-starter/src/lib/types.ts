import type { Client, ClientOptions } from "@xmtp/node-sdk";
import type { createWalletClient } from "viem";
import type { privateKeyToAccount } from "viem/accounts";

export type { Client };
export type { ClientOptions };

export type Metadata = {
  isAgent?: boolean;
  [key: string]: any;
};

export type agentMessage = {
  message: string;
  originalMessage?: Message;
  metadata: Metadata;
  receivers?: string[];
  typeId?:
    | "text"
    | "image"
    | "reaction"
    | "reply"
    | "attachment"
    | "read_receipt"
    | "agent_message";
};

export interface UserReturnType {
  key: string;
  account: ReturnType<typeof privateKeyToAccount>;
  wallet: ReturnType<typeof createWalletClient>;
}

export type xmtpConfig = {
  path?: string;
  hideInitLogMessage?: boolean;
} & ClientOptions;

export type Agent = {
  name?: string;
  walletKey?: string;
  encryptionKey?: string;
  onMessage?: (message: Message) => Promise<void>;
  config?: xmtpConfig;
};

export type Conversation = {
  id: string;
  createdAt: Date;
  topic?: string;
  members?: User[];
  admins?: string[];
  name?: string;
  superAdmins?: string[];
};

export type Message = {
  id: string; // Unique identifier for the message
  sent: Date; // Date when the message was sent
  isDM: boolean; // Whether the message is a direct message
  content: {
    text?: string | undefined; // Text content of the message
    reply?: string | undefined; // Reply content if the message is a reply
    previousMsg?: string | undefined; // Reference to the previous message
    attachment?: string | undefined; // Attachment content if the message is an attachment
    reaction?: any | undefined; // Reaction content if the message is a reaction
    params?: any | undefined; // Parameters for the message
    reference?: string | undefined; // Reference ID for the message
  };
  group?: Conversation; // Group the message belongs to
  sender: User; // Sender of the message
  typeId: string; // Type identifier for the message
  client: {
    address: string;
    inboxId: string;
  };
};

export interface User {
  address: string;
  inboxId: string;
  installationIds: string[];
  accountAddresses: string[];
  username?: string;
  ensDomain?: string;
}
