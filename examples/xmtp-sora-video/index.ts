import { Agent } from "@xmtp/agent-sdk";
import { getTestUrl } from "@xmtp/agent-sdk/debug";
// @ts-ignore - Fal AI client types may not be available
import { fal } from "@fal-ai/client";
import { loadEnvFile } from "../../utils/general";

loadEnvFile();

// Configure Fal AI client
fal.config({
  credentials: process.env.FAL_KEY,
});

const agent = await Agent.createFromEnv({});

agent.on("text", async (ctx) => {
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
        return;
      }

      // Send initial response
      await ctx.sendText(
        `🎬 Generating your video: "${prompt}"\n\nThis may take a few minutes...`,
      );

      // Generate video using Fal AI Sora 2
      console.log("Sending request to Fal AI with prompt:", prompt);
      const result = await fal.subscribe("fal-ai/sora-2/text-to-video", {
        input: {
          prompt: prompt,
          resolution: "720p",
          aspect_ratio: "16:9",
          duration: 4,
        },
        logs: true,
        onQueueUpdate: (update: any) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log: any) => log.message).forEach(console.log);
          }
        },
      });

      console.log("Video generation completed:", result.data);

      if (result.data && result.data.video) {
        const videoUrl = result.data.video.url;
        const videoId = result.data.video_id;

        await ctx.sendText(
          `✅ Video generated successfully!\n\n🎥 Video ID: ${videoId}\n\n🎬 Your video:`,
        );

        // Send the video URL - XMTP should automatically detect and display it as a video
        await ctx.sendText(videoUrl);
      } else {
        await ctx.sendText(
          "❌ Sorry, I couldn't generate the video. Please try again with a different description.",
        );
      }
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
  }
});

agent.on("start", () => {
  console.log(`🎬 Sora Video Generator Agent is running...`);
  console.log(`Address: ${agent.address}`);
  console.log(`🔗${getTestUrl(agent.client)}`);
  console.log(`Send a message with @sora to generate videos!`);
});

void agent.start();
