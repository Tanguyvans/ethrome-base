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

// Register action handlers
registerAction("generate-video", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`🎬 Generate video button clicked by: ${senderAddress}`);

  try {
    // Show prompt input interface
    await ActionBuilder.create(
      "video-prompt-input",
      `🎬 **Generate Your Video**

Type your video description below and I'll create an amazing video for you!

**Examples:**
• A cat playing with a ball of yarn
• A futuristic city with flying cars
• A chef preparing a gourmet meal
• A robot dancing in a futuristic city

Just type your description and I'll handle the rest! 🎥`,
    )
      .add("back-to-main", "← Back to Main Menu", "secondary")
      .send(ctx);
    console.log("✅ Generate video response sent successfully");
  } catch (error) {
    console.error("❌ Error in generate-video handler:", error);
    await ctx.sendText("❌ Sorry, there was an error. Please try again.");
  }
});

registerAction("leaderboard", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`🏆 Leaderboard button clicked by: ${senderAddress}`);

  try {
    // Open leaderboard URL
    await ctx.sendText(
      `🏆 **Opening Leaderboard**

[Click here to view the leaderboard](fake-link)

See the most popular videos and vote for your favorites! 🏆`,
    );
    console.log("✅ Leaderboard response sent successfully");
  } catch (error) {
    console.error("❌ Error in leaderboard handler:", error);
    await ctx.sendText("❌ Sorry, there was an error opening the leaderboard. Please try again.");
  }
});

registerAction("video-feed", async (ctx) => {
  const senderAddress = await ctx.getSenderAddress();
  console.log(`📺 Video feed button clicked by: ${senderAddress}`);

  try {
    // Open video feed URL
    await ctx.sendText(
      `📺 **Opening Video Feed**

[Click here to browse all videos](fake-link)

Discover amazing videos created by the community! 🎬`,
    );
    console.log("✅ Video feed response sent successfully");
  } catch (error) {
    console.error("❌ Error in video-feed handler:", error);
    await ctx.sendText("❌ Sorry, there was an error opening the video feed. Please try again.");
  }
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
  const senderAddress = await ctx.getSenderAddress();
  console.log(`ℹ️ More info button clicked by: ${senderAddress}`);

  try {
    await ctx.sendText(`ℹ️ **About Sora Video Generator**

🎬 **What is this?**
I'm an AI agent that generates amazing videos using OpenAI's Sora 2 model! You can create 4-second videos from simple text descriptions.

💬 **How to use:**
• **In any chat**: Just type \`@sora your description\` and I'll generate a video
• **Group chats**: Works perfectly! Everyone can see and enjoy the videos
• **Private chats**: Create videos just for you

🏆 **Community Features:**
• **Leaderboard**: See the most popular videos voted by the community
• **Video Feed**: Browse all videos created by users
• **Likes & Voting**: Rate videos to help the best ones rise to the top

🎥 **Video Specs:**
• Resolution: 720p HD
• Duration: 4 seconds
• Format: MP4
• Aspect Ratio: 16:9

✨ **Perfect for:**
• Creative projects
• Social media content
• Group entertainment
• Brainstorming ideas
• Having fun with friends!

Ready to create something amazing? Just type \`@sora your idea\` and let's go! 🚀`);
    console.log("✅ Help response sent successfully");
  } catch (error) {
    console.error("❌ Error in help handler:", error);
    await ctx.sendText("❌ Sorry, there was an error. Please try again.");
  }
});

registerAction("back-to-main", async (ctx) => {
  await showMainMenu(ctx);
});

// Add a simple test action for debugging
registerAction("test-action", async (ctx) => {
  console.log("🧪 Test action clicked!");
  await ctx.sendText("🧪 Test action working! The button system is functioning correctly.");
});

// Add a test for intent handling
registerAction("test-intent", async (ctx) => {
  console.log("🎯 Test intent action clicked!");
  await ctx.sendText("🎯 Intent handling working! Button clicks are being processed correctly.");
});

// Log all registered actions for debugging
console.log("🎯 Registered actions:", [
  "generate-video",
  "leaderboard",
  "video-feed",
  "examples",
  "settings",
  "help",
  "back-to-main",
  "test-action",
  "test-intent"
]);

// Helper function to show the main menu
async function showMainMenu(ctx: MessageContext) {
  try {
    console.log("Creating main menu...");
    await ActionBuilder.create(
      "main-menu",
      `👋 Welcome to Sora Video Generator!

🎬 Create amazing videos with AI in any chat!
📱 Works in group chats, private chats, and DMs
🏆 Community features with leaderboards and voting

✨ Choose an action below to get started:`,
    )
      .add("generate-video", "🎬 Generate Video", "primary")
      .add("leaderboard", "🏆 Leaderboard", "primary")
      .add("video-feed", "📺 Video Feed", "primary")
      .add("test-action", "🧪 Test Button", "secondary")
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

    if (messageContent.toLowerCase().includes("test")) {
      console.log("🔄 Fallback: Handling test-action via text");
      const handler = getActionHandler("test-action");
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
