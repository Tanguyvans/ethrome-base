# @xmtp/agent-starter

A convenient TypeScript wrapper around [@xmtp/node-sdk](https://github.com/xmtp/xmtp-js/tree/main/sdks/node-sdk) simplifying agent delopment.

## Install

```bash [yarn]
yarn add @xmtp/agent-starter
```

> See the available TypeScript [Types](https://github.com/ephemeraHQ/xmtp-agents/blob/main/packages/agent-starter/src/lib/types.ts)

## Overview

These are the steps to initialize an agent that listens and sends messages over the XMTP network.

```tsx
async function main() {
  const client = await xmtpClient({
    walletKey: process.env.WALLET_KEY as string,
    encryptionKey: // optional
    onMessage: async (message: Message) => {
      console.log(
        `Decoded message: ${message.content.text} by ${message.sender.address}`,
      );

      // Your AI model response
      const response = await api("Hi, how are you?");

      //Send text message
      await client.send({
        message: response,
        originalMessage: message,
      });
    },
  });

  console.log("Agent is up and running...");
}

main().catch(console.error);
```

#### Address availability

Returns `true` if an address is reachable on the xmtp network

```typescript
const isOnXMTP = await client.canMessage(address);
```

## Groups

Any client may be part or create a new group and can control the initial permission policies applied to that group.

> [!NOTE]
> You need to **add the agent to the group as a member**.

To create a group from your agent, you can use the following code:

```tsx
const group = await agent?.conversations.newGroup([address1, address2]);
```

As an admin you can add members to the group.

```tsx
// sync group first
await group.sync();

// get group members
const members = await group.members();

// add members to the group
await group.addMembers([walletAddress]);
```

> To learn more about groups, read the [XMTP groups](https://docs.xmtp.org/inboxes/group-permissions) documentation.

## Encryption keys

- `WALLET_KEY`: XMTP encryption keys can be managed in several ways. Here are the most common methods:

  1. Use an environment variable to provide the private key:

     - Store your private key in a `.env` file:
       `WALLET_KEY=0xYOUR_PRIVATE_KEY`

     ```tsx
     const agent = await xmtpClient({
       walletKey: process.env.WALLET_KEY,
     });
     ```

2. Generate the private key at runtime:

   - If no private key is provided, the agent can automatically generate a new one upon startup:
     `WALLET_KEY=random_key`
   - If exists in the .env file it will **not** generated a new key.
   - This method will save the key in the `.env` file for future use.

     ```tsx
     const agent = await xmtpClient();
     ```

3. Assign a name (alias) to the randomly generated key:

   - Providing a "name" gives your key a meaningful identifier, aiding in organization and persistence.
     `WALLET_KEY_agentA=0xYOUR_PRIVATE_KEY`
   - This method will also save the key in the `.env` file for future use.

     ```tsx
     const agent = await xmtpClient({
       name: "agentA", // Optional suffix for this agent's key
     });
     ```

- `ENCRYPTION_KEY`: The fixed key is an additional security measure. It is not linked to the public address and can be randomly generated or shared across different agents. It will also be generated and saved in the `.env` file using the methods described above.

## Receive messages

After passing the onMessage handler to your agent, the agent will start listening to incoming messages sent via the XMTP network. These messages can be of various different types explained below.

```tsx
const onMessage = async (message: Message) => {
  console.log(
    `Decoded message: ${message.content.text} by ${message.sender.address}`,
  );
  let typeId = message.typeId;

  if (typeId === "text") {
    // Do something with the text
  } else if (typeId === "reaction") {
    // Do something with the reaction
  } else if (typeId === "reply") {
    // Do something with the `reply`
  } else if (typeId === "attachment") {
    // Do something with the attachment data url
  } else if (typeId === "agent_message") {
    // Do something with the agent message
  } else if (typeId === "group_updated") {
    // Do something with the group updated metadata
  }
};
```

## Content types

When you build an app with XMTP, all messages are encoded with a content type to ensure that an XMTP client knows how to encode and decode messages, ensuring interoperability and consistent display of messages across apps.

`agent-starter` provides an abstraction to XMTP [content types](https://github.com/xmtp/xmtp-js/tree/main/content-types) to make it easier for devs to integrate different types of messages.

### Text

Sends a text message.

```tsx
let textMessage: clientMessage = {
  message: "Your message.",
  receivers: ["0x123..."], // optional
  originalMessage: message, // optional
};
await client.send(textMessage);
```

> See [reaction content type](https://github.com/xmtp/xmtp-js/tree/main/content-types/content-type-text) for reference

### Reaction

Sends an emoji reaction.

```tsx
let reaction: clientMessage = {
  message: "😅",
  receivers: ["0x123..."], // optional
  originalMessage: message, // optional
  typeId: "reaction",
};
await client.send(reaction);
```

> See [text content type](https://github.com/xmtp/xmtp-js/tree/main/content-types/content-type-reaction) for reference

### Reply

Replies to a specific message.

```tsx
let reply: clientMessage = {
  message: "Your message.",
  receivers: ["0x123..."], // optional
  originalMessage: message, // optional
  typeId: "reply",
};
await client.send(reply);
```

> See [reply content type](https://github.com/xmtp/xmtp-js/tree/main/content-types/content-type-reply) for reference

### Attachment

Sends any media file or attachment lower to 1MB over the network.

```tsx
let attachment: clientMessage = {
  message: "https://picsum.photos/200/300",
  receivers: ["0x123..."], // optional
  originalMessage: message, // optional
  typeId: "attachment",
};
await client.send(attachment);
```

> See [reaction content type](https://github.com/xmtp/xmtp-js/tree/main/content-types/content-type-remote-attachment) for reference

### Agent message

Allows to send structured metadata over the network that is displayed as plain-text in ecosystem inboxes.

```tsx
let clientMessage: clientMessage = {
  message: "Would you like to approve this transaction?",
  metadata: {
    amount: "10",
    token: "USDC",
  },
  receivers: ["0x123..."], // optional
  originalMessage: message, // optional
  typeId: "agent_message",
};
await client.send(clientMessage);
```

> Agent message is an implementation of a `custom` content-type and not yet officially supported by the protocol.

**Open for feedback**  
You are welcome to provide feedback on this implementation by commenting on the [Proposal for content type](https://community.xmtp.org/).
