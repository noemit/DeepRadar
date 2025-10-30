import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { getDocument, updateDocument } from "../../../../lib/firebaseAdmin";
import {
  getRadarGenerationSystemPrompt,
  buildRadarGenerationUserPrompt,
} from "../../../../lib/prompts/radarGeneration";
import {
  initRequestLogger,
  attachRequestIdHeader,
} from "../../../../lib/logger";

/**
 * Extract mermaid diagram and XML from LLM response
 */
function parseLLMResponse(content) {
  const mermaidMatch = content.match(/```mermaid\s*([\s\S]*?)```/);
  const xmlMatch = content.match(/```xml\s*([\s\S]*?)```/);

  let mermaidDiagram = "";
  let queryPlan = null;

  if (mermaidMatch) {
    mermaidDiagram = mermaidMatch[1].trim();
  }

  if (xmlMatch) {
    try {
      const parser = new XMLParser({ ignoreAttributes: false });
      const parsed = parser.parse(xmlMatch[1].trim());
      const qp = parsed?.queryPlan || {};
      const toArray = (v) => (Array.isArray(v) ? v : v != null ? [v] : []);
      const queries = toArray(qp?.queries?.query);
      const sourcesHint = toArray(qp?.sourcesHint?.source);
      // Compute final queries (precomputed, capped at 15)
      const finalQueries = queries.slice(0, 15);
      queryPlan = {
        queries,
        sourcesHint,
        finalQueries,
        lastLLMPrompt: qp?.lastLLMPrompt || "",
      };
    } catch (e) {
      console.error("Failed to parse XML from LLM:", e);
    }
  }

  return { mermaidDiagram, queryPlan };
}

/**
 * PATCH /api/radars/[radarId] - Update radar via chat refinement
 */
export async function PATCH(req, { params }) {
  const { logger, end, requestId } = initRequestLogger(
    req,
    "api/radars/[radarId]"
  );
  try {
    const { radarId } = params;
    const body = await req.json();
    const { refinementMessage, profile } = body;

    if (!refinementMessage) {
      logger.warn("validation.error", { reason: "missing refinementMessage" });
      return attachRequestIdHeader(
        NextResponse.json(
          { error: "refinementMessage is required", requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    // Get current radar
    const radarResult = await getDocument("radars", radarId);
    if (!radarResult.success) {
      logger.warn("not_found", { radarId });
      return attachRequestIdHeader(
        NextResponse.json(
          { error: "Radar not found", requestId },
          { status: 404 }
        ),
        requestId
      );
    }

    const currentRadar = radarResult.data;
    const currentProfile = profile || currentRadar.profile;

    // Build refinement prompt - reuse original generation prompt, append refinement notes at the end
    const systemPrompt = getRadarGenerationSystemPrompt();
    const baseUser = buildRadarGenerationUserPrompt(currentProfile);
    const userPrompt = `${baseUser}\n\nRefinement notes: ${refinementMessage}`;

    // Derive origin from the incoming request to avoid hardcoded ports in dev
    const origin =
      req.nextUrl?.origin ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || 3000}`);
    const deepInfraResponse = await fetch(`${origin}/api/deepinfra`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: userPrompt,
        systemPrompt,
        model:
          process.env.DEEP_INFRA_DEFAULT_MODEL ||
          "deepseek-ai/DeepSeek-V3.2-Exp",
      }),
    });

    if (!deepInfraResponse.ok) {
      const errorData = await deepInfraResponse.json();
      throw new Error(errorData.error || "Failed to refine radar");
    }

    const deepInfraData = await deepInfraResponse.json();
    const { mermaidDiagram, queryPlan } = parseLLMResponse(
      deepInfraData.content
    );

    if (!mermaidDiagram || !queryPlan) {
      logger.error("parse.error", new Error("Missing mermaid or XML from LLM"));
      return attachRequestIdHeader(
        NextResponse.json(
          { error: "Failed to parse LLM response", requestId },
          { status: 500 }
        ),
        requestId
      );
    }

    // Update radar
    const updateData = {};
    if (profile) updateData.profile = profile;
    updateData.mermaidDiagram = mermaidDiagram;
    updateData.queryPlan = {
      ...queryPlan,
      lastLLMPrompt: userPrompt,
    };

    await updateDocument("radars", radarId, updateData);

    // Skipping automatic report regeneration (v2 trigger) after refinement

    logger.info("request.success", { radarId, ...end(200) });
    return attachRequestIdHeader(
      NextResponse.json({
        success: true,
        radarId,
        mermaidDiagram,
        queryPlan,
        previousMermaidDiagram: currentRadar.mermaidDiagram,
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

/**
 * GET /api/radars/[radarId] - Fetch a radar by id (server-side via Admin SDK)
 */
export async function GET(req, { params }) {
  const { logger, end, requestId } = initRequestLogger(
    req,
    "api/radars/[radarId]"
  );
  try {
    const { radarId } = params;
    if (!radarId) {
      logger.warn("validation.error", { reason: "missing radarId" });
      return attachRequestIdHeader(
        NextResponse.json(
          { error: "radarId is required", requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const radarResult = await getDocument("radars", radarId);
    if (!radarResult.success) {
      logger.warn("not_found", { radarId });
      return attachRequestIdHeader(
        NextResponse.json(
          { error: "Radar not found", requestId },
          { status: 404 }
        ),
        requestId
      );
    }

    logger.info("request.success", { radarId, ...end(200) });
    return attachRequestIdHeader(
      NextResponse.json({ success: true, radar: radarResult.data, requestId }),
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
