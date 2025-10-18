import { Agent, type MessageContext, type AgentMiddleware } from "@xmtp/agent-sdk";
import { getTestUrl } from "@xmtp/agent-sdk/debug";
import {
  ContentTypeReaction,
  ReactionCodec,
  type Reaction,
} from "@xmtp/content-type-reaction";
import {
  TransactionReferenceCodec,
  type TransactionReference,
} from "@xmtp/content-type-transaction-reference";
import {
  ContentTypeWalletSendCalls,
  WalletSendCallsCodec,
} from "@xmtp/content-type-wallet-send-calls";
import {
  ActionBuilder,
  inlineActionsMiddleware,
  registerAction,
  showNavigationOptions,
  getActionHandler,
} from "../../utils/inline-actions/inline-actions.js";
import {
  ContentTypeActions,
  ActionsCodec,
} from "../../utils/inline-actions/types/ActionsContent.js";
import {
  IntentCodec,
  type IntentContent,
} from "../../utils/inline-actions/types/IntentContent.js";
// @ts-ignore - Fal AI client types may not be available
import { fal } from "@fal-ai/client";
import { loadEnvFile } from "../../utils/general.js";
import { USDCHandler } from "../../utils/usdc.js";

loadEnvFile();

// Configure Fal AI client
fal.config({
  credentials: process.env.FAL_KEY,
});

// Network configuration for transactions
const NETWORK_ID = process.env.NETWORK_ID || "base-sepolia";
const usdcHandler = new USDCHandler(NETWORK_ID);

// Video generation fee configuration
const VIDEO_GENERATION_FEE = 0.001; // 0.001 USDC fee for video generation (minimum for testing)
const FEE_IN_DECIMALS = Math.floor(VIDEO_GENERATION_FEE * Math.pow(10, 6)); // Convert to USDC decimals

// Simple in-memory payment tracking (in production, use a database)
const paymentStatus = new Map<string, { paid: boolean; timestamp: number; amount: number; pendingVideoRequest?: string }>();

// Extended context type to include video generation reaction helpers
interface VideoReactionContext extends MessageContext {
  videoReaction?: {
    removeVideoEmoji: () => Promise<void>;
  };
}

// Helper function to share mini app URLs with better UX
async function shareMiniApp(
  ctx: MessageContext,
  url: string,
  message: string
) {
  try {
    await ctx.sendText(`${message}\n\n${url}`);
    console.log(`✅ Mini app shared: ${url}`);
  } catch (error) {
    console.error("❌ Error sharing mini app:", error);
    throw error;
  }
}

// Helper function to check if user has paid for video generation
async function hasUserPaidForVideo(senderAddress: string): Promise<boolean> {
  const payment = paymentStatus.get(senderAddress);
  if (!payment) return false;

  // Check if payment is sufficient and not yet used
  return payment.paid && payment.amount >= VIDEO_GENERATION_FEE;
}

// Helper function to mark user as paid
function markUserAsPaid(senderAddress: string, amount: number, pendingVideoRequest?: string) {
  paymentStatus.set(senderAddress, {
    paid: true,
    timestamp: Date.now(),
    amount: amount,
    pendingVideoRequest: pendingVideoRequest
  });
}

// Helper function to consume payment after video generation
function consumePayment(senderAddress: string) {
  paymentStatus.delete(senderAddress);
}

