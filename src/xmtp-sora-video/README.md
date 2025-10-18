# XMTP Sora Video Generator Agent

An XMTP agent that generates videos using OpenAI's Sora 2 model via the Fal AI API. Simply mention the agent with `@sora` or ask it to generate a video, and it will create a 4-second video based on your text description.

## Features

- 🎬 Generate videos from text prompts using Sora 2
- 💬 Simple XMTP messaging interface with reaction feedback
- ⚡ Real-time video generation with progress updates
- 🔗 Direct download links for generated videos
- 🎭 Visual reaction emojis (🎬) that appear during processing

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

### Generate a Video

Mention the agent with `@sora` followed by your video description:

```
@sora A cat playing with a ball of yarn
```

Or use alternative phrases:

```
Generate video: A sunset over the ocean
Create video: A robot dancing in a futuristic city
```

### Example Prompts

- `@sora A dramatic Hollywood breakup scene at dusk on a quiet suburban street`
- `@sora A futuristic city with flying cars and neon lights`
- `@sora A peaceful forest with sunlight filtering through the trees`
- `@sora A chef preparing a gourmet meal in a modern kitchen`

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
