/**
 * You.com Search API client
 */

const YOU_COM_API_BASE = "https://api.ydc-index.io/v1";
const YOU_COM_AGENTS_BASE = "https://api.you.com/v1";
import { createLogger } from "../logger";

const youLogger = createLogger({ service: "youcom" });

/**
 * Search You.com API
 * @param {string} query - Search query
 * @returns {Promise<Object>} Search results
 */
export async function searchYouCom(query) {
  const API_KEY = process.env.YOU_DOT_COM;

  if (!API_KEY) {
    throw new Error("YOU_DOT_COM API key not configured");
  }

  const url = `${YOU_COM_API_BASE}/search?query=${encodeURIComponent(query)}`;

  try {
    youLogger.info("request.start", {
      endpoint: "search",
      hasApiKey: true,
      queryLength: (query || "").length,
    });
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      youLogger.warn("request.failure", {
        status: response.status,
        endpoint: "search",
      });
      throw new Error(`You.com API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const size = Array.isArray(data?.results)
      ? data.results.length
      : ["hits", "items", "organic"].reduce(
          (acc, key) => (Array.isArray(data?.[key]) ? data[key].length : acc),
          0
        );
    youLogger.info("request.success", {
      endpoint: "search",
      resultCount: size,
      keys: Object.keys(data || {}),
    });
    return data;
  } catch (error) {
    youLogger.error("request.error", error, { endpoint: "search" });
    throw error;
  }
}

/**
 * Filter results older than 1 year
 * @param {Array} results - Search results
 * @returns {Array} Filtered results
 */
export function filterRecentResults(results, maxAgeMonths = 12) {
  if (!Array.isArray(results)) return [];

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - maxAgeMonths);

  return results.filter((result) => {
    // Try to extract date from various possible fields
    const dateStr = result.date || result.publishedDate || result.createdAt;
    if (!dateStr) return true; // Keep if no date found

    const itemDate = new Date(dateStr);
    return !isNaN(itemDate.getTime()) && itemDate >= cutoffDate;
  });
}

/**
 * Run a single You.com Agent with web_search tool
 * Uses the new agents/runs endpoint to execute a composed prompt.
 * @param {string} inputPrompt
 * @param {Object} [options]
 * @param {string} [options.agent]
 * @param {boolean} [options.stream]
 * @returns {Promise<Object>} Raw response from You.com
 */
export async function runYouComAgent(inputPrompt, options = {}) {
  const API_KEY = process.env.YOU_DOT_COM || process.env.YOU_DOT_COM_BEARER;
  if (!API_KEY) {
    throw new Error("YOU_DOT_COM API key not configured");
  }

  const url = `${YOU_COM_AGENTS_BASE}/agents/runs`;
  const body = {
    agent: options.agent || "express",
    input: inputPrompt,
    stream: options.stream ?? false,
    tools: [{ type: "web_search" }],
  };

  try {
    youLogger.info("request.start", {
      endpoint: "agents/runs",
      hasApiKey: true,
      inputLength: (inputPrompt || "").length,
    });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      youLogger.warn("request.failure", {
        status: response.status,
        endpoint: "agents/runs",
      });
      throw new Error(`You.com Agent error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    youLogger.info("request.success", {
      endpoint: "agents/runs",
      keys: Object.keys(data || {}),
    });
    return data;
  } catch (error) {
    youLogger.error("request.error", error, { endpoint: "agents/runs" });
    throw error;
  }
}
