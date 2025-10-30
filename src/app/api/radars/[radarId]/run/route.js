import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import { getDocument, createDocument } from "../../../../../lib/firebaseAdmin";
import {
  searchYouCom,
  filterRecentResults,
} from "../../../../../lib/services/youcom";
import {
  getReportSynthesisSystemPrompt,
  buildSynthesisUserPrompt,
} from "../../../../../lib/prompts/reportSynthesis";
import {
  initRequestLogger,
  attachRequestIdHeader,
} from "../../../../../lib/logger";

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
 * Remove undefined values from object recursively (Firestore doesn't allow undefined)
 */
function removeUndefined(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .map((item) => removeUndefined(item))
      .filter((item) => item !== undefined);
  }
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = removeUndefined(value);
    }
  }
  return cleaned;
}

/**
 * Extract unique domains
 */
function extractUniqueDomains(results) {
  const domains = new Set();
  results.forEach((result) => {
    try {
      const url = result.url || result.link;
      if (url) {
        const domain = new URL(url).hostname;
        domains.add(domain);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  });
  return domains.size;
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
 * POST /api/radars/[radarId]/run - Generate report by running searches
 */
export async function POST(req, { params }) {
  const { logger, end, requestId } = initRequestLogger(req, "api/radars/run");
  try {
    const { radarId } = params;
    const body = await req.json();
    const { freshRun = false } = body;

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

    // Check for cached report if not fresh run
    if (!freshRun) {
      // Get latest report
      // This would require a query to /radars/{radarId}/reports
      // For now, we'll always run fresh - can be optimized later
    }

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

    logger.info("search.batch.start", { radarId, count: searchQueries.length });

    // Collect raw responses for debugging in the report
    const youcomResponses = [];

    // Execute all searches in parallel (already capped)
    const promises = searchQueries.map(async (query) => {
      try {
        logger.debug("search.query.start", { query });
        const result = await searchYouCom(query);
        const items = extractYouComItems(result) || [];
        // Capture debug info (best-effort)
        try {
          youcomResponses.push({
            query,
            ok: true,
            count: items.length,
            keys: Object.keys(result || {}),
          });
        } catch (_) {
          // ignore serialization errors
        }
        logger.debug("search.query.success", {
          query,
          count: items.length,
        });
        return items.map((item) => ({
          ...item,
          query, // Track which query found this
        }));
      } catch (error) {
        logger.warn("search.error", { query, error: error?.message });
        try {
          youcomResponses.push({
            query,
            ok: false,
            error: error?.message,
          });
        } catch (_) {}
        return [];
      }
    });

    const settled = await Promise.allSettled(promises);
    const allResults = settled
      .flatMap((p) => (p.status === "fulfilled" ? p.value : []))
      .flat();

    // Filter results older than 3 months
    const recentResults = filterRecentResults(allResults, 3);

    // Deduplicate
    let uniqueResults = deduplicateResults(recentResults);

    // Sort by most recent first (descending)
    const getItemTime = (r) =>
      new Date(r.date || r.publishedDate || r.createdAt || 0).getTime();
    uniqueResults = uniqueResults.sort(
      (a, b) => getItemTime(b) - getItemTime(a)
    );

    logger.info("search.batch.summary", {
      unique: uniqueResults.length,
      total: allResults.length,
    });

    // Verify search results are being passed
    if (uniqueResults.length === 0) {
      logger.warn("validation.warning", {
        message: "No search results to synthesize",
        allResultsCount: allResults.length,
        recentResultsCount: recentResults.length,
      });
    }

    // Synthesize report via DeepInfra
    const systemPrompt = getReportSynthesisSystemPrompt();
    const userPrompt = buildSynthesisUserPrompt(uniqueResults, radar.profile);

    logger.debug("synthesis.prompt", {
      resultsCount: uniqueResults.length,
      promptLength: userPrompt.length,
      sampleResult: uniqueResults[0]
        ? {
            title: uniqueResults[0].title || uniqueResults[0].headline,
            url: uniqueResults[0].url || uniqueResults[0].link,
          }
        : null,
    });

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
          process.env.DEEP_INFRA_DEFAULT_MODEL ||
          "deepseek-ai/DeepSeek-V3.2-Exp",
      }),
    });

    if (!deepInfraResponse.ok) {
      const errorData = await deepInfraResponse.json();
      throw new Error(errorData.error || "Failed to synthesize report");
    }

    const deepInfraData = await deepInfraResponse.json();
    let reportData;

    logger.debug("synthesis.response", {
      contentLength: deepInfraData.content?.length || 0,
      hasXmlBlock: deepInfraData.content?.includes("```xml") || false,
      hasJsonBlock: deepInfraData.content?.includes("```json") || false,
    });

    try {
      // Try JSON first (sometimes AI returns JSON)
      const jsonMatch = deepInfraData.content.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1].trim());
          const report = parsed.report || parsed;
          if (report.summary || report.sections) {
            reportData = {
              summary: report.summary || "",
              sections: Array.isArray(report.sections)
                ? report.sections.map((s) => ({
                    title: s.title || "",
                    items: Array.isArray(s.items)
                      ? s.items.map((it) => ({
                          headline: it.headline || "",
                          url: it.url || "",
                          source: it.source || "",
                          snippet: it.snippet || "",
                          tags: Array.isArray(it.tags) ? it.tags : [],
                          ...(it.image && { image: it.image }),
                        }))
                      : [],
                  }))
                : [],
            };
            logger.info("synthesis.parse.success", { format: "JSON" });
          } else {
            throw new Error("JSON doesn't match expected structure");
          }
        } catch (jsonError) {
          logger.debug("synthesis.parse.json.failed", {
            error: jsonError.message,
            fallingBackToXml: true,
          });
          // Fall through to XML parsing
        }
      }

      // If JSON parsing didn't succeed, try XML/XML-like
      if (!reportData) {
        // Extract XML - try code block first, then look for <report> tag
        let xmlMatch = deepInfraData.content.match(/```xml\s*([\s\S]*?)```/);
        if (!xmlMatch) {
          xmlMatch = deepInfraData.content.match(/```\s*([\s\S]*?)```/);
        }
        let xml = xmlMatch ? xmlMatch[1].trim() : deepInfraData.content;

        // If content doesn't start with <report>, try to extract just the XML-like portion
        if (!xml.includes("<report")) {
          // Look for <report> tag in the content
          const reportStart = xml.indexOf("<report");
          if (reportStart >= 0) {
            xml = xml.substring(reportStart);
            // Find the closing tag
            const reportEnd = xml.lastIndexOf("</report>");
            if (reportEnd >= 0) {
              xml = xml.substring(0, reportEnd + 8); // +8 for "</report>"
            }
          }
        }

        // Clean up common issues in XML-like formatting
        xml = xml
          .replace(/&nbsp;/g, " ") // Replace HTML entities
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .trim();

        // Check if XML appears complete
        const hasClosingReportTag = xml.includes("</report>");
        const openingReportCount = (xml.match(/<report[^>]*>/gi) || []).length;
        const closingReportCount = (xml.match(/<\/report>/gi) || []).length;

        logger.debug("synthesis.parse.xml.check", {
          xmlLength: xml.length,
          hasClosingReportTag,
          openingTags: openingReportCount,
          closingTags: closingReportCount,
          isBalanced: openingReportCount === closingReportCount,
          startsWithReport: xml.trim().startsWith("<report"),
        });

        // Use very permissive XML parser configuration for XML-like formatting
        const parser = new XMLParser({
          ignoreAttributes: false,
          ignoreNameSpace: true,
          parseAttributeValue: true,
          trimValues: true,
          parseTrueNumberOnly: false,
          arrayMode: false, // Auto-detect arrays
          textNodeName: "#text",
          ignoreDeclaration: true,
          removeNSPrefix: true,
          stopNodes: [], // Don't stop parsing at any specific nodes
          processEntities: true,
          unpairedTags: [], // Allow self-closing tags
          alwaysCreateTextNode: false,
          isArray: () => false, // Let parser decide
          attributeNamePrefix: "",
          preserveOrder: false,
        });

        const parsed = parser.parse(xml);
        const report = parsed?.report || {};
        const toArray = (v) => (Array.isArray(v) ? v : v != null ? [v] : []);
        const sections = toArray(report?.sections?.section).map((s) => {
          const items = toArray(s?.items?.item).map((it) => ({
            headline: it?.headline || "",
            url: it?.url || "",
            source: it?.source || "",
            snippet: it?.snippet || "",
            tags: toArray(it?.tags?.tag),
            ...(it?.image && { image: it.image }),
          }));
          return { title: s?.title || "", items };
        });
        reportData = {
          summary: report?.summary || "",
          sections,
        };
        logger.info("synthesis.parse.success", {
          format: "XML",
          sectionsCount: sections.length,
          totalItems: sections.reduce((sum, s) => sum + s.items.length, 0),
        });
      }
    } catch (e) {
      // Log the parsing error and include unparsed content in debug
      const xmlMatch = deepInfraData.content.match(/```xml\s*([\s\S]*?)```/);
      const unparsedContent = xmlMatch
        ? xmlMatch[1].trim()
        : deepInfraData.content;

      logger.error("parse.error", e, {
        unparsedContent: unparsedContent.substring(0, 1000), // Truncate for logging
        unparsedContentLength: unparsedContent.length,
        rawContentLength: deepInfraData.content?.length || 0,
        hasClosingTag: unparsedContent.includes("</report>"),
        openingTags: (unparsedContent.match(/<report[^>]*>/g) || []).length,
        closingTags: (unparsedContent.match(/<\/report>/g) || []).length,
      });

      // Fallback: Create report directly from search results
      logger.info("parse.fallback", {
        message: "Using search results as fallback report",
        resultsCount: uniqueResults.length,
      });

      // Group results by query if available, or create a single section
      const itemsByQuery = {};
      uniqueResults.forEach((result) => {
        const query = result.query || "General Results";
        if (!itemsByQuery[query]) {
          itemsByQuery[query] = [];
        }
        itemsByQuery[query].push({
          headline: result.title || result.headline || "No title",
          url: result.url || result.link || "",
          source: result.source || result.domain || "Unknown",
          snippet: result.snippet || result.description || "",
          tags: [],
          ...((result.image || result.thumbnail) && {
            image: result.image || result.thumbnail,
          }),
        });
      });

      // Create sections from grouped results (max 6 sections, each with up to 10 items)
      const sections = Object.entries(itemsByQuery)
        .slice(0, 6)
        .map(([query, items]) => ({
          title: query.length > 50 ? query.substring(0, 50) + "..." : query,
          items: items.slice(0, 10),
        }));

      // If no query-based grouping, create a single section
      if (sections.length === 0 && uniqueResults.length > 0) {
        sections.push({
          title: "Search Results",
          items: uniqueResults.slice(0, 20).map((result) => ({
            headline: result.title || result.headline || "No title",
            url: result.url || result.link || "",
            source: result.source || result.domain || "Unknown",
            snippet: result.snippet || result.description || "",
            tags: [],
            ...((result.image || result.thumbnail) && {
              image: result.image || result.thumbnail,
            }),
          })),
        });
      }

      reportData = {
        summary:
          "Report generated from search results. " +
          `Found ${
            uniqueResults.length
          } unique sources across ${extractUniqueDomains(
            uniqueResults
          )} domains.`,
        sections,
        debug: {
          parseError: {
            message: e.message,
            stack: e.stack,
            unparsedContent: unparsedContent,
            rawResponse: deepInfraData.content,
          },
          fallbackUsed: true,
        },
      };
    }

    // Add metrics
    reportData.metrics = {
      totalSources: uniqueResults.length,
      uniqueDomains: extractUniqueDomains(uniqueResults),
    };

    // Attach You.com raw responses for debugging
    if (youcomResponses.length > 0) {
      reportData.debug = {
        ...(reportData.debug || {}),
        youcomResponses,
      };
    }

    // Add freshness window
    const now = new Date();
    reportData.freshnessWindow = {
      fromISO: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      toISO: now.toISOString(),
    };

    // Add inputs
    reportData.inputs = {
      queryPlanHash: JSON.stringify(effectiveQueryPlan),
      apiVersion: "1.0",
    };

    // Clean undefined values before saving to Firestore
    const cleanedReportData = removeUndefined(reportData);

    // Save report to Firestore
    const reportResult = await createDocument(
      `radars/${radarId}/reports`,
      cleanedReportData
    );

    if (!reportResult.success) {
      throw new Error(reportResult.error || "Failed to save report");
    }

    logger.info("request.success", {
      radarId,
      reportId: reportResult.id,
      ...end(200),
    });
    return attachRequestIdHeader(
      NextResponse.json({
        success: true,
        reportId: reportResult.id,
        report: cleanedReportData,
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
