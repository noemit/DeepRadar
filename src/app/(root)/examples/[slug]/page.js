"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import { getExampleBySlug } from "../../../../lib/data/exampleRadars";
import { createDocument, getDocuments } from "../../../../lib/firebase";
import { createDefaultRadarSettings } from "../../../../lib/firestore/schemas";
import RadarCanvas from "../../../../components/radar/RadarCanvas";
import PlanPreview from "../../../../components/radar/PlanPreview";
import RunReportButton from "../../../../components/report/RunReportButton";
import ReportView from "../../../../components/report/ReportView";
import {
  DocumentDuplicateIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function ExampleRadarView({ params: routeParams }) {
  const router = useRouter();
  const { user } = useAuth();
  const slug = routeParams?.slug;
  const example = getExampleBySlug(slug);
  const [forking, setForking] = useState(false);
  const [report, setReport] = useState(null);
  const [radarId, setRadarId] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  if (!example) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-300 mb-4">Example not found</p>
          <button
            onClick={() => router.push("/examples")}
            className="text-green-300 hover:text-green-400 transition-colors inline-flex items-center"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Examples
          </button>
        </div>
      </div>
    );
  }

  const handleFork = async () => {
    if (!user) {
      router.push("/");
      return;
    }

    setForking(true);
    try {
      // Check if user already has a radar and confirm overwrite intent
      const existing = await getDocuments("radars", [
        { type: "where", field: "ownerId", operator: "==", value: user.uid },
        { type: "orderBy", field: "updatedAt", direction: "desc" },
        { type: "limit", value: 1 },
      ]);
      if (existing?.success && existing?.data?.length > 0) {
        const confirmed = window.confirm(
          "This will overwrite your current radar (only the newest will show). Are you sure?"
        );
        if (!confirmed) {
          setForking(false);
          return;
        }
      }
      const radarData = {
        ownerId: user.uid,
        title: `${example.title} (Forked)`,
        profile: example.profile,
        mermaidDiagram: example.mermaidDiagram,
        queryPlan: example.queryPlan,
        settings: createDefaultRadarSettings(),
      };

      const result = await createDocument("radars", radarData);

      if (result.success) {
        setRadarId(result.id);
        // Navigate to the forked radar
        router.push(`/radar/${result.id}`);
      } else {
        throw new Error(result.error || "Failed to fork radar");
      }
    } catch (error) {
      console.error("Error forking radar:", error);
      setGenError(error.message || "Failed to fork radar");
    } finally {
      setForking(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!user) {
      // Allow unauthenticated users to trigger report generation
      // This would typically create a temporary radar or use the example directly
      setGenError("Please sign in to generate reports");
      return;
    }

    // If not forked yet, fork first
    if (!radarId) {
      await handleFork();
      return;
    }

    // Generate report
    try {
      setGenError("");
      setGenLoading(true);
      const response = await fetch(`/api/radars/${radarId}/run/v2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      setReport(data.report);
    } catch (error) {
      console.error("Error generating report:", error);
      setGenError(error.message || "Failed to generate report");
    } finally {
      setGenLoading(false);
    }
  };

  // Check if report exists and is fresh (< 24h old)
  // For examples, we'd typically check a shared report cache
  const canRefreshReport = true; // Simplified - would check actual report age

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/examples")}
            className="text-green-300 hover:text-green-400 mb-4 inline-flex items-center transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Examples
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-stone-200 mb-2">
                {example.title}
              </h1>
              <p className="text-stone-200">{example.description}</p>
            </div>
            {user && (
              <button
                onClick={handleFork}
                disabled={forking || !!radarId}
                className="btn-gradient inline-flex items-center px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                {forking
                  ? "Forking..."
                  : radarId
                  ? "Forked ✓"
                  : "Fork This Radar"}
              </button>
            )}
          </div>
        </div>

        {/* Radar Canvas */}
        {example.mermaidDiagram && (
          <div className="mb-6">
            <RadarCanvas mermaidDiagram={example.mermaidDiagram} />
          </div>
        )}

        {/* Query Plan */}
        {example.queryPlan && (
          <div className="mb-6">
            <PlanPreview queryPlan={example.queryPlan} />
          </div>
        )}

        {/* Report Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-stone-200">Report</h2>
            {radarId && (
              <RunReportButton
                radarId={radarId}
                latestReport={report}
                onReportGenerated={setReport}
              />
            )}
            {!radarId && user && canRefreshReport && (
              <button
                onClick={handleGenerateReport}
                disabled={genLoading}
                className="btn-gradient inline-flex items-center px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {genLoading ? "Generating Report..." : "Generate Report"}
              </button>
            )}
          </div>

          {genError && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
              {genError}
            </div>
          )}

          {report ? (
            <ReportView report={report} />
          ) : (
            <div className="card-sleek text-center py-8">
              <p className="text-stone-200">
                {user
                  ? "Fork this radar to generate a report, or sign in to create your own."
                  : "Sign in to fork this radar and generate reports"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
