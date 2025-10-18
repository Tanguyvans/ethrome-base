import { Agent, type MessageContext } from "@xmtp/agent-sdk";
import { getTestUrl } from "@xmtp/agent-sdk/debug";
import {
  ContentTypeReaction,
  ReactionCodec,
  type Reaction,
} from "@xmtp/content-type-reaction";
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
// @ts-ignore - OnchainKit types may not be available
import { useComposeCast } from "@coinbase/onchainkit/minikit";

loadEnvFile();

// Configure Fal AI client
fal.config({
  credentials: process.env.FAL_KEY,
});

// Simple in-memory storage for video data (in production, use a database)
const videoStorage = new Map<string, { prompt: string; videoUrl: string; timestamp: Date }>();

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

// Helper function to create a shareable cast with video
async function createShareableCast(
  videoUrl: string,
  prompt: string,
  senderAddress: string
) {
  try {
    // Create a shareable cast text with the video
    const castText = `🎬 Check out this AI-generated video!\n\nPrompt: "${prompt}"\n\nCreated with @sora-video-agent\n\n#AI #Video #Sora #XMTP`;
    
    // In a real implementation, you would use the OnchainKit composeCast here
    // For now, we'll return the data that would be used for casting
    return {
      text: castText,
      embeds: [videoUrl],
      mentions: [senderAddress]
    };
  } catch (error) {
    console.error("❌ Error creating shareable cast:", error);
    throw error;
  }
}

const agent = await Agent.createFromEnv({
  codecs: [new ReactionCodec(), new ActionsCodec(), new IntentCodec()],
});

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





registerAction("back-to-main", async (ctx) => {
  await showMainMenu(ctx);
});

registerAction("share-video", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`📤 Share video button clicked by: ${senderAddress}`);

  try {
    if (!senderAddress) {
      await ctx.sendText("❌ Unable to identify sender. Please try again.");
      return;
    }

    // Find the most recent video for this user
    let latestVideo = null;
    let latestKey = "";
    
    for (const [key, videoData] of videoStorage.entries()) {
      if (key.startsWith(senderAddress)) {
        if (!latestVideo || videoData.timestamp > latestVideo.timestamp) {
          latestVideo = videoData;
          latestKey = key;
        }
      }
    }
    
    if (!latestVideo) {
      await ctx.sendText("❌ No video found to share. Please generate a video first using @sora your description");
      return;
    }
    
    console.log(`📤 Sharing video for ${senderAddress}: "${latestVideo.prompt}" - ${latestVideo.videoUrl}`);
    
    // Create shareable cast data
    const castData = await createShareableCast(latestVideo.videoUrl, latestVideo.prompt, senderAddress);
    
    // Send the shareable content with instructions
    await ctx.sendText(
      `📤 **Ready to Share!**\n\n` +
      `Here's your shareable content:\n\n` +
      `**Text:**\n${castData.text}\n\n` +
      `**Video:** ${latestVideo.videoUrl}\n\n` +
      `Copy the text above and share it on your social feed with the video link! ` +
      `Or use the mini app below for an easier sharing experience.`
    );
    
    // Also provide the mini app option
    await shareMiniApp(
      ctx,
      `https://new-mini-app-quickstart-pi-nine.vercel.app/share?video=${encodeURIComponent(latestVideo.videoUrl)}&text=${encodeURIComponent(castData.text)}`,
      `🚀 **Easy Share** - Use this mini app to share directly to your feed!`
    );
    
    console.log("✅ Video share interface opened successfully");
  } catch (error) {
    console.error("❌ Error in share-video handler:", error);
    await ctx.sendText("❌ Sorry, there was an error opening the share interface. Please try again.");
  }
});


// Log all registered actions for debugging
console.log("🎯 Registered actions:", [
  "leaderboard",
  "video-feed",
  "back-to-main",
  "share-video"
]);

// Helper function to show the main menu
async function showMainMenu(ctx: MessageContext) {
  try {
    console.log("Creating main menu...");
    await ActionBuilder.create(
      "main-menu",
      `👋 Welcome to Sora Video Generator!

🎬 To create videos, just type: **@sora your description**
📱 Works in any chat - group chats, private chats, and DMs
🏆 Community features with leaderboards and voting

✨ Choose an action below:`,
    )
      .add("leaderboard", "🏆 Leaderboard", "primary")
      .add("video-feed", "📺 Video Feed", "primary")
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

    if (messageContent.toLowerCase().includes("share")) {
      console.log("🔄 Fallback: Handling share action via text");
      const handler = getActionHandler("share-video");
      if (handler) {
        await handler(ctx);
        return;
      }
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

      // Send response immediately
      console.log(`📝 Video request from ${senderAddress}: "${prompt}"`);

      // TODO: Add database logic here to save video request
      // Example: await saveVideoRequest(senderAddress, prompt, timestamp);

      // Send example video for testing with share button
      const videoUrl = "https://v3b.fal.media/files/b/tiger/49AK4V5zO6RkFNfI-wiHc_ype2StUS.mp4";
      
      // Store the prompt and video URL for sharing
      const storageKey = `${senderAddress}-${Date.now()}`;
      videoStorage.set(storageKey, {
        prompt,
        videoUrl,
        timestamp: new Date()
      });
      console.log(`📝 Stored video data for sharing - Key: ${storageKey}, Prompt: "${prompt}", Video: ${videoUrl}`);
      
      await ActionBuilder.create(
        "video-generated",
        `🎬 I received your video request: "${prompt}"\n\nHere's an example of what your video will look like:\n\n${videoUrl}`,
      )
        .add("share-video", "📤 Share to Feed", "primary")
        .add("back-to-main", "🏠 Main Menu", "secondary")
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
          `🎬 Hi! I'm the Sora Video Generator agent.\n\nTo generate a video, just type: **@sora your description**\n\nExamples:\n• @sora A cat playing with a ball of yarn\n• @sora A sunset over the ocean\n• @sora A robot dancing in a futuristic city`,
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
