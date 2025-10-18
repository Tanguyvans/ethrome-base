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
} from "../../utils/inline-actions/inline-actions.js";
import {
  ContentTypeActions,
  ActionsCodec,
} from "../../utils/inline-actions/types/ActionsContent.js";
// @ts-ignore - Fal AI client types may not be available
import { fal } from "@fal-ai/client";
import { loadEnvFile } from "../../utils/general.js";

loadEnvFile();

// Configure Fal AI client
fal.config({
  credentials: process.env.FAL_KEY,
});

// Extended context type to include video generation reaction helpers
interface VideoReactionContext extends MessageContext {
  videoReaction?: {
    removeVideoEmoji: () => Promise<void>;
  };
}

const agent = await Agent.createFromEnv({
  codecs: [new ReactionCodec(), new ActionsCodec()],
});

// Add inline actions middleware with error handling
agent.use(async (ctx, next) => {
  try {
    await inlineActionsMiddleware(ctx, next);
  } catch (error) {
    console.error("Error in inline actions middleware:", error);
    // Continue to next middleware/handler
    await next();
  }
});

// Register action handlers
registerAction("generate-video", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`🎬 Generate video button clicked by: ${senderAddress}`);
  await ctx.sendText(
    "🎬 To generate a video, just type '@sora' followed by your description!\n\nExample: '@sora A cat playing with a ball of yarn'",
  );
});

registerAction("leaderboard", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`🏆 Leaderboard button clicked by: ${senderAddress}`);
  await ctx.sendText(
    "🏆 Opening leaderboard in miniapp...\n\n[This would open your frontend miniapp URL with leaderboard view]",
  );
});

registerAction("video-feed", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`📺 Video feed button clicked by: ${senderAddress}`);
  await ctx.sendText(
    "📺 Opening video feed in miniapp...\n\n[This would open your frontend miniapp URL with video feed view]",
  );
});

registerAction("examples", async (ctx) => {
  await ctx.sendText(`🎬 Here are some great video prompts to try:

• "@sora A dramatic Hollywood breakup scene at dusk on a quiet suburban street"
• "@sora A futuristic city with flying cars and neon lights"
• "@sora A peaceful forest with sunlight filtering through the trees"
• "@sora A chef preparing a gourmet meal in a modern kitchen"
• "@sora A robot dancing in a futuristic city"

Just copy any of these and send them to me!`);
});

registerAction("settings", async (ctx) => {
  await ctx.sendText(`⚙️ Video Settings:

• Resolution: 720p
• Aspect Ratio: 16:9
• Duration: 4 seconds
• Format: MP4

These settings are optimized for the best quality and performance!`);
});

registerAction("help", async (ctx) => {
  await showMainMenu(ctx);
});

// Helper function to show the main menu
async function showMainMenu(ctx: MessageContext) {
  try {
    console.log("Creating main menu...");
    await ActionBuilder.create(
      "main-menu",
      `👋 Welcome to Sora Video Generator Bot!

I'm here to help you create amazing videos using OpenAI's Sora 2 model. I can generate 4-second videos from your text descriptions!

✨ Choose an action below to get started:`,
    )
      .add("generate-video", "🎬 Generate Video", "primary")
      .add("leaderboard", "🏆 Leaderboard", "primary")
      .add("video-feed", "📺 Video Feed", "primary")
      .add("examples", "💡 See Examples", "secondary")
      .add("settings", "⚙️ Video Settings", "secondary")
      .add("help", "ℹ️ More Info", "secondary")
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

      await ctx.sendText(
        `🎬 I received your video request: "${prompt}"\n\nFor now, I'm in testing mode. When ready, I'll generate real videos using Sora 2!`,
      );

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
          `🎬 Hi! I'm the Sora Video Generator agent.\n\nTo generate a video, mention me with @sora or say "generate video" followed by your description.\n\nExamples:\n• "@sora A cat playing with a ball of yarn"\n• "Generate video: A sunset over the ocean"\n• "Create video: A robot dancing in a futuristic city"`,
        );
      }
    }
  } catch (error) {
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
