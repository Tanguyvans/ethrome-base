# XMTP Sora Video Generator Agent

An XMTP agent that generates videos using OpenAI's Sora 2 model via the Fal AI API. Simply mention the agent with `@sora` or ask it to generate a video, and it will create a 4-second video based on your text description.

## Features

- 🎬 Generate videos from text prompts using Sora 2
- 💬 Interactive button interface with XMTP messaging
- ⚡ Real-time video generation with progress updates
- 🔗 Direct download links for generated videos
- 🎭 Visual reaction emojis (🎬) that appear during processing
- 🏆 Leaderboard and video feed integration (miniapp ready)
- 💡 Built-in example prompts and settings
- 💳 USDC payment support with transaction handling
- 💰 Balance checking and transaction confirmation
- 🎬 **Pay-per-video**: 0.001 USDC fee required for each video generation
- ⏰ **Time-based access**: Payment valid for 1 hour, allowing multiple videos

## Setup

### 1. Install Dependencies

```bash
cd examples/xmtp-sora-video
yarn install
```

### 2. Generate Keys

```bash
yarn gen:keys
```

### 3. Environment Variables

Create a `.env` file in the project root with:

```bash
# Network: local, dev, or production
XMTP_ENV=dev

# Private keys (generated above)
XMTP_WALLET_KEY=your_private_key_here
XMTP_DB_ENCRYPTION_KEY=your_encryption_key_here

# Fal AI API Key (get from https://fal.ai)
FAL_KEY=your_fal_api_key_here

# Network for USDC transactions (base-sepolia or base-mainnet)
NETWORK_ID=base-sepolia
```

**Note**: For testing purposes, the actual video generation is currently commented out to avoid API costs. The agent will show a mock response instead.

### 4. Run the Agent

```bash
# Development mode with hot reloading
yarn dev

# Or production mode
yarn start
```

## Usage

Once the agent is running, you can interact with it through XMTP:

### Interactive Buttons

When you start a conversation, you'll see a welcome message with interactive buttons:

- **🎬 Generate Video** - Instructions for video generation
- **🏆 Leaderboard** - Opens leaderboard in miniapp
- **📺 Video Feed** - Opens video feed in miniapp
- **💳 Payments** - Access payment options and balance checking

### Generate a Video

**Payment Required**: Each video generation requires a **0.001 USDC** payment (valid for 1 hour).

#### First Time Users

1. **Request a video**:
   ```
   @sora A cat playing with a ball of yarn
   ```

2. **Pay the fee**: The agent will request payment via transaction
3. **Confirm payment**: Send the transaction reference
4. **Video auto-generates**: Your video is automatically created after payment!
5. **Generate more videos**: You can create additional videos for 1 hour!

#### Returning Users

If you've paid recently (within 1 hour), simply request videos:

```
@sora A sunset over the ocean
@sora A robot dancing in a futuristic city
```

#### Alternative Phrases

```
Generate video: A sunset over the ocean
Create video: A robot dancing in a futuristic city
```

### Example Prompts

- `@sora A dramatic Hollywood breakup scene at dusk on a quiet suburban street`
- `@sora A futuristic city with flying cars and neon lights`
- `@sora A peaceful forest with sunlight filtering through the trees`
- `@sora A chef preparing a gourmet meal in a modern kitchen`

### Payment Commands

The agent supports USDC payments on Base network:

#### Text Commands

- `/status` - Check your payment status and time remaining
- `/balance` - Check your USDC balance
- `/tx <amount>` - Send USDC to the agent (e.g., `/tx 0.001`)

#### Interactive Payment Menu

Click the **💳 Payments** button to access:
- **🔍 Check Status** - View your payment status and time remaining
- **💰 Check Balance** - View your current USDC balance
- **💸 Send Payment** - Get instructions for sending USDC
- **🔙 Back to Main Menu** - Return to the main menu

#### Transaction Flow

1. Use `/tx <amount>` to initiate a payment
2. The agent will create a transaction request
3. Approve the transaction in your wallet
4. Send a transaction reference to confirm completion
5. The agent will acknowledge the successful payment

## Video Specifications

- **Resolution**: 720p
- **Aspect Ratio**: 16:9
- **Duration**: 4 seconds
- **Format**: MP4

## API Reference

This agent uses the [Fal AI Sora 2 API](https://fal.ai/models/fal-ai/sora-2/text-to-video/api) for video generation.

## Troubleshooting

- Make sure your `FAL_KEY` is valid and has sufficient credits
- Check that your XMTP environment variables are properly set
- Video generation can take several minutes - be patient!
- If generation fails, try a simpler or more descriptive prompt

## Development

```bash
# Lint the code
yarn lint

# Build TypeScript
yarn build
```