// Helper function to create payment request for video generation
async function requestVideoPayment(ctx: MessageContext, prompt: string) {
  const senderAddress = await ctx.getSenderAddress();
  if (!senderAddress) {
    await ctx.sendText("❌ Could not determine your wallet address.");
    return;
  }

  const agentAddress = agent.address || "";

  // Store the pending video request
  paymentStatus.set(senderAddress, {
    paid: false,
    timestamp: 0,
    amount: 0,
    pendingVideoRequest: prompt
  });

  // Create payment request
  console.log(`Creating payment request for ${senderAddress} to ${agentAddress}`);
  console.log(`Amount in USDC: ${VIDEO_GENERATION_FEE}`);
  console.log(`Amount in decimals: ${FEE_IN_DECIMALS}`);

  const walletSendCalls = usdcHandler.createUSDCTransferCalls(
    senderAddress,
    agentAddress,
    FEE_IN_DECIMALS,
  );

  console.log("Wallet send calls created:", JSON.stringify(walletSendCalls, null, 2));

  await ctx.sendText(
    `🎬 **Video: "${prompt}"**\n\n` +
    `💰 **Fee**: ${VIDEO_GENERATION_FEE} USDC per video\n\n` +
    `Approve the transaction in your wallet to generate!`
  );

  // Send the transaction request
  await ctx.conversation.send(walletSendCalls, ContentTypeWalletSendCalls);

  // Send follow-up instructions
  await ctx.sendText(
    `💡 After payment, I'll automatically generate your video!`
  );
}

// Transaction reference middleware
const transactionReferenceMiddleware: AgentMiddleware = async (ctx, next) => {
  // Check if this is a transaction reference message
  if (ctx.usesCodec(TransactionReferenceCodec)) {
    const transactionRef = ctx.message.content as TransactionReference;
    const senderAddress = await ctx.getSenderAddress();

    console.log("Received transaction reference:", transactionRef);

    // Check if this is a video generation payment
    console.log("Transaction metadata:", transactionRef.metadata);
    console.log("Amount from metadata:", transactionRef.metadata?.amount);
    console.log("VIDEO_GENERATION_FEE:", VIDEO_GENERATION_FEE);

    // Check if user has a pending video request (more reliable than metadata)
    const currentPayment = paymentStatus.get(senderAddress || "");
    const hasPendingVideo = currentPayment?.pendingVideoRequest;

    // For Base Sepolia, we'll assume any transaction with pending video request is a video payment
    // since the metadata doesn't always include the amount
    // Also check if user recently requested a video (within last 5 minutes)
    const recentVideoRequest = currentPayment &&
        (Date.now() - currentPayment.timestamp) < (5 * 60 * 1000) &&
        currentPayment.pendingVideoRequest;

    // More aggressive: if user has any payment record and made a transaction, treat it as video payment
    const hasAnyPaymentRecord = currentPayment && currentPayment.timestamp > 0;

    const isVideoPayment = hasPendingVideo || recentVideoRequest || hasAnyPaymentRecord ||
        (transactionRef.metadata?.amount &&
         parseFloat(transactionRef.metadata.amount.toString()) >= VIDEO_GENERATION_FEE);

    console.log("Has pending video:", hasPendingVideo);
    console.log("Recent video request:", recentVideoRequest);
    console.log("Has any payment record:", hasAnyPaymentRecord);
    console.log("Is video payment:", isVideoPayment);

    if (isVideoPayment) {
      console.log("✅ Detected video generation payment!");

      if (senderAddress) {
        // Get the pending video request if any
        const currentPayment = paymentStatus.get(senderAddress);
        const pendingVideoRequest = currentPayment?.pendingVideoRequest;
        console.log("Pending video request:", pendingVideoRequest);

        markUserAsPaid(senderAddress, VIDEO_GENERATION_FEE, pendingVideoRequest);
        console.log(`✅ Video generation payment confirmed for ${senderAddress}`);

        await ctx.sendText(
          `✅ **Payment Confirmed!**\n` +
          `💰 ${VIDEO_GENERATION_FEE} USDC\n\n` +
          `🎬 Ready to generate video!`
        );

        // If there's a pending video request, automatically generate it
        if (pendingVideoRequest) {
          console.log(`🎬 Auto-generating pending video for ${senderAddress}: "${pendingVideoRequest}"`);

          // Add video emoji reaction
          await ctx.conversation.send(
            {
              action: "added",
              content: "🎬",
              reference: ctx.message.id,
              schema: "shortcode",
            } as Reaction,
            ContentTypeReaction,
          );

          // Generate the video
          await ctx.sendText(
            `🎬 **Generating video...**\n` +
            `📝 "${pendingVideoRequest}"\n\n` +
            `⏳ Please wait...`
          );

          // Send example video for testing (replace with actual generation)
          await ctx.sendText(
            `🎬 **Video Ready!**\n\n` +
            `📝 "${pendingVideoRequest}"\n` +
            `🔗 https://v3b.fal.media/files/b/tiger/49AK4V5zO6RkFNfI-wiHc_ype2StUS.mp4\n\n` +
            `✨ Thank you!`
          );

          // Add share button after video generation
          await ActionBuilder.create(
            "video-share-menu",
            "✨ Share your video:"
          )
            .add("share-video", "📤 Share", "primary")
            .send(ctx);

          // Consume the payment after video generation
          consumePayment(senderAddress);
        } else {
          // No specific video request, but user paid - offer to generate a video
          await ctx.sendText(
            `🎬 **Ready to generate video!**\n\n` +
            `✅ Payment confirmed\n\n` +
            `Type **@sora your description** to create video!`
          );
        }
      }
    } else {
      // Regular transaction confirmation
      await ctx.sendText(
        `✅ Transaction confirmed!`,
      );
    }

    // Don't continue to other handlers since we handled this message
    return;
  }

  // Continue to next middleware/handler
  await next();
};

