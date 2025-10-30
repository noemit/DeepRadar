"use client";
import React, { useState } from "react";
import {
  XMarkIcon,
  ClipboardIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";

/**
 * ShareBlipModal - Modal for generating and sharing report item snippets
 * @param {Object} props
 * @param {boolean} props.open
 * @param {Function} props.onClose
 * @param {Object} props.item
 * @param {string} props.reportId
 * @param {string} props.itemIndex
 * @param {string} [props.radarId]
 */
export default function ShareBlipModal({
  open,
  onClose,
  item,
  reportId,
  itemIndex,
  radarId,
}) {
  const { user } = useAuth();
  const [snippet, setSnippet] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (open && item && !snippet) {
      generateSnippet();
    } else if (!open) {
      setSnippet("");
      setCopied(false);
    }
  }, [open, item]);

  const generateSnippet = async () => {
    if (!item || !reportId) return;

    setLoading(true);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          itemIndex,
          radarId,
          userId: user?.uid || null,
          item,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate snippet");
      }

      setSnippet(data.text);
    } catch (err) {
      console.error("Error generating snippet:", err);
      setSnippet("Error generating share snippet");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSlackShare = () => {
    const text = encodeURIComponent(snippet);
    const slackUrl = `https://slack.com/intent/tweet?text=${text}`;
    window.open(slackUrl, "_blank");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Share Snippet</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {item && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">{item.headline}</h4>
            <p className="text-sm text-gray-600">{item.source}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              placeholder="Generating share snippet..."
            />

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-stone-200 bg-blue-600 hover:bg-blue-700"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-5 h-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardIcon className="w-5 h-5 mr-2" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleSlackShare}
                className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Share to Slack
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
