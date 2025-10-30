import { NextResponse } from "next/server";
import admin from "firebase-admin";
import {
  initRequestLogger,
  attachRequestIdHeader,
} from "../../../../../../lib/logger";

export async function GET(req, { params }) {
  const { logger, end, requestId } = initRequestLogger(
    req,
    "api/radars/reports/latest"
  );
  try {
    const { radarId } = params;
    if (!radarId) {
      return attachRequestIdHeader(
        NextResponse.json(
          { error: "Missing radarId", requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const db = admin.firestore();
    const snap = await db
      .collection(`radars/${radarId}/reports`)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      logger.info("reports.none", { radarId, ...end(200) });
      return attachRequestIdHeader(
        NextResponse.json({ success: true, report: null, requestId }),
        requestId
      );
    }

    const doc = snap.docs[0];
    const report = { id: doc.id, ...doc.data() };
    logger.info("reports.latest", { radarId, reportId: doc.id, ...end(200) });
    return attachRequestIdHeader(
      NextResponse.json({ success: true, report, requestId }),
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