const agent = await Agent.createFromEnv({
  codecs: [
    new ReactionCodec(),
    new ActionsCodec(),
    new IntentCodec(),
    new WalletSendCallsCodec(),
    new TransactionReferenceCodec()
  ],
});

// Apply the transaction reference middleware
agent.use(transactionReferenceMiddleware);

// Add inline actions middleware with error handling
agent.use(async (ctx, next) => {
  try {
    console.log("Processing message with middleware...");
    console.log("Message content type:", ctx.message.contentType);
    console.log("Message content:", ctx.message.content);

    // Handle intent messages (button clicks)
    if (ctx.message.contentType?.typeId === "intent") {
      console.log("🎯 Detected intent message - processing button click");
      const intentContent = ctx.message.content as IntentContent;
      console.log("Intent content:", intentContent);

      const handler = getActionHandler(intentContent.actionId);
      if (handler) {
        console.log(`🎯 Executing action: ${intentContent.actionId}`);
        await handler(ctx);
        return; // Don't continue to next middleware
      } else {
        console.log(`❌ No handler found for action: ${intentContent.actionId}`);
        await ctx.sendText(`❌ Unknown action: ${intentContent.actionId}`);
        return;
      }
    }

    await inlineActionsMiddleware(ctx, next);
  } catch (error) {
    console.error("Error in inline actions middleware:", error);
    // Continue to next middleware/handler
    await next();
  }
});


registerAction("leaderboard", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`🏆 Leaderboard button clicked by: ${senderAddress}`);

  try {
    await shareMiniApp(
      ctx,
      "https://new-mini-app-quickstart-pi-nine.vercel.app/leaderboard",
      "🏆 **Leaderboard** - Check the leaderboard here!"
    );
    console.log("✅ Leaderboard shared successfully");
  } catch (error) {
    console.error("❌ Error in leaderboard handler:", error);
    await ctx.sendText("❌ Sorry, there was an error opening the leaderboard. Please try again.");
  }
});

registerAction("video-feed", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`📺 Video feed button clicked by: ${senderAddress}`);

  try {
    await shareMiniApp(
      ctx,
      "https://new-mini-app-quickstart-pi-nine.vercel.app/",
      "📺 **Video Feed** - Browse all videos here!"
    );
    console.log("✅ Video feed shared successfully");
  } catch (error) {
    console.error("❌ Error in video-feed handler:", error);
    await ctx.sendText("❌ Sorry, there was an error opening the video feed. Please try again.");
  }
});

