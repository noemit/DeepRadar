"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import RadarCanvas from "../../../../components/radar/RadarCanvas";
import ChatRefine from "../../../../components/radar/ChatRefine";
import PlanPreview from "../../../../components/radar/PlanPreview";
import ReportView from "../../../../components/report/ReportView";
import RunReportButton from "../../../../components/report/RunReportButton";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function RadarView({ params: routeParams }) {
  const router = useRouter();
  const { user } = useAuth();
  const radarId = routeParams?.radarId;
  const [radar, setRadar] = useState(null);
  const [radarLoading, setRadarLoading] = useState(true);
  const [radarError, setRadarError] = useState("");

  // Note: useCollection might not work with subcollections directly
  // We'll fetch reports manually or improve the hook
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    if (!radarId) return;

    const loadRadar = async () => {
      setRadarLoading(true);
      setRadarError("");
      try {
        const res = await fetch(`/api/radars/${radarId}`);
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Failed to load radar");
        }
        setRadar(data.radar);
      } catch (err) {
        console.error("Error loading radar:", err);
        setRadarError(err.message || "Failed to load radar");
      } finally {
        setRadarLoading(false);
      }
    };

    const fetchReports = async () => {
      setReportsLoading(true);
      try {
        const res = await fetch(`/api/radars/${radarId}/reports/latest`);
        const data = await res.json();
        if (res.ok && data?.success && data.report) {
          setReports([data.report]);
        } else {
          setReports([]);
        }
      } catch (_e) {
        setReports([]);
      } finally {
        setReportsLoading(false);
      }
    };

    loadRadar();
    fetchReports();
  }, [radarId]);

  const [refinementLoading, setRefinementLoading] = useState(false);
  const [refinementError, setRefinementError] = useState("");
  const [currentReport, setCurrentReport] = useState(null);
  const [diffMermaid, setDiffMermaid] = useState(null);
  const [autoRequestedReport, setAutoRequestedReport] = useState(false);
  const [highlightQuery, setHighlightQuery] = useState("");

  useEffect(() => {
    if (reports && reports.length > 0) {
      const latest = reports[0];
      // Convert Firestore timestamp if needed
      if (latest.createdAt && latest.createdAt.toMillis) {
        latest.createdAt = {
          toMillis: () => latest.createdAt.toMillis(),
        };
      }
      setCurrentReport(latest);
    }
  }, [reports]);

  // If no existing report, optionally request a new one once radar is loaded
  useEffect(() => {
    if (!radarId || !radar || autoRequestedReport) return;
    const run = async () => {
      try {
        setAutoRequestedReport(true);
        if (!currentReport) {
          const res = await fetch(`/api/radars/${radarId}/run/v2`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          const data = await res.json();
          if (res.ok && data?.report) {
            setCurrentReport(data.report);
          }
        }
      } catch (_e) {
        // best-effort; user can still click run manually
      }
    };
    run();
  }, [radarId, radar, autoRequestedReport, currentReport]);

  const handleRefine = async (message) => {
    setRefinementLoading(true);
    setRefinementError("");

    try {
      const response = await fetch(`/api/radars/${radarId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refinementMessage: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to refine radar");
      }

      // Show diff for visual comparison
      if (data.previousMermaidDiagram) {
        setDiffMermaid(data.previousMermaidDiagram);
        // Auto-accept after 3 seconds or manual accept
        setTimeout(() => {
          setDiffMermaid(null);
        }, 3000);
      }

      // Refresh radar
      window.location.reload();
    } catch (err) {
      console.error("Error refining radar:", err);
      setRefinementError(err.message);
    } finally {
      setRefinementLoading(false);
    }
  };

  const handleReportGenerated = (report) => {
    setCurrentReport(report);
  };
  const handleItemHover = (item) => {
    const q = (item?.title || item?.source || "").slice(0, 80);
    setHighlightQuery(q);
  };
  const handleItemLeave = () => {
    setHighlightQuery("");
  };

  if (radarLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (radarError || !radar) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{radarError || "Radar not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-green-300 hover:text-green-400 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-green-300 hover:text-green-400 mb-4 inline-flex items-center transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-stone-100 mb-2">
            {radar.title || "Untitled Radar"}
          </h1>
          <p className="text-stone-200">
            {radar.profile?.industry} • {radar.profile?.role}
          </p>
        </div>

        {/* Chat Refine */}
        <div className="mb-8">
          {refinementError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {refinementError}
            </div>
          )}
          <ChatRefine onRefine={handleRefine} loading={refinementLoading} />
        </div>

        {/* Side-by-side: Radar (left) and Report (right) */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Radar + Plan */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Radar</h2>
            </div>
            {radar.mermaidDiagram && (
              <div className="mb-6">
                {diffMermaid && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Showing diff. Green = new, Red = old. Changes will be
                      applied automatically.
                    </p>
                  </div>
                )}
                <RadarCanvas
                  mermaidDiagram={radar.mermaidDiagram}
                  previousMermaidDiagram={diffMermaid}
                  highlightQuery={highlightQuery}
                />
              </div>
            )}
            {radar.queryPlan && (
              <PlanPreview
                queryPlan={radar.queryPlan}
                mermaidDiagram={radar.mermaidDiagram}
              />
            )}
          </div>

          {/* Right: Report */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Report</h2>
              <RunReportButton
                radarId={radarId}
                latestReport={currentReport}
                onReportGenerated={handleReportGenerated}
              />
            </div>
            {currentReport ? (
              <ReportView
                report={{ ...currentReport, radarId }}
                reportId={currentReport.id}
                onItemHover={handleItemHover}
                onItemLeave={handleItemLeave}
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">
                  No report generated yet. Click "Generate Report" to create
                  one.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
