"use client";
import React, { useState } from "react";
import { PlayIcon } from "@heroicons/react/24/outline";
import { Button } from "../../components/HeroUIComponents";

/**
 * RunReportButton - Button to trigger report generation with caching logic
 * @param {Object} props
 * @param {string} props.radarId
 * @param {Object} [props.latestReport] - Latest report if exists
 * @param {Function} props.onReportGenerated - Callback with new report
 */
export default function RunReportButton({
  radarId,
  latestReport,
  onReportGenerated,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Robustly convert createdAt to milliseconds regardless of shape
  const getCreatedAtMs = (createdAt) => {
    if (!createdAt) return null;
    if (typeof createdAt?.toMillis === "function") return createdAt.toMillis();
    if (typeof createdAt === "number") return createdAt; // assume ms
    if (typeof createdAt === "string") {
      const t = Date.parse(createdAt);
      return isNaN(t) ? null : t;
    }
    if (typeof createdAt === "object") {
      // Firestore Timestamp-like object
      if (typeof createdAt.seconds === "number") {
        const nanos =
          typeof createdAt.nanoseconds === "number" ? createdAt.nanoseconds : 0;
        return createdAt.seconds * 1000 + Math.floor(nanos / 1e6);
      }
    }
    return null;
  };

  const createdAtMs = getCreatedAtMs(latestReport?.createdAt);

  // Check if report is fresh (within 24 hours)
  const isReportFresh = createdAtMs
    ? Date.now() - createdAtMs < 24 * 60 * 60 * 1000
    : false;

  const handleRun = async (freshRun = false) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/radars/${radarId}/run/v2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      if (onReportGenerated) {
        onReportGenerated(data.report);
      }
    } catch (err) {
      console.error("Error generating report:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (isReportFresh && !latestReport) {
      // Offer choice: use cached or fresh
      if (
        confirm(
          "You have a recent report (less than 24 hours old). Generate a fresh one anyway?"
        )
      ) {
        handleRun(true);
      } else {
        // Use cached - this would need to be handled by parent
        if (onReportGenerated && latestReport) {
          onReportGenerated(latestReport);
        }
      }
    } else {
      handleRun();
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={loading} className="w-full">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Generating Report...
          </>
        ) : (
          <>
            <PlayIcon className="w-5 h-5 mr-2" />
            {isReportFresh ? "Refresh Report" : "Generate Report"}
          </>
        )}
      </Button>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}
      {isReportFresh && latestReport && (
        <p className="text-sm text-gray-600">
          Last generated: {new Date(createdAtMs || Date.now()).toLocaleString()}
        </p>
      )}
    </div>
  );
}