registerAction("share-video", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`📤 Share video button clicked by: ${senderAddress}`);

  try {
    // Simple share URL - you can customize this for your Coinbase app
    const shareUrl = "https://your-coinbase-app.com/share";

    await shareMiniApp(
      ctx,
      shareUrl,
      "📤 **Share to Feed** - Share this video with your followers!"
    );
    console.log("✅ Video share mini app opened successfully");
  } catch (error) {
    console.error("❌ Error in share-video handler:", error);
    await ctx.sendText("❌ Sorry, there was an error opening the share feature. Please try again.");
  }
});





registerAction("back-to-main", async (ctx) => {
  await showMainMenu(ctx);
});

// Payment-related actions
registerAction("check-balance", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`💰 Balance check requested by: ${senderAddress}`);

  try {
    if (!senderAddress) {
      await ctx.sendText("❌ Could not determine your wallet address.");
      return;
    }
    const balance = await usdcHandler.getUSDCBalance(senderAddress);
    await ctx.sendText(`💰 **Balance**: ${balance} USDC`);
    console.log(`✅ Balance check completed for ${senderAddress}: ${balance} USDC`);
  } catch (error) {
    console.error("❌ Error checking balance:", error);
    await ctx.sendText("❌ Sorry, there was an error checking your balance. Please try again.");
  }
});


registerAction("check-payment-status", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`🔍 Payment status check requested by: ${senderAddress}`);

  try {
    if (!senderAddress) {
      await ctx.sendText("❌ Could not determine your wallet address.");
      return;
    }

    const hasPaid = await hasUserPaidForVideo(senderAddress);
    const payment = paymentStatus.get(senderAddress);

    if (hasPaid && payment) {
      const timeLeft = Math.max(0, 60 - Math.floor((Date.now() - payment.timestamp) / (1000 * 60)));
      await ctx.sendText(
        `✅ **Payment Active**\n` +
        `💰 ${payment.amount} USDC • ⏰ ${timeLeft}m left\n\n` +
        `Type **@sora your description** to create videos!`
      );
    } else {
      await ctx.sendText(
        `❌ **Payment Required**\n` +
        `💰 ${VIDEO_GENERATION_FEE} USDC per video (1 hour)\n\n` +
        `Type **@sora your description** to pay and generate!`
      );
    }
    console.log(`✅ Payment status check completed for ${senderAddress}: ${hasPaid ? 'PAID' : 'NOT PAID'}`);
  } catch (error) {
    console.error("❌ Error checking payment status:", error);
    await ctx.sendText("❌ Sorry, there was an error checking your payment status. Please try again.");
  }
});

registerAction("generate-video-now", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`🎬 Generate video now requested by: ${senderAddress}`);

  try {
    if (!senderAddress) {
      await ctx.sendText("❌ Could not determine your wallet address.");
      return;
    }

    const hasPaid = await hasUserPaidForVideo(senderAddress);

    if (!hasPaid) {
      await ctx.sendText(
        `❌ **Payment Required**\n\n` +
        `💰 ${VIDEO_GENERATION_FEE} USDC needed\n\n` +
        `Type **@sora your description** to pay and generate!`
      );
      return;
    }

    // User has paid, ask for video description
    await ctx.sendText(
      `🎬 **Ready to generate videos!**\n\n` +
      `✅ Payment confirmed • ⏰ 1 hour valid\n\n` +
      `Type **@sora your description** to create videos!`
    );

    console.log(`✅ Video generation prompt sent to ${senderAddress}`);
  } catch (error) {
    console.error("❌ Error in generate-video-now handler:", error);
    await ctx.sendText("❌ Sorry, there was an error. Please try again.");
  }
});

