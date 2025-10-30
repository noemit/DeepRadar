// src/app/api/extract-pdf/route.js

import { NextResponse } from "next/server";
import { initRequestLogger, attachRequestIdHeader } from "../../../lib/logger";
import pdfParse from "pdf-parse";

const MAX_FILE_SIZE = parseInt(process.env.PDF_MAX_FILE_SIZE || "10485760", 10); // Default: 10MB (10 * 1024 * 1024)

export async function POST(req) {
  const { logger, end, requestId } = initRequestLogger(req, "api/extract-pdf");
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      logger.warn("validation.error", { reason: "no file" });
      return attachRequestIdHeader(
        NextResponse.json(
          { error: "No file provided", requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    // Validate file type
    if (!file.type.includes("pdf")) {
      logger.warn("validation.error", {
        reason: "wrong mime",
        type: file.type,
      });
      return attachRequestIdHeader(
        NextResponse.json(
          { error: "Only PDF files are supported", requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    // Validate file size
    const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
    if (file.size > MAX_FILE_SIZE) {
      logger.warn("validation.error", {
        reason: "size",
        size: file.size,
        max: MAX_FILE_SIZE,
      });
      return attachRequestIdHeader(
        NextResponse.json(
          { error: `File size exceeds ${maxSizeMB}MB limit`, requestId },
          { status: 400 }
        ),
        requestId
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const data = await pdfParse(buffer);

      if (!data || !data.text) {
        logger.warn("parse.error", { reason: "no text" });
        return attachRequestIdHeader(
          NextResponse.json(
            { error: "Could not extract text from PDF", requestId },
            { status: 400 }
          ),
          requestId
        );
      }

      logger.info("request.success", { ...end(200) });
      return attachRequestIdHeader(
        NextResponse.json({ text: data.text, requestId }),
        requestId
      );
    } catch (parseError) {
      logger.error("parse.error", parseError, {
        hint: "PDF may be corrupted or password-protected",
      });
      return attachRequestIdHeader(
        NextResponse.json(
          {
            error:
              "Failed to parse PDF. The file might be corrupted or password-protected.",
            requestId,
          },
          { status: 400 }
        ),
        requestId
      );
    }
  } catch (error) {
    logger.error("request.error", error, end(500));
    return attachRequestIdHeader(
      NextResponse.json(
        {
          error: "An error occurred while processing the PDF file",
          requestId,
        },
        { status: 500 }
      ),
      requestId
    );
  }
}
