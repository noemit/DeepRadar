import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
// Switch to Firestore REST (no client libraries)
import {
  restCreateDocument,
  restGetDocument,
  restUpdateDocument,
} from "../../../lib/firestoreRest";
import {
  getRadarGenerationSystemPrompt,
  buildRadarGenerationUserPrompt,
} from "../../../lib/prompts/radarGeneration";
import { initRequestLogger, attachRequestIdHeader } from "../../../lib/logger";

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
 * POST /api/radars - Create or update radar with generated plan
 */
export async function POST(req) {
  const { logger, end, requestId } = initRequestLogger(req, "api/radars");
  try {
    const body = await req.json();
    const { radarId, profile, voiceProfile, ownerId, title } = body;

    logger.info("request.start", {
      hasRadarId: Boolean(radarId),
      hasOwnerId: Boolean(ownerId),
      hasProfile: Boolean(profile),
    });

    if (!profile) {
      logger.warn("validation.error", {
        missing: { profile: !profile },
      });
      return attachRequestIdHeader(
        NextResponse.json(
          { error: "profile is required", requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    let effectiveRadarId = radarId;
    let radarResult = { success: false };

    if (effectiveRadarId) {
      const found = await restGetDocument("radars", effectiveRadarId);
      radarResult = found.success
        ? { success: true, data: { id: effectiveRadarId } }
        : { success: false, error: found.error };
    }

    // If no radar exists, create one server-side
    if (!radarResult.success) {
      if (!ownerId) {
        logger.warn("validation.error", { reason: "missing ownerId" });
        return attachRequestIdHeader(
          NextResponse.json(
            { error: "ownerId is required to create a radar", requestId },
            { status: 400 }
          ),
          requestId
        );
      }

      const nowMs = Date.now();
      const initialData = {
        ownerId,
        title:
          title || `${profile.industry || ""} - ${profile.role || ""}`.trim(),
        profile,
        mermaidDiagram: "",
        queryPlan: "",
        settings: {},
        createdAt: nowMs,
        updatedAt: nowMs,
      };

      const createRes = await restCreateDocument("radars", initialData);
      if (!createRes.success) {
        logger.error("firestore.create.error", {
          message: createRes.error,
        });
        throw new Error(createRes.error || "Failed to create radar");
      }
      logger.info("firestore.create.success", { id: createRes.id });
      effectiveRadarId = createRes.id;
      radarResult = {
        success: true,
        data: { id: effectiveRadarId, ...initialData },
      };
    }

    // Call DeepInfra to generate mermaid + query plan
    const systemPrompt = getRadarGenerationSystemPrompt();
    const userPrompt = buildRadarGenerationUserPrompt(profile);

    // Derive origin from the incoming request to avoid hardcoded ports in dev
    const origin =
      req.nextUrl?.origin ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || 3000}`);
    logger.info("deepinfra.request.start", {
      origin,
      model:
        process.env.DEEP_INFRA_DEFAULT_MODEL || "deepseek-ai/DeepSeek-V3.2-Exp",
    });
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
      let errorData = null;
      try {
        errorData = await deepInfraResponse.json();
      } catch {}
      logger.error("deepinfra.request.error", {
        status: deepInfraResponse.status,
        statusText: deepInfraResponse.statusText,
        error: errorData?.error,
      });
      throw new Error(
        errorData?.error ||
          `Failed to generate radar plan (status ${deepInfraResponse.status})`
      );
    }

    const deepInfraData = await deepInfraResponse.json();
    const { mermaidDiagram, queryPlan } = parseLLMResponse(
      deepInfraData.content
    );

    if (!mermaidDiagram || !queryPlan) {
      logger.error("parse.error", new Error("Missing mermaid or XML from LLM"));
      return attachRequestIdHeader(
        NextResponse.json(
          {
            error:
              "Failed to parse LLM response. Expected mermaid and xml code blocks.",
            requestId,
          },
          { status: 500 }
        ),
        requestId
      );
    }

    // Update radar with generated diagram and plan
    const updateData = {
      profile,
      mermaidDiagram,
      // Store as JSON string to avoid Firestore/Datastore nested entity constraints
      // Downstream readers should parse when needed
      queryPlan: JSON.stringify({ ...queryPlan, lastLLMPrompt: userPrompt }),
      updatedAt: Date.now(),
    };

    if (voiceProfile) {
      // Update user's voice profile if provided
      // This would typically go in /users/{userId} but we can handle it here
    }

    const updateRes = await restUpdateDocument(
      "radars",
      effectiveRadarId,
      updateData
    );
    if (!updateRes.success) {
      logger.error("firestore.update.error", {
        id: effectiveRadarId,
        message: updateRes.error,
      });
      throw new Error(updateRes.error || "Failed to update radar");
    }

    // Do not auto-run report here. Report generation will be triggered from the radar page after load.

    logger.info("request.success", { radarId: effectiveRadarId, ...end(200) });
    return attachRequestIdHeader(
      NextResponse.json({
        success: true,
        radarId: effectiveRadarId,
        mermaidDiagram,
        queryPlan,
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
