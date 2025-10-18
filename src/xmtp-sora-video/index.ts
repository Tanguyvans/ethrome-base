import { Agent, type MessageContext } from "@xmtp/agent-sdk";
import { getTestUrl } from "@xmtp/agent-sdk/debug";
import {
  ContentTypeReaction,
  ReactionCodec,
  type Reaction,
} from "@xmtp/content-type-reaction";
// @ts-ignore - Fal AI client types may not be available
import { fal } from "@fal-ai/client";
import { loadEnvFile } from "../../utils/general";

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
  codecs: [new ReactionCodec()],
});

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
      console.log("🎬 Reacting with video emoji...");
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
      await ctx.sendText(
        `🎬 I received your video request: "${prompt}"\n\nFor now, I'm in testing mode. When ready, I'll generate real videos using Sora 2!`,
      );

      // Remove video emoji after responding
      if (videoCtx.videoReaction?.removeVideoEmoji) {
        console.log("🗑️ Removing video emoji...");
        await videoCtx.videoReaction.removeVideoEmoji();
      }

      console.log("✅ Video request response sent successfully");
    } else {
      // If not a video generation request, provide help
      await ctx.sendText(
        `🎬 Hi! I'm the Sora Video Generator agent.\n\nTo generate a video, mention me with @sora or say "generate video" followed by your description.\n\nExamples:\n• "@sora A cat playing with a ball of yarn"\n• "Generate video: A sunset over the ocean"\n• "Create video: A robot dancing in a futuristic city"`,
      );
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
