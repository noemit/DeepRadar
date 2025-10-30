import axios from "axios";
import { initRequestLogger, attachRequestIdHeader } from "../../../lib/logger";

export async function POST(req) {
  const { logger, end, requestId } = initRequestLogger(req, "api/deepinfra");
  const startTime = Date.now();
  try {
    const body = await req.json();
    const {
      prompt,
      systemPrompt = "You are a helpful AI assistant.",
      model = process.env.DEEP_INFRA_DEFAULT_MODEL ||
        "deepseek-ai/DeepSeek-V3.2-Exp",
    } = body;

    logger.info("request.start", {
      fields: Object.keys(body || {}),
      hasPrompt: !!prompt,
    });

    // Validate required fields
    if (!prompt) {
      logger.warn("validation.error", { reason: "missing prompt" });
      return attachRequestIdHeader(
        new Response(JSON.stringify({ error: "Prompt is required" }), {
          status: 400,
        }),
        requestId
      );
    }

    // Check for API key - try multiple environment variable names
    const API_KEY =
      process.env.DEEP_INFRA_API ||
      process.env.DEEP_INFRA_API_KEY ||
      process.env.NEXT_PUBLIC_DEEP_INFRA_API_KEY;

    logger.debug("config.apiKey", { present: !!API_KEY });

    if (!API_KEY) {
      logger.error("config.error", new Error("Missing DeepInfra API key"));
      return attachRequestIdHeader(
        new Response(
          JSON.stringify({
            error:
              "API key not configured. Please set DEEP_INFRA_API or DEEP_INFRA_API_KEY environment variable.",
            availableEnvVars: Object.keys(process.env).filter((key) =>
              key.includes("DEEP_INFRA")
            ),
            requestId,
          }),
          { status: 500 }
        ),
        requestId
      );
    }

    // Prepare messages for the AI model
    const messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    // Get configuration from environment variables
    const baseUrl =
      process.env.DEEP_INFRA_BASE_URL ||
      "https://api.deepinfra.com/v1/openai/chat/completions";
    const temperature = parseFloat(process.env.DEEP_INFRA_TEMPERATURE || "0.7");
    const maxTokens = parseInt(process.env.DEEP_INFRA_MAX_TOKENS || "1000", 10);

    logger.info("provider.request", { baseUrl, model, temperature, maxTokens });

    // Make request to DeepInfra
    const response = await axios.post(
      baseUrl,
      {
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    logger.info("provider.response", {
      status: response.status,
      hasContent: !!response.data?.choices?.[0]?.message?.content,
      ...end(200),
    });

    // Return the AI response
    return attachRequestIdHeader(
      new Response(
        JSON.stringify({
          content: response.data.choices[0].message.content,
          model: model,
          usage: response.data.usage,
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
    logger.error("request.error", error, {
      durationMs: Date.now() - startTime,
    });

    // Handle different types of errors
    if (error.response) {
      logger.warn("provider.errorResponse", { status: error.response.status });
      return attachRequestIdHeader(
        new Response(
          JSON.stringify({
            error: error.response.data?.error || "API request failed",
            status: error.response.status,
            details: error.response.data,
            requestId,
          }),
          { status: error.response.status || 500 }
        ),
        requestId
      );
    } else if (error.request) {
      logger.warn("provider.noResponse");
      return attachRequestIdHeader(
        new Response(
          JSON.stringify({
            error: "No response received from DeepInfra API",
            details: "Request was made but no response was received",
            requestId,
          }),
          { status: 503 }
        ),
        requestId
      );
    } else {
      logger.error("unexpected.error", error);
      return attachRequestIdHeader(
        new Response(
          JSON.stringify({
            error: "An unexpected error occurred",
            details: error.message,
            requestId,
          }),
          { status: 500 }
        ),
        requestId
      );
    }
  }
}
