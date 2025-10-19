# XMTP ClipChain Video Generator Agent

A production-ready XMTP agent that generates AI videos using Google's Veo 3.1 Fast model. Users can create videos through natural language prompts and pay with USDC on Base network.

This README explains the agent. We also have a mini app where you can create AI-generated videos, share them, earn rewards, and compete on a leaderboard. The idea is to gamify video creation and make it fun to create and share videos!


## Live Agent

**Agent Address**: `clipchain.base.eth` (Base Name)
**ENS Name**: `clipchain.eth` (Ethereum Name Service)
**Deployment**: Railway (Production)
**Status**: ✅ Live and operational



The agent is deployed on Railway to make it easy to use everywhere. We have ENS address and Base name also for easy interaction in chats.


## Quick Demo

1. Open Base App or any XMTP-compatible client
2. Message: `clipchain.base.eth` or add it to your group chat
3. Send: `@clipchain.base.eth + your best prompt`
4. Pay 0.001 USDC and receive your AI-generated video!
5. Share the video and get reward for it

## Technology Stack

**Core Technologies:**
- **XMTP Agent SDK**: Event-driven messaging framework
- **Google Veo 3.1 Fast**: AI video generation via Fal AI API
- **Base Network / XMTP transactions**: USDC payments and transaction handling. We used xmtp-transactions
- **Node.js/TypeScript**: Runtime and development environment
- **Railway**: Cloud hosting

**Payment System:**
- **USDC on Base**: Cryptocurrency payments (0.001 USDC per video)
- **Transaction verification**: Real-time payment confirmation using xmtp transactions

**User Experience:**
- **Interactive buttons**: XMTP inline actions for seamless navigation
- **Natural language**: Simple text prompts like `@clipchain.base.eth [description]`
- **Real-time updates**: Progress indicators and status messages
- **Cross-platform**: Works on Base App, XMTP Chat, and compatible clients

## Key Features

- 🎬 **AI Video Generation**: Create videos from text prompts using Veo 3.1 Fast
- 💳 **USDC Payments**: Pay-per-video model on Base network
- ⚡ **Real-time Processing**: Live status updates and progress tracking
- 🔗 **Direct Downloads**: Instant access to generated videos
- 🎭 **Interactive UI**: Button-based navigation and commands
- 💰 **Balance Management**: Built-in payment status and transaction history



## How It Works

### User Interaction Flow

1. **Start Conversation**: Message `clipchain.base.eth` or add it to your group chat
2. **Request Video**: Send `@clipchain.base.eth [your video description]`
3. **Payment**: Pay 0.001 USDC (valid for 1 hour)
4. **Generation**: Agent creates video using Veo 3.1 Fast AI
5. **Delivery**: Receive direct download link
6. **Share**: Click on Share button to share with your network on Base and Farcaster


### Interactive Interface

The agent provides a rich button-based interface:
- **💳 Check balance** - USDC payment management to know how much you have
- **🏆 Leaderboard** - Community video leaderboard using the mini app
- **📺 Video Feed** - Browse generated videos on the mini app

### Example Video Prompts

```
@clipchain.base.eth A dramatic Hollywood breakup scene at dusk on a quiet suburban street
@clipchain.base.eth A futuristic city with flying cars and neon lights
@clipchain.base.eth A peaceful forest with sunlight filtering through the trees
@clipchain.base.eth A chef preparing a gourmet meal in a modern kitchen
```


