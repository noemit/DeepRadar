import { NextResponse } from "next/server";
import {
  getDocument,
  createDocument,
} from "../../../../../../lib/firebaseAdmin";
import {
  filterRecentResults,
  searchYouCom,
} from "../../../../../../lib/services/youcom";
import {
  initRequestLogger,
  attachRequestIdHeader,
} from "../../../../../../lib/logger";

/**
 * Deduplicate results by URL
 */
function deduplicateResults(results) {
  const seen = new Set();
  return results.filter((result) => {
    const url = result.url || result.link;
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

/**
 * Normalize You.com API response to a flat array of result items
 */
function extractYouComItems(data) {
  if (!data || typeof data !== "object") return [];
  // Common shapes observed
  if (Array.isArray(data.results)) return data.results;
  if (data.results && Array.isArray(data.results.web)) return data.results.web;
  if (Array.isArray(data.hits)) return data.hits;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.organic)) return data.organic;
  // Some providers use nested web.results
  if (data.web && Array.isArray(data.web.results)) return data.web.results;
  return [];
}

/**
 * POST /api/radars/[radarId]/run/v2 - Simple report generation v2
 * Just searches queries and returns results as a bullet point list
 */
export async function POST(req, { params }) {
  const { logger, end, requestId } = initRequestLogger(
    req,
    "api/radars/run/v2"
  );
  try {
    const { radarId } = params;

    // Fast fail if You.com key missing
    if (!process.env.YOU_DOT_COM) {
      logger.error("config.error", new Error("Missing YOU_DOT_COM API key"));
      return attachRequestIdHeader(
        NextResponse.json(
          {
            error:
              "Search provider API key missing. Set YOU_DOT_COM in server environment.",
            requestId,
          },
          { status: 500 }
        ),
        requestId
      );
    }

    // Get radar
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

    const radar = radarResult.data;

    // Coerce queryPlan to object if stored as JSON string
    let effectiveQueryPlan = radar.queryPlan;
    if (typeof effectiveQueryPlan === "string") {
      try {
        effectiveQueryPlan = JSON.parse(effectiveQueryPlan);
      } catch {
        effectiveQueryPlan = {};
      }
    }

    // Use precomputed queries if available; otherwise fallback to base queries
    let searchQueries =
      Array.isArray(effectiveQueryPlan?.finalQueries) &&
      effectiveQueryPlan.finalQueries.length > 0
        ? effectiveQueryPlan.finalQueries
        : Array.isArray(effectiveQueryPlan?.queries)
        ? effectiveQueryPlan.queries
        : [];

    // Cap for provider friendliness
    const MAX_SEARCHES = 15;
    searchQueries = searchQueries.slice(0, MAX_SEARCHES);

    if (searchQueries.length === 0) {
      logger.warn("validation.error", { reason: "no search queries" });
      return attachRequestIdHeader(
        NextResponse.json(
          { error: "No search queries available", requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    logger.info("agent.run.start", {
      radarId,
      queryCount: searchQueries.length,
    });

    // Build a single agent prompt instructing strict JSON output
    const profile = radar?.profile || {};
    const sourcesHint = Array.isArray(effectiveQueryPlan?.sourcesHint)
      ? effectiveQueryPlan.sourcesHint
      : [];

    const promptParts = [];
    promptParts.push(
      "Looking for news from the last week on these topics, especially things that are interesting/unique."
    );
    if (typeof profile?.role === "string" && profile.role) {
      promptParts.push(
        `Consider things that are interesting to a ${profile.role}.`
      );
    }
    if (typeof profile?.industry === "string" && profile.industry) {
      promptParts.push(
        `Also focus on developments within ${profile.industry}.`
      );
    }
    if (Array.isArray(profile?.priorities) && profile.priorities.length > 0) {
      promptParts.push(
        `High priority topics: ${profile.priorities.join(", ")}.`
      );
    }
    if (Array.isArray(searchQueries) && searchQueries.length > 0) {
      promptParts.push(
        `Use these queries as hints: ${searchQueries.join(" | ")}.`
      );
    }

    // Use search queries directly instead of agent
    logger.info("search.batch.start", { radarId, count: searchQueries.length });
    const searchPromises = searchQueries.map(async (query) => {
      try {
        logger.debug("search.query.start", { query });
        const result = await searchYouCom(query);
        const items = extractYouComItems(result) || [];
        logger.debug("search.query.success", { query, count: items.length });
        return items.map((item) => ({ ...item, query }));
      } catch (error) {
        logger.warn("search.error", { query, error: error?.message });
        return [];
      }
    });

    const settled = await Promise.allSettled(searchPromises);
    const allResultsRaw = settled
      .flatMap((p) => (p.status === "fulfilled" ? p.value : []))
      .flat();

    const allResults = allResultsRaw
      .filter((r) => r && (r.url || r.link))
      .map((r) => ({
        title: r.title || r.headline || "",
        url: r.url || r.link || "",
        snippet: r.snippet || r.description || "",
        source: r.source || r.domain || "",
        date: r.date || r.publishedDate || r.createdAt || "",
        image:
          r.thumbnail_url ||
          r.thumbnail ||
          r.image ||
          (r.media && (r.media.thumbnail || r.media.image)) ||
          "",
      }));

    // Filter results within recent window (1 month)
    const recentResults = filterRecentResults(allResults, 1);

    // Mark duplicates by URL with emoji and flag
    const urlCounts = recentResults.reduce((acc, r) => {
      const u = r.url;
      if (u) acc[u] = (acc[u] || 0) + 1;
      return acc;
    }, {});
    const resultsWithDupesMarked = recentResults.map((r) => ({
      ...r,
      title:
        urlCounts[r.url] > 1 && !String(r.title).startsWith("🔁 ")
          ? `🔁 ${r.title}`
          : r.title,
      duplicate: urlCounts[r.url] > 1,
    }));

    // Deduplicate for downstream scoring to avoid repeats
    let uniqueResults = deduplicateResults(resultsWithDupesMarked);

    // Sort by most recent first (descending)
    const getItemTime = (r) =>
      new Date(r.date || r.publishedDate || r.createdAt || 0).getTime();
    uniqueResults = uniqueResults.sort(
      (a, b) => getItemTime(b) - getItemTime(a)
    );

    logger.info("search.batch.summary", {
      unique: uniqueResults.length,
      total: allResults.length,
      duplicates: Object.values(urlCounts).filter((c) => c > 1).length,
    });

    // Batch score with DeepInfra (5 at a time) using role/industry
    const role = typeof profile?.role === "string" ? profile.role : "";
    const industry =
      typeof profile?.industry === "string" ? profile.industry : "";

    const baseUrl =
      req.nextUrl?.origin ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:${process.env.PORT || 3000}`);

    const systemPrompt =
      "You are a strict evaluator. Score each item from 0.0 to 5.0 for how valuable it is to the specified role and industry. Return ONLY JSON: an array of objects [{ url: string, score: number }]. No prose.";

    const chunks = [];
    for (let i = 0; i < uniqueResults.length; i += 5)
      chunks.push(uniqueResults.slice(i, i + 5));
    const scoresMap = new Map();
    for (const chunk of chunks) {
      const lines = chunk.map((it, idx) => {
        const t = it.title || "";
        const s = it.snippet || "";
        const so = it.source || "";
        const d = it.date || "";
        return `${idx + 1}. ${t}\n- url: ${it.url}\n- source: ${so}${
          d ? `\n- date: ${d}` : ""
        }${s ? `\n- snippet: ${s}` : ""}`;
      });
      const userPrompt = `Role: ${role || "(unspecified)"}\nIndustry: ${
        industry || "(unspecified)"
      }\n\nEvaluate the following items and return JSON only with an array of { url, score } (0.0-5.0).\n\n${lines.join(
        "\n\n"
      )}`;

      const resp = await fetch(`${baseUrl}/api/deepinfra`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userPrompt, systemPrompt }),
      });
      if (!resp.ok) continue;
      const di = await resp.json();
      const content = di?.content || "";
      try {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed)) {
            parsed.forEach((row) => {
              const url = row?.url;
              const score =
                typeof row?.score === "number" ? row.score : undefined;
              if (url && typeof score === "number") scoresMap.set(url, score);
            });
          }
        }
      } catch (_) {}
    }

    const THRESHOLD = 4.5;
    const scoredResults = uniqueResults
      .map((r) => ({ ...r, score: scoresMap.get(r.url) }))
      .filter((r) => typeof r.score === "number" && r.score > THRESHOLD);

    const reportItems = scoredResults.slice(0, 50).map((result) => ({
      title: result.title || result.headline || "No title",
      url: result.url || result.link || "",
      snippet: result.snippet || result.description || "",
      source: result.source || result.domain || "Unknown",
      date: result.date || result.publishedDate || result.createdAt || "",
      image:
        result.image ||
        result.thumbnail_url ||
        result.thumbnail ||
        (result.media && (result.media.thumbnail || result.media.image)) ||
        "",
      score: result.score,
    }));

    // Create simple report structure with optional 1-week summary
    let summary = `Kept ${reportItems.length} of ${uniqueResults.length} unique results (> 4.5) from ${searchQueries.length} queries`;
    try {
      const weekCutoff = new Date();
      weekCutoff.setDate(weekCutoff.getDate() - 7);
      const withinWeek = uniqueResults.filter(
        (r) => getItemTime(r) >= weekCutoff.getTime()
      );
      // Prefer past week; fallback to newest overall
      const baseForSummary = (
        withinWeek.length > 0 ? withinWeek : uniqueResults
      ).slice(0, 30);
      if (baseForSummary.length > 0) {
        const sample = baseForSummary.map((r) => ({
          title: r.title || r.headline || "",
          source: r.source || r.domain || "",
          url: r.url || r.link || "",
          snippet: r.snippet || r.description || "",
          date: r.date || r.publishedDate || r.createdAt || "",
        }));

        const origin =
          req.nextUrl?.origin ||
          (process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : `http://localhost:${process.env.PORT || 3000}`);

        const windowLabel =
          withinWeek.length > 0 ? "the past week" : "recent items";
        const systemPrompt =
          "You are a concise tech analyst. Given a set of recent links, produce a 2-4 sentence summary highlighting key themes, trends, and notable releases. Keep it objective and compact (max ~80 words).";
        const userLines = sample
          .map((s, i) => {
            const parts = [
              `${i + 1}. ${s.title}`,
              s.source ? `· ${s.source}` : "",
              s.date ? `· ${s.date}` : "",
            ].filter(Boolean);
            const header = parts.join(" ");
            return s.snippet ? `${header}\n   ${s.snippet}` : header;
          })
          .join("\n");
        const userPrompt = `Summarize these items (title, source, optional snippet, date) from ${windowLabel}:\n\n${userLines}`;

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
        if (deepInfraResponse.ok) {
          const di = await deepInfraResponse.json();
          if (di?.content) summary = di.content.trim();
        }
      }
    } catch (_) {
      // Best-effort summarization; ignore errors
    }

    const summaryWithYou = `${summary}`;

    const reportData = {
      summary: summaryWithYou,
      items: reportItems,
      queryCount: searchQueries.length,
      resultCount: uniqueResults.length,
      generatedAt: new Date().toISOString(),
      version: "v2",
      debug: {
        scoring: {
          threshold: 4.5,
          kept: reportItems.length,
        },
      },
    };

    // Save report to Firestore
    const reportResult = await createDocument(
      `radars/${radarId}/reports`,
      reportData
    );

    if (!reportResult.success) {
      logger.warn("save.warning", {
        error: reportResult.error,
        message: "Report generated but failed to save",
      });
      // Still return the report even if save fails
    }

    logger.info("request.success", {
      radarId,
      reportId: reportResult.id,
      itemCount: reportItems.length,
      ...end(200),
    });

    return attachRequestIdHeader(
      NextResponse.json({
        success: true,
        reportId: reportResult.id,
        report: reportData,
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
