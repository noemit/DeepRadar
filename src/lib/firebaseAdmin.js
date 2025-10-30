// Server-side Firebase Admin initialization and Firestore utilities
import admin from "firebase-admin";

// Initialize admin app once
if (!admin.apps.length) {
  // Prefer explicit service account via env, else fall back to ADC
  // Supports FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON) or
  // FIREBASE_SERVICE_ACCOUNT_KEY (raw JSON or base64-encoded JSON)
  const serviceAccountEnvName = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? "FIREBASE_SERVICE_ACCOUNT_JSON"
    : process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? "FIREBASE_SERVICE_ACCOUNT_KEY"
    : null;
  const serviceAccountRaw =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  // Try to resolve projectId from common env vars
  const resolvedProjectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    undefined;
  const logInit = (strategy) => {
    try {
      console.info(
        `[firebaseAdmin] initializeApp strategy=${strategy} projectId=${
          resolvedProjectId || "(auto)"
        }`
      );
    } catch {}
  };
  if (serviceAccountRaw) {
    try {
      // Parse raw JSON; if that fails, try base64 decode, then parse
      let creds;
      try {
        creds = JSON.parse(serviceAccountRaw);
      } catch (jsonErr) {
        const maybeDecoded = Buffer.from(serviceAccountRaw, "base64").toString(
          "utf8"
        );
        try {
          creds = JSON.parse(maybeDecoded);
        } catch (b64Err) {
          throw jsonErr;
        }
      }
      logInit("service_account_env");
      try {
        console.info(
          `[firebaseAdmin] using ${serviceAccountEnvName} with service account email=${
            creds.client_email || "(unknown)"
          }`
        );
      } catch {}
      admin.initializeApp({
        credential: admin.credential.cert(creds),
        projectId: resolvedProjectId || creds.project_id,
      });
    } catch (e) {
      console.error(
        `Invalid ${serviceAccountEnvName || "FIREBASE_SERVICE_ACCOUNT_JSON"}:`,
        e
      );
      logInit("adc_fallback_from_invalid_json");
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: resolvedProjectId,
      });
    }
  } else {
    logInit("adc_no_service_account");
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: resolvedProjectId,
    });
  }
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

export const createDocument = async (collectionPath, data) => {
  try {
    const ref = await db.collection(collectionPath).add({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: ref.id, ref };
  } catch (error) {
    console.error(
      `[firebaseAdmin] createDocument error collectionPath=${collectionPath}:`,
      error
    );
    return { success: false, error: error.message };
  }
};

export const getDocument = async (collectionPath, documentId) => {
  try {
    const ref = db.collection(collectionPath).doc(documentId);
    const snap = await ref.get();
    if (!snap.exists) {
      return { success: false, error: "Document not found" };
    }
    return { success: true, data: { id: snap.id, ...snap.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateDocument = async (collectionPath, documentId, data) => {
  try {
    const ref = db.collection(collectionPath).doc(documentId);
    await ref.update({
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error(
      `[firebaseAdmin] updateDocument error collectionPath=${collectionPath} documentId=${documentId}:`,
      error
    );
    return { success: false, error: error.message };
  }
};