registerAction("payment-menu", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`💳 Payment menu requested by: ${senderAddress}`);

  try {
    if (!senderAddress) {
      await ctx.sendText("❌ Could not determine your wallet address.");
      return;
    }

    // Just show balance check - much simpler
    const handler = getActionHandler("check-balance");
    if (handler) {
      await handler(ctx);
    }
    console.log(`✅ Balance check sent to ${senderAddress}`);
  } catch (error) {
    console.error("❌ Error in payment-menu handler:", error);
    await ctx.sendText("❌ Sorry, there was an error checking your balance. Please try again.");
  }
});


// Log all registered actions for debugging
console.log("🎯 Registered actions:", [
  "leaderboard",
  "video-feed",
  "share-video",
  "back-to-main",
  "check-balance",
  "check-payment-status",
  "generate-video-now",
  "payment-menu"
]);

// Helper function to show the main menu
async function showMainMenu(ctx: MessageContext) {
  try {
    console.log("Creating main menu...");
    await ActionBuilder.create(
      "main-menu",
      `🎬 **Sora Video Generator**

Type **@sora your description** to create videos
💰 **Fee**: ${VIDEO_GENERATION_FEE} USDC per video`,
    )
      .add("leaderboard", "🏆 Leaderboard", "primary")
      .add("video-feed", "📺 Video Feed", "primary")
      .add("payment-menu", "💰 Check Balance", "secondary")
      .send(ctx);
    console.log("Main menu sent successfully");
  } catch (error) {
    console.error("Error creating main menu:", error);
    throw error;
  }
}

