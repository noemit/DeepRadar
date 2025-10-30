import { initRequestLogger, attachRequestIdHeader } from "../../../lib/logger";

export async function GET(req) {
  const { requestId, end } = initRequestLogger(req, "api/test");
  return attachRequestIdHeader(
    new Response(
      JSON.stringify({
        message: "Test API route is working!",
        timestamp: new Date().toISOString(),
        env: {
          hasDeepInfraKey: !!process.env.DEEP_INFRA_API,
          nodeEnv: process.env.NODE_ENV,
          // Check Firebase env vars on server side
          firebase: {
            hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            apiKeyPrefix: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(
              0,
              10
            ),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          },
          allNextPublicKeys: Object.keys(process.env).filter((k) =>
            k.startsWith("NEXT_PUBLIC_")
          ),
          requestId,
          duration: end(200).durationMs,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    ),
    requestId
  );
}

export async function POST(req) {
  const { requestId } = initRequestLogger(req, "api/test");
  try {
    const body = await req.json();
    return attachRequestIdHeader(
      new Response(
        JSON.stringify({
          message: "Test POST route is working!",
          receivedData: body,
          timestamp: new Date().toISOString(),
          requestId,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      ),
      requestId
    );
  } catch (error) {
    return attachRequestIdHeader(
      new Response(
        JSON.stringify({
          error: "Failed to parse request body",
          details: error.message,
          requestId,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      ),
      requestId
    );
  }
}
