"use client";
import React, { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

/**
 * PlanPreview - Displays query plan as chips with expandable JSON
 * @param {Object} props
 * @param {Object} props.queryPlan - Query plan object
 */
export default function PlanPreview({ queryPlan, mermaidDiagram }) {
  const [expanded, setExpanded] = useState(false);

  // Accept both object and JSON string
  let plan = queryPlan;
  if (typeof plan === "string") {
    try {
      plan = JSON.parse(plan);
    } catch {
      // keep as-is if not parseable
    }
  }

  if (!plan) {
    return (
      <div className="card-sleek text-stone-200">No query plan available</div>
    );
  }

  // Parse topics from optional mermaid diagram to categorize by priority/relevance
  const parseTopics = (diagram) => {
    if (!diagram || typeof diagram !== "string") return [];
    const lines = diagram.split(/\n+/);
    const topicRegex = /^(.*?)\s*:\s*\[(\d*\.?\d+),\s*(\d*\.?\d+)\]\s*$/;
    const out = [];
    for (const raw of lines) {
      const line = raw.trim();
      const m = line.match(topicRegex);
      if (m) {
        const label = m[1].trim();
        const x = parseFloat(m[2]);
        const y = parseFloat(m[3]);
        if (!Number.isNaN(x) && !Number.isNaN(y)) out.push({ label, x, y });
      }
    }
    return out;
  };

  const topics = parseTopics(mermaidDiagram);
  const highPriorityTopics = topics.filter((t) => t.y >= 0.5);
  const lowPriorityTopics = topics.filter((t) => t.y < 0.5);

  // Get queries to display
  const queries =
    Array.isArray(plan.finalQueries) && plan.finalQueries.length > 0
      ? plan.finalQueries
      : Array.isArray(plan.queries)
      ? plan.queries
      : [];

  return (
    <div className="card-sleek">
      <h3 className="text-lg font-semibold text-stone-200 mb-4">
        Search Plan Preview
      </h3>

      {/* Priority Categories (derived from Mermaid) */}
      {topics.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-stone-200 mb-2">
            Priority Categories
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-stone-300 mb-1">High Priority</div>
              <ul className="list-disc list-inside space-y-1 text-stone-200">
                {highPriorityTopics.length === 0 && (
                  <li className="opacity-60">None</li>
                )}
                {highPriorityTopics.map((t, idx) => (
                  <li key={`hp-${idx}`}>{t.label}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs text-stone-300 mb-1">Low Priority</div>
              <ul className="list-disc list-inside space-y-1 text-stone-200">
                {lowPriorityTopics.length === 0 && (
                  <li className="opacity-60">None</li>
                )}
                {lowPriorityTopics.map((t, idx) => (
                  <li key={`lp-${idx}`}>{t.label}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Search Queries */}
      {queries.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-stone-200 mb-2">
            Search Queries ({queries.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {queries.map((query, idx) => (
              <span
                key={`query-${idx}`}
                className="px-2 py-1 bg-gray-700/50 rounded text-sm text-stone-200 border border-gray-600/50"
              >
                {query}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Preferred Sources */}
      {Array.isArray(plan.sourcesHint) && plan.sourcesHint.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-stone-200 mb-2">
            Preferred Sources
          </h4>
          <ul className="list-disc list-inside space-y-1 text-stone-200">
            {plan.sourcesHint.map((source, idx) => (
              <li key={idx}>{source}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Expandable JSON */}
      <div className="mt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center text-sm text-stone-200 hover:text-accent-green transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUpIcon className="w-4 h-4 mr-1" />
              Hide Full JSON
            </>
          ) : (
            <>
              <ChevronDownIcon className="w-4 h-4 mr-1" />
              Show Full JSON
            </>
          )}
        </button>
        {expanded && (
          <pre className="mt-2 p-4 bg-gray-800/50 rounded-lg text-xs overflow-auto text-stone-200 border border-gray-700/50">
            {JSON.stringify(plan, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
