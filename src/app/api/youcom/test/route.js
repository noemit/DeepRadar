import { searchYouCom } from "../../../../lib/services/youcom";
import {
  initRequestLogger,
  attachRequestIdHeader,
} from "../../../../lib/logger";

export async function GET(req) {
  const { requestId, end } = initRequestLogger(req, "api/youcom/test");
  try {
    const hasKey = !!process.env.YOU_DOT_COM;
    if (!hasKey) {
      const res = new Response(
        JSON.stringify({
          ok: false,
          error: "YOU_DOT_COM API key not configured",
          env: { hasYouKey: false },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
      return attachRequestIdHeader(res, requestId);
    }

    // Minimal query to validate connectivity
    const data = await searchYouCom("test");
    const resultSummary = {
      ok: true,
      count: Array.isArray(data?.results) ? data.results.length : undefined,
      keys: Object.keys(data || {}),
      durationMs: end(200).durationMs,
    };

    const res = new Response(JSON.stringify(resultSummary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    return attachRequestIdHeader(res, requestId);
  } catch (error) {
    const res = new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
    return attachRequestIdHeader(res, requestId);
  }
}
