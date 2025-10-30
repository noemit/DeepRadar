// Lightweight structured logger for server-side code (API routes and functions)
// Emits JSON logs for easy ingestion in platforms like Vercel, GCP, or CloudWatch

function toPlainError(error) {
  if (!error) return undefined;
  if (typeof error === "string") return { message: error };
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    code: error.code,
    status: error.status,
  };
}

function baseLog(level, message, context) {
  const logObject = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  // Use stdout for info/debug and stderr for warn/error
  const line = JSON.stringify(logObject);
  if (level === "warn" || level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export function createLogger(staticContext = {}) {
  return {
    info(message, context = {}) {
      baseLog("info", message, { ...staticContext, ...context });
    },
    warn(message, context = {}) {
      baseLog("warn", message, { ...staticContext, ...context });
    },
    error(message, error, context = {}) {
      baseLog("error", message, {
        ...staticContext,
        ...context,
        error: toPlainError(error),
      });
    },
    debug(message, context = {}) {
      baseLog("debug", message, { ...staticContext, ...context });
    },
  };
}

export function initRequestLogger(req, serviceName = "api") {
  const startTimeMs = Date.now();
  const url = req?.url || "";
  const method = req?.method || "";
  const headers = req?.headers || new Headers();
  const requestId =
    headers.get("x-request-id") ||
    (globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const ip =
    headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined;

  const context = {
    requestId,
    service: serviceName,
    method,
    url,
    ip,
    env: process.env.NODE_ENV,
  };

  const logger = createLogger(context);

  function end(status) {
    const durationMs = Date.now() - startTimeMs;
    return { durationMs, status };
  }

  return { logger, context, end, requestId };
}

export function attachRequestIdHeader(response, requestId) {
  try {
    const res =
      response instanceof Response
        ? response
        : new Response(response?.body, response);
    res.headers.set("x-request-id", requestId);
    return res;
  } catch (_) {
    return response;
  }
}