agent.on("text", async (ctx) => {
  const videoCtx = ctx as VideoReactionContext;
  const messageContent = ctx.message.content.trim();
  const senderAddress = await ctx.getSenderAddress();
  console.log(`Received message: ${messageContent} by ${senderAddress}`);

  try {
    // Check for action keywords (fallback for button clicks)
    if (messageContent.toLowerCase().includes("help") || messageContent.toLowerCase().includes("more info")) {
      console.log("🔄 Fallback: Handling help action via text");
      const handler = getActionHandler("help");
      if (handler) {
        await handler(ctx);
        return;
      }
    }

    if (messageContent.toLowerCase().includes("leaderboard")) {
      console.log("🔄 Fallback: Handling leaderboard action via text");
      const handler = getActionHandler("leaderboard");
      if (handler) {
        await handler(ctx);
        return;
      }
    }

    if (messageContent.toLowerCase().includes("video feed")) {
      console.log("🔄 Fallback: Handling video-feed action via text");
      const handler = getActionHandler("video-feed");
      if (handler) {
        await handler(ctx);
        return;
      }
    }

    if (messageContent.toLowerCase().includes("payment") || messageContent.toLowerCase().includes("pay")) {
      console.log("🔄 Fallback: Handling payment action via text");
      const handler = getActionHandler("payment-menu");
      if (handler) {
        await handler(ctx);
        return;
      }
    }

    // Handle balance check command
    if (messageContent.startsWith("/balance")) {
      console.log("🔄 Handling balance check command");
      const handler = getActionHandler("check-balance");
      if (handler) {
        await handler(ctx);
        return;
      }
    }

    // Handle payment status check command
    if (messageContent.startsWith("/status") || messageContent.toLowerCase().includes("payment status")) {
      console.log("🔄 Handling payment status check command");
      const handler = getActionHandler("check-payment-status");
      if (handler) {
        await handler(ctx);
        return;
      }
    }

    // Handle manual video generation after payment
    if (messageContent.toLowerCase().includes("generate video") && !messageContent.toLowerCase().includes("@sora")) {
      console.log("🔄 Handling manual video generation request");
      const senderAddress = await ctx.getSenderAddress();

      if (!senderAddress) {
        await ctx.sendText("❌ Could not determine your wallet address.");
        return;
      }

      const hasPaid = await hasUserPaidForVideo(senderAddress);

      if (!hasPaid) {
        await ctx.sendText(
          `❌ **Payment Required**\n\n` +
          `You need to pay ${VIDEO_GENERATION_FEE} USDC first to generate videos.\n\n` +
          `Use **/tx ${VIDEO_GENERATION_FEE}** to pay, or type **@sora your description** to start the payment flow.`
        );
        return;
      }

      // User has paid, ask for video description
      await ctx.sendText(
        `🎬 **Ready to generate your video!**\n\n` +
        `✅ **Payment**: Confirmed (${VIDEO_GENERATION_FEE} USDC)\n` +
        `⏰ **Valid for**: 1 hour\n\n` +
        `Please describe the video you want to create:\n\n` +
        `Example: "A monkey dancing in a disco" or "A cat playing with a ball of yarn"`
      );
      return;
    }

    // Debug command to check balances and help diagnose payment issues
    if (messageContent.startsWith("/debug")) {
      console.log("🔄 Handling debug command");
      const senderAddress = await ctx.getSenderAddress();

      if (!senderAddress) {
        await ctx.sendText("❌ Could not determine your wallet address.");
        return;
      }

      try {
        const usdcBalance = await usdcHandler.getUSDCBalance(senderAddress);
        const agentAddress = agent.address || "";
        const agentUsdcBalance = await usdcHandler.getUSDCBalance(agentAddress);

        await ctx.sendText(
          `🔍 **Debug Information**\n\n` +
          `👤 **Your Address**: ${senderAddress}\n` +
          `💰 **Your USDC Balance**: ${usdcBalance} USDC\n\n` +
          `🤖 **Agent Address**: ${agentAddress}\n` +
          `💰 **Agent USDC Balance**: ${agentUsdcBalance} USDC\n\n` +
          `💸 **Required Fee**: ${VIDEO_GENERATION_FEE} USDC\n` +
          `⛽ **Note**: You also need ETH for gas fees!\n\n` +
          `💡 **Troubleshooting**:\n` +
          `• Make sure you have at least 0.001 USDC\n` +
          `• Make sure you have some ETH for gas\n` +
          `• Try using /tx 0.001 to test payment`
        );
      } catch (error) {
        await ctx.sendText(`❌ Error checking balances: ${error}`);
      }
      return;
    }

    // Test command to manually trigger video generation (for debugging)
    if (messageContent.startsWith("/test-video")) {
      console.log("🔄 Handling test video generation");
      const senderAddress = await ctx.getSenderAddress();

      if (!senderAddress) {
        await ctx.sendText("❌ Could not determine your wallet address.");
        return;
      }

      // Force mark user as paid for testing
      markUserAsPaid(senderAddress, VIDEO_GENERATION_FEE, "Test video from /test-video command");

      // Generate test video
      await ctx.sendText(
        `🎬 **Generating test video...**\n\n` +
        `📝 **Prompt**: "A monkey dancing in a disco"\n` +
        `💰 **Payment**: ✅ Confirmed (${VIDEO_GENERATION_FEE} USDC)\n\n` +
        `⏳ This may take a few minutes...`
      );

      // Send example video for testing
      await ctx.sendText(
        `🎬 **Your video is ready!**\n\n` +
        `📝 **Prompt**: "A monkey dancing in a disco"\n` +
        `🔗 **Video**: https://v3b.fal.media/files/b/tiger/49AK4V5zO6RkFNfI-wiHc_ype2StUS.mp4\n\n` +
        `✨ **Thank you for your payment!**`
      );

      // Add share button after video generation
      await ActionBuilder.create(
        "video-share-menu",
        "✨ Your video is ready! Share it with your followers:"
      )
        .add("share-video", "📤 Share to Feed", "primary")
        .send(ctx);

      return;
    }

    // Force video generation command (for testing after payment)
    if (messageContent.startsWith("/force-video")) {
      console.log("🔄 Handling force video generation");
      const senderAddress = await ctx.getSenderAddress();

      if (!senderAddress) {
        await ctx.sendText("❌ Could not determine your wallet address.");
        return;
      }

      // Mark user as paid and generate video immediately
      markUserAsPaid(senderAddress, VIDEO_GENERATION_FEE, "Force video generation");

      // Add video emoji reaction
      await ctx.conversation.send(
        {
          action: "added",
          content: "🎬",
          reference: ctx.message.id,
          schema: "shortcode",
        } as Reaction,
        ContentTypeReaction,
      );

      // Generate the video
      await ctx.sendText(
        `🎬 **Generating your video...**\n\n` +
        `📝 **Prompt**: "A monkey dancing in a disco"\n` +
        `💰 **Payment**: ✅ Confirmed (${VIDEO_GENERATION_FEE} USDC)\n\n` +
        `⏳ This may take a few minutes...`
      );

      // Send example video for testing
      await ctx.sendText(
        `🎬 **Your video is ready!**\n\n` +
        `📝 **Prompt**: "A monkey dancing in a disco"\n` +
        `🔗 **Video**: https://v3b.fal.media/files/b/tiger/49AK4V5zO6RkFNfI-wiHc_ype2StUS.mp4\n\n` +
        `✨ **Thank you for your payment!**`
      );

      // Add share button after video generation
      await ActionBuilder.create(
        "video-share-menu",
        "✨ Your video is ready! Share it with your followers:"
      )
        .add("share-video", "📤 Share to Feed", "primary")
        .send(ctx);

      return;
    }

    // Handle transaction command
    if (messageContent.startsWith("/tx")) {
      console.log("🔄 Handling transaction command");
      const agentAddress = agent.address || "";
      const senderAddress = await ctx.getSenderAddress();

      if (!senderAddress) {
        await ctx.sendText("❌ Could not determine your wallet address.");
        return;
      }

      const amount = parseFloat(messageContent.split(" ")[1]);
      if (isNaN(amount) || amount <= 0) {
        await ctx.sendText("Please provide a valid amount. Usage: /tx <amount>");
        return;
      }

      // Convert amount to USDC decimals (6 decimal places)
      const amountInDecimals = Math.floor(amount * Math.pow(10, 6));

      const walletSendCalls = usdcHandler.createUSDCTransferCalls(
        senderAddress,
        agentAddress,
        amountInDecimals,
      );
      console.log("Replied with wallet sendcall");
      await ctx.conversation.send(walletSendCalls, ContentTypeWalletSendCalls);

      // Send a follow-up message about transaction references
      await ctx.sendText(
        `💡 After completing the transaction, you can send a transaction reference message to confirm completion.`,
      );
      return;
    }


    // Check if the message is asking for video generation
    if (
      messageContent.toLowerCase().includes("@sora") ||
      messageContent.toLowerCase().includes("generate video") ||
      messageContent.toLowerCase().includes("create video")
    ) {
      // Add video emoji reaction for video generation requests
      console.log(`🎬 Reacting with video emoji for user: ${senderAddress}`);
      await ctx.conversation.send(
        {
          action: "added",
          content: "🎬",
          reference: ctx.message.id,
          schema: "shortcode",
        } as Reaction,
        ContentTypeReaction,
      );

      // Extract the prompt from the message
      let prompt = messageContent;

      // Remove common trigger words to get the actual prompt
      prompt = prompt.replace(/@sora/gi, "").trim();
      prompt = prompt.replace(/generate video/gi, "").trim();
      prompt = prompt.replace(/create video/gi, "").trim();

      if (!prompt) {
        await ctx.sendText(
          "Please provide a description for the video you want me to generate. Example: '@sora A cat playing with a ball of yarn'",
        );
        // Remove video emoji for invalid request
        if (videoCtx.videoReaction?.removeVideoEmoji) {
          await videoCtx.videoReaction.removeVideoEmoji();
        }
        return;
      }

      // Check if user has paid for video generation
      if (!senderAddress) {
        await ctx.sendText("❌ Could not determine your wallet address.");
        if (videoCtx.videoReaction?.removeVideoEmoji) {
          await videoCtx.videoReaction.removeVideoEmoji();
        }
        return;
      }

      const hasPaid = await hasUserPaidForVideo(senderAddress);

      if (!hasPaid) {
        console.log(`💰 Payment required for video generation from ${senderAddress}: "${prompt}"`);

        // Request payment for video generation
        await requestVideoPayment(ctx, prompt);

        // Remove video emoji since we're not generating yet
        if (videoCtx.videoReaction?.removeVideoEmoji) {
          await videoCtx.videoReaction.removeVideoEmoji();
        }
        return;
      }

      // User has paid, proceed with video generation
      console.log(`📝 Video request from ${senderAddress}: "${prompt}" (Payment confirmed)`);

      // Send response immediately
      await ctx.sendText(
        `🎬 **Generating your video...**\n\n` +
        `📝 **Prompt**: "${prompt}"\n` +
        `💰 **Payment**: ✅ Confirmed (${VIDEO_GENERATION_FEE} USDC)\n\n` +
        `⏳ This may take a few minutes...`
      );

      // TODO: Add database logic here to save video request
      // Example: await saveVideoRequest(senderAddress, prompt, timestamp);

      // Send example video for testing (replace with actual generation)
      await ctx.sendText(
        `🎬 **Your video is ready!**\n\n` +
        `📝 **Prompt**: "${prompt}"\n` +
        `🔗 **Video**: https://v3b.fal.media/files/b/tiger/49AK4V5zO6RkFNfI-wiHc_ype2StUS.mp4\n\n` +
        `✨ **Thank you for your payment!**`
      );

      // Add share button after video generation
      await ActionBuilder.create(
        "video-share-menu",
        "✨ Your video is ready! Share it with your followers:"
      )
        .add("share-video", "📤 Share to Feed", "primary")
        .send(ctx);

      // Remove video emoji after responding
      if (videoCtx.videoReaction?.removeVideoEmoji) {
        console.log("🗑️ Removing video emoji...");
        await videoCtx.videoReaction.removeVideoEmoji();
      }

      console.log(
        `✅ Video request response sent successfully to ${senderAddress}`,
      );
    } else {
      // If not a video generation request, show main menu
      try {
        await showMainMenu(ctx);
      } catch (menuError) {
        console.error("Error showing main menu:", menuError);
        // Fallback to simple text response
        await ctx.sendText(
          `🎬 **Sora Video Generator**\n\n` +
          `Type **@sora your description** to create videos\n` +
          `💰 **Fee**: ${VIDEO_GENERATION_FEE} USDC per video\n\n` +
          `**Examples:**\n` +
          `• @sora A cat playing with yarn\n` +
          `• @sora A sunset over the ocean\n` +
          `• @sora A robot dancing\n\n` +
          `**Commands:** /status • /balance • /tx <amount>`,
        );
      }
    }
  } catch (error: any) {
    console.error("Error generating video:", error);

    let errorMessage =
      "❌ Sorry, I encountered an error while generating your video.";

    if (error.status === 422) {
      errorMessage +=
        "\n\nValidation error - please check your prompt and try again.";
      console.error("Validation details:", error.body);
    } else if (error.status === 401) {
      errorMessage += "\n\nAuthentication error - please check your FAL_KEY.";
    } else if (error.status === 429) {
      errorMessage +=
        "\n\nRate limit exceeded - please wait a moment and try again.";
    }

    await ctx.sendText(errorMessage);

    // Remove video emoji on error
    if (videoCtx.videoReaction?.removeVideoEmoji) {
      try {
        await videoCtx.videoReaction.removeVideoEmoji();
      } catch (removeError) {
        console.error("Error removing video emoji:", removeError);
      }
    }
  }
});

agent.on("start", () => {
  console.log(`🎬 Sora Video Generator Agent is running...`);
  console.log(`Address: ${agent.address}`);
  console.log(`🔗${getTestUrl(agent.client)}`);
  console.log(`Send a message with @sora to generate videos!`);
});

void agent.start();
