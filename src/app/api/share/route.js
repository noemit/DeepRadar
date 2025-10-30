import { NextResponse } from "next/server";
import { getDocument, createDocument } from "../../../lib/firebaseAdmin";
import { initRequestLogger, attachRequestIdHeader } from "../../../lib/logger";

/**
 * Generate share snippet in user's voice
 */
async function generateShareSnippet(item, voiceProfile) {
  const systemPrompt = `You generate short, shareable snippets (140-220 characters) in the user's writing style.

User's voice profile:
- Tone hints: ${voiceProfile?.toneHints?.join(", ") || "professional, concise"}
- Sample phrases: ${voiceProfile?.samplePhrases?.join("; ") || "none provided"}

Item to share:
- Headline: ${item.headline || item.title || "No title"}
- Source: ${item.source}
- Snippet: ${item.snippet}
- URL: ${item.url}

Generate a shareable blip that:
- Is 140-220 characters
- Includes the item's URL
- Matches the user's writing style
- No hashtags unless the user typically uses them
- Engages the reader briefly`;

  const userPrompt = `Create a share snippet for this item in my voice.`;

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  const deepInfraResponse = await fetch(`${baseUrl}/api/deepinfra`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: userPrompt,
      systemPrompt,
      model:
        process.env.DEEP_INFRA_DEFAULT_MODEL || "deepseek-ai/DeepSeek-V3.2-Exp",
    }),
  });

  if (!deepInfraResponse.ok) {
    const errorData = await deepInfraResponse.json();
    throw new Error(errorData.error || "Failed to generate snippet");
  }

  const data = await deepInfraResponse.json();
  return data.content.trim();
}

/**
 * POST /api/share - Generate share snippet and log interaction
 */
export async function POST(req) {
  const { logger, end, requestId } = initRequestLogger(req, "api/share");
  try {
    const body = await req.json();
    const { reportId, itemIndex, radarId, userId } = body;

    if (!reportId || itemIndex === undefined || !body.item) {
      logger.warn("validation.error", {
        missing: {
          reportId: !reportId,
          itemIndex: itemIndex === undefined,
          item: !body.item,
        },
      });
      return attachRequestIdHeader(
        NextResponse.json(
          { error: "reportId, itemIndex, and item are required", requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const { item } = body;

    // Get user's voice profile
    let voiceProfile = { toneHints: [], samplePhrases: [] };
    if (userId) {
      const userResult = await getDocument("users", userId);
      if (userResult.success && userResult.data?.voiceProfile) {
        voiceProfile = userResult.data.voiceProfile;
      }
    }

    if (!item) {
      return NextResponse.json(
        { error: "item data is required" },
        { status: 400 }
      );
    }

    // Generate snippet
    const snippet = await generateShareSnippet(item, voiceProfile);

    // Log interaction
    if (userId && radarId) {
      await createDocument("interactions", {
        userId,
        radarId,
        type: "share",
        payload: {
          reportId,
          itemIndex,
          snippet,
        },
        createdAt: new Date(),
      });
    }

    logger.info("request.success", end(200));
    return attachRequestIdHeader(
      NextResponse.json({
        success: true,
        text: snippet,
        requestId,
      }),
      requestId
    );
  } catch (error) {
    logger.error("request.error", error, end(500));
    return attachRequestIdHeader(
      NextResponse.json(
        { error: error.message || "Internal server error", requestId },
        { status: 500 }
      ),
      requestId
    );
  }
}
