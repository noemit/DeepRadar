"use client";
import React from "react";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

/**
 * ReportView - Renders a synthesized report
 * @param {Object} props
 * @param {Object} props.report - Report data
 * @param {Function} [props.onShare] - Callback when sharing an item
 */
export default function ReportView({ report, onShare, onItemHover, onItemLeave }) {
  const [openDebugIndex, setOpenDebugIndex] = React.useState(null);

  // Support both v1 (sections) and v2 (items) formats
  const isV2Format = report?.version === "v2" && Array.isArray(report.items);
  const isV1Format = Array.isArray(report?.sections);

  if (!report || (!isV1Format && !isV2Format)) {
    return (
      <div className="card-sleek text-stone-200">No report data available</div>
    );
  }

  const handleCopyLink = async (url) => {
    try {
      if (url) await navigator.clipboard.writeText(url);
    } catch (e) {
      // no-op
    }
  };

  return (
    <>
      <div className="card-sleek">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-gradient mb-1">
            DeepRadar Report
          </h2>
          {report.freshnessWindow && (
            <p className="text-sm text-stone-200">
              {new Date(report.freshnessWindow.toISO).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Summary */}
        {report.summary && (
          <div className="mb-5 p-compact bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-lg border border-cyan-500/30">
            <h3 className="text-base font-semibold text-stone-200 mb-1.5">
              TL;DR
            </h3>
            <p className="text-stone-200 text-sm">{report.summary}</p>
          </div>
        )}

        {/* V2 Format: Simple bullet point list */}
        {isV2Format && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-stone-200 mb-3">
              Search Results
            </h3>
            <ul className="space-y-3 list-none">
              {report.items.map((item, itemIdx) => {
                const ts = item.date ? new Date(item.date).getTime() : 0;
                const isValidTs = !isNaN(ts) && ts > 0;
                const isFresh =
                  isValidTs && Date.now() - ts < 24 * 60 * 60 * 1000;
                return (
                  <li
                    key={itemIdx}
                    className={`${
                      isFresh
                        ? "border-yellow-300 bg-yellow-500/10"
                        : "border-gray-700/50 bg-gray-800/30"
                    } rounded-lg p-compact hover:border-gray-600/60 transition-all`}
                    onMouseEnter={() => onItemHover && onItemHover(item)}
                    onMouseLeave={() => onItemLeave && onItemLeave(item)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-stone-200 mb-1">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          {item.source && (
                            <span className="text-xs text-stone-300">
                              {item.source}
                            </span>
                          )}
                          {isValidTs && (
                            <span
                              className={`${
                                isFresh
                                  ? "text-yellow-300 bg-yellow-500/20 border-yellow-300/50"
                                  : "text-stone-300 bg-gray-700/30 border-gray-600/40"
                              } text-[10px] px-2 py-0.5 rounded border`}
                            >
                              {new Date(ts).toLocaleString()}
                            </span>
                          )}
                          {isFresh && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400 text-black font-semibold uppercase tracking-wide">
                              New
                            </span>
                          )}
                        </div>
                        {item.snippet && (
                          <p className="text-sm text-stone-200 mb-2">
                            {item.snippet}
                          </p>
                        )}
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-accent-blue hover:text-accent-cyan text-sm transition-colors"
                          >
                            Read more
                            <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleCopyLink(item.url)}
                        className="px-3 py-1.5 text-xs font-medium text-accent-blue hover:text-accent-cyan border border-accent-blue/30 rounded-lg hover:bg-accent-blue/10 transition-all whitespace-nowrap"
                      >
                        Copy link
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* V1 Format: Sections */}
        {isV1Format &&
          report.sections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="mb-6">
              <h3 className="text-xl font-semibold text-stone-200 mb-3">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.items?.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="border border-gray-700/50 bg-gray-800/30 rounded-lg p-compact hover:border-gray-600/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.headline}
                              className="w-16 h-16 object-cover rounded border border-gray-700/50"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-stone-200 mb-1">
                              {item.headline}
                            </h4>
                            <p className="text-xs text-stone-200 mb-1.5">
                              {item.source}
                            </p>
                            <p className="text-sm text-stone-200 mb-2">
                              {item.snippet}
                            </p>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {item.tags.map((tag, tagIdx) => (
                                  <span
                                    key={tagIdx}
                                    className="px-2 py-0.5 bg-gray-700/50 text-stone-200 text-xs rounded-full border border-gray-600/50"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-accent-blue hover:text-accent-cyan text-sm transition-colors"
                              >
                                Read more
                                <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyLink(item.url)}
                        className="px-3 py-1.5 text-xs font-medium text-accent-blue hover:text-accent-cyan border border-accent-blue/30 rounded-lg hover:bg-accent-blue/10 transition-all whitespace-nowrap"
                      >
                        Copy link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* Metrics */}
        {(report.metrics?.totalSources !== undefined ||
          (isV2Format && report.resultCount !== undefined)) && (
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <p className="text-xs text-stone-200">
              {isV2Format ? (
                <>
                  <strong className="text-stone-200">
                    {report.resultCount || 0}
                  </strong>{" "}
                  results from{" "}
                  <strong className="text-stone-200">
                    {report.queryCount || 0}
                  </strong>{" "}
                  queries
                </>
              ) : (
                <>
                  <strong className="text-stone-200">
                    {report.metrics?.totalSources || 0}
                  </strong>{" "}
                  sources from{" "}
                  <strong className="text-stone-200">
                    {report.metrics?.uniqueDomains || 0}
                  </strong>{" "}
                  unique domains
                </>
              )}
            </p>

            {/* Debug accordion when zero results */}
            {!isV2Format &&
              report.metrics?.totalSources === 0 &&
              report.metrics?.uniqueDomains === 0 &&
              Array.isArray(report.debug?.youcomResponses) &&
              report.debug.youcomResponses.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-stone-200 mb-2">
                    You.com responses
                  </h4>
                  <div className="space-y-2">
                    {report.debug.youcomResponses.map((entry, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-700/50 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setOpenDebugIndex(
                              openDebugIndex === idx ? null : idx
                            )
                          }
                          className="w-full text-left px-3 py-2 bg-gray-800/40 hover:bg-gray-800/60 flex items-center justify-between"
                        >
                          <span className="text-xs text-stone-200 truncate">
                            {entry.ok ? "OK" : "ERROR"} · {entry.query}
                          </span>
                          <span className="text-xs text-stone-400 ml-2 whitespace-nowrap">
                            {entry.ok
                              ? `${entry.count || 0} items`
                              : entry.error}
                          </span>
                        </button>
                        {openDebugIndex === idx && (
                          <div className="px-3 py-2 bg-gray-900/40">
                            <pre className="text-[11px] leading-snug text-stone-200 whitespace-pre-wrap break-words">
                              {JSON.stringify(entry.raw ?? entry, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* V2: Show brief You.com debug when zero results */}
            {isV2Format &&
              (report.resultCount === 0 || (report.items || []).length === 0) &&
              report.debug?.youcom && (
                <div className="mt-3">
                  <h4 className="text-sm font-semibold text-stone-200 mb-2">
                    Debug · You.com Agent
                  </h4>
                  <div className="text-[12px] text-stone-200 space-y-1">
                    <div>itemsParsed: {report.debug.youcom.itemsParsed}</div>
                    <div>
                      contentLength: {report.debug.youcom.contentLength}
                    </div>
                    <div>
                      responseKeys:{" "}
                      {Array.isArray(report.debug.youcom.responseKeys)
                        ? report.debug.youcom.responseKeys.join(", ")
                        : ""}
                    </div>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-stone-300">
                        Prompt preview
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-900/40 border border-gray-700/50 rounded text-[11px] whitespace-pre-wrap break-words">
                        {report.debug.youcom.promptPreview}
                      </pre>
                    </details>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-stone-300">
                        Content preview
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-900/40 border border-gray-700/50 rounded text-[11px] whitespace-pre-wrap break-words">
                        {report.debug.youcom.contentPreview}
                      </pre>
                    </details>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      {/* no share modal */}
    </>
  );
}
