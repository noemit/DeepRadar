// Lightweight Firestore REST helper using service account JWT (no client libraries)
import crypto from "crypto";

const SCOPES = ["https://www.googleapis.com/auth/datastore"];

function readServiceAccount() {
  const envName = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? "FIREBASE_SERVICE_ACCOUNT_JSON"
    : process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? "FIREBASE_SERVICE_ACCOUNT_KEY"
    : null;
  const raw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "Service account not provided. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_KEY."
    );
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    // try base64
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    try {
      return JSON.parse(decoded);
    } catch (e2) {
      throw new Error(`Invalid ${envName}: cannot parse service account JSON`);
    }
  }
}

function getProjectId(sa) {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    sa.project_id ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT
  );
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: SCOPES.join(" "),
  };
  const header = { alg: "RS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(sa.private_key);
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    let msg = `token request failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    throw new Error(msg);
  }
  const json = await res.json();
  return json.access_token;
}

function encodeValue(value) {
  if (value === null) return { nullValue: null };
  switch (typeof value) {
    case "string":
      return { stringValue: value };
    case "number":
      // Firestore REST uses doubleValue for numbers
      return { doubleValue: value };
    case "boolean":
      return { booleanValue: value };
    case "object":
      if (Array.isArray(value)) {
        return { arrayValue: { values: value.map(encodeValue) } };
      }
      // map/object
      return { mapValue: { fields: encodeMap(value) } };
    default:
      return { stringValue: String(value) };
  }
}

function encodeMap(obj) {
  const fields = {};
  Object.keys(obj).forEach((k) => {
    const v = obj[k];
    if (v === undefined) return;
    fields[k] = encodeValue(v);
  });
  return fields;
}

export async function restCreateDocument(collectionPath, data) {
  const sa = readServiceAccount();
  const projectId = getProjectId(sa);
  if (!projectId) throw new Error("Missing projectId for Firestore REST");
  const token = await getAccessToken(sa);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encodeURIComponent(
    collectionPath
  )}`;
  const body = { fields: encodeMap(data) };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    return { success: false, error: json.error?.message || "create failed" };
  }
  const name = json.name || "";
  const id = name.substring(name.lastIndexOf("/") + 1);
  return { success: true, id, raw: json };
}

export async function restUpdateDocument(collectionPath, documentId, data) {
  const sa = readServiceAccount();
  const projectId = getProjectId(sa);
  if (!projectId) throw new Error("Missing projectId for Firestore REST");
  const token = await getAccessToken(sa);
  const docPath = `${collectionPath}/${documentId}`;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}?updateMask.fieldPaths=${Object.keys(
    data
  )
    .map((f) => encodeURIComponent(f))
    .join("&updateMask.fieldPaths=")}`;
  const body = { fields: encodeMap(data) };
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let err;
    try {
      const j = await res.json();
      err = j.error?.message;
    } catch {}
    return { success: false, error: err || "update failed" };
  }
  return { success: true };
}

export async function restGetDocument(collectionPath, documentId) {
  const sa = readServiceAccount();
  const projectId = getProjectId(sa);
  if (!projectId) throw new Error("Missing projectId for Firestore REST");
  const token = await getAccessToken(sa);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}/${documentId}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) {
    return { success: false, error: json.error?.message || "not found" };
  }
  return { success: true, data: json };
}
