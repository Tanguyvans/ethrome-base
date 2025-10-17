# XMTP Chat Web App

A decentralized chat application built with XMTP (Extensible Message Transport Protocol) and React.

## Features

- Connect with MetaMask wallet
- Send and receive encrypted messages
- Real-time message streaming
- Create conversations with any Ethereum address
- Clean and responsive UI

## Prerequisites

- Node.js (v18 or higher)
- MetaMask browser extension
- An Ethereum wallet address

## Installation

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

## How to Use

1. Open the app in your browser
2. Click "Connect Wallet" and approve the MetaMask connection
3. Enter an Ethereum address to start a new conversation
4. Send and receive messages in real-time

## Tech Stack

- React 19
- TypeScript
- XMTP Browser SDK
- Ethers.js v6
- Vite

## Environment

The app uses the XMTP production network. To use the development network, modify the environment setting in `src/hooks/useXmtp.ts`.

## Deployment

This app can be deployed to Vercel, Netlify, or any static hosting service that supports single-page applications.
