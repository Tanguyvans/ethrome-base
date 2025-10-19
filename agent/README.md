# XMTP ClipChain Video Generator Agent

A production-ready XMTP agent that generates AI videos using Google's Veo 3.1 Fast model. Users can create videos through natural language prompts and pay with USDC on Base network.

## Live Agent

**Agent Address**: `clipchain.base.eth` (Base Name)
**ENS Name**: `clipchain.eth` (Ethereum Name Service)
**Deployment**: Railway (Production)
**Status**: ✅ Live and operational

## Quick Demo

1. Open Base App or any XMTP-compatible client
2. Message: `clipchain.base.eth` or `clipchain.eth`
3. Send: `@clipchain.base.eth A cat playing with a ball of yarn`
4. Pay 0.001 USDC and receive your AI-generated video!

## Technology Stack

**Core Technologies:**
- **XMTP Agent SDK**: Event-driven messaging framework
- **Google Veo 3.1 Fast**: AI video generation via Fal AI API
- **Base Network**: USDC payments and transaction handling
- **Node.js/TypeScript**: Runtime and development environment
- **Railway**: Cloud deployment and hosting

**Payment System:**
- **USDC on Base**: Cryptocurrency payments (0.001 USDC per video)
- **Time-based access**: 1-hour payment validity for multiple generations
- **Transaction verification**: Real-time payment confirmation

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

## Development Process

### 1. Development Setup

```bash
# Clone and setup
cd examples/xmtp-sora-video
yarn install
yarn gen:keys
```

### 2. Environment Configuration

```bash
# Required environment variables
XMTP_ENV=dev                    # Network environment
XMTP_WALLET_KEY=0x...          # Agent wallet private key
XMTP_DB_ENCRYPTION_KEY=...     # Database encryption key
FAL_KEY=your_fal_api_key       # Fal AI API key
NETWORK_ID=base-sepolia        # USDC network
```

### 3. Testing Workflow

**Development Testing:**
```bash
yarn dev                       # Start agent locally
```

**XMTP Chat Testing:**
1. Go to https://xmtp.chat
2. Connect wallet and switch to Dev environment
3. Message agent's public address
4. Test functionality and verify responses

**Production Testing:**
```bash
XMTP_ENV=production           # Switch to production
```

**Base App Testing:**
1. Open Base App mobile app
2. Start conversation with agent address
3. Verify full functionality in production environment

### 4. Agent Identity Setup

**Base Name Registration:**
1. Import agent wallet to Base App extension
2. Visit https://base.org/names
3. Purchase `clipchain.base.eth` basename
4. Set as primary name for agent

**ENS Registration:**
- Register `clipchain.eth` on Ethereum Name Service
- Maps to agent wallet for cross-platform compatibility

### 5. Production Deployment

**Railway Deployment:**
- Connect GitHub repository to Railway
- Configure environment variables in dashboard
- Deploy with automatic scaling and monitoring
- Agent accessible via `clipchain.base.eth` and `clipchain.eth`

## How It Works

### User Interaction Flow

1. **Start Conversation**: Message `clipchain.base.eth` or `clipchain.eth`
2. **Request Video**: Send `@clipchain.base.eth [your video description]`
3. **Payment**: Pay 0.001 USDC (valid for 1 hour)
4. **Generation**: Agent creates video using Veo 3.1 Fast AI
5. **Delivery**: Receive direct download link

### Supported Commands

**Video Generation:**
```
@clipchain.base.eth A cat playing with a ball of yarn
@clipchain.base.eth A sunset over the ocean
@clipchain.base.eth A robot dancing in a futuristic city
```

**Payment Management:**
```
/status          # Check payment status and time remaining
/balance         # Check USDC balance
/tx 0.001        # Send payment transaction
```

### Interactive Interface

The agent provides a rich button-based interface:
- **🎬 Generate Video** - Video generation instructions
- **💳 Payments** - USDC payment management
- **🏆 Leaderboard** - Community video showcase
- **📺 Video Feed** - Browse generated videos

### Example Video Prompts

```
@clipchain.base.eth A dramatic Hollywood breakup scene at dusk on a quiet suburban street
@clipchain.base.eth A futuristic city with flying cars and neon lights
@clipchain.base.eth A peaceful forest with sunlight filtering through the trees
@clipchain.base.eth A chef preparing a gourmet meal in a modern kitchen
```

## Technical Specifications

**Video Output:**
- **Resolution**: 720p
- **Aspect Ratio**: 16:9
- **Duration**: 4 seconds
- **Format**: MP4

**API Integration:**
- **Fal AI Veo 3.1 Fast**: [API Documentation](https://fal.ai/models/fal-ai/veo3.1/fast/api)
- **Base Network**: USDC transaction handling
- **XMTP Protocol**: Decentralized messaging

## Production Status

**Deployment**: ✅ Live on Railway
**Monitoring**: Real-time logs and error tracking
**Uptime**: 24/7 availability
**Scalability**: Auto-scaling based on demand

**Agent Identity:**
- **Base Name**: `clipchain.base.eth`
- **ENS Name**: `clipchain.eth`
- **Network**: Base (Production)
- **Wallet**: Secure key management via environment variables

## Architecture

Built with modern web3 principles:
- **Decentralized**: No central server dependency
- **Cryptocurrency Native**: USDC payments on Base
- **Cross-Platform**: Works on any XMTP-compatible client
- **User-Owned**: Users control their data and payments
