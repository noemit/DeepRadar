"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import ProfileForm from "../../../../components/radar/ProfileForm";
import {
  createDefaultRadarSettings,
  createDefaultQueryPlan,
} from "../../../../lib/firestore/schemas";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useCollection } from "../../../../hooks/useFirestore";

export default function CreateRadar() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [prefillData, setPrefillData] = useState(null);
  const constraints = useMemo(
    () =>
      user
        ? [
            {
              type: "where",
              field: "ownerId",
              operator: "==",
              value: user.uid,
            },
            { type: "orderBy", field: "updatedAt", direction: "desc" },
            { type: "limit", value: 1 },
          ]
        : [],
    [user?.uid]
  );
  const { data: existingNewest } = useCollection(
    "radars",
    constraints,
    false,
    !!user && !authLoading
  );

  const handleSubmit = async (profileData) => {
    if (!user) {
      setError("You must be logged in to create a radar");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (existingNewest && existingNewest.length > 0) {
        const confirmed = window.confirm(
          "You already have a radar. Starting over will create a new one and only the newest radar will show. Continue?"
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }
      // Single server-side API call: create + generate
      const response = await fetch("/api/radars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user.uid,
          title: `${profileData.industry} - ${profileData.role}`,
          profile: profileData,
        }),
      });

      const apiData = await response.json();

      if (!response.ok || !apiData?.success) {
        throw new Error(apiData.error || "Failed to create radar");
      }

      // Navigate to radar view
      router.push(`/radar/${apiData.radarId}`);
    } catch (err) {
      console.error("Error creating radar:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="card-sleek card-hover p-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-green-300 hover:text-green-400 mb-4 inline-flex items-center transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-stone-200 mb-2">
            Create Your Radar
          </h1>
          <p className="text-stone-200 mb-6">
            Describe what you do and let AI prefill your profile. Review and
            edit before generating your radar.
          </p>

          {error && (
            <div className="mb-6 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}
          {/* AI-assisted prefill */}
          <div className="mb-8 space-y-3">
            <label className="block text-sm font-medium text-stone-200">
              Describe what you do
            </label>
            <textarea
              className="w-full rounded-md bg-stone-900/60 border border-stone-700 p-3 text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-accent-blue/60"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={aiLoading}
              placeholder="e.g., I'm a PM at a mid-size EdTech company building interactive math content for US high schools. I'm focused on curriculum alignment, teacher workflows, and student engagement."
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (!description.trim() || aiLoading) return;
                  setError("");
                  setAiLoading(true);
                  try {
                    const systemPrompt =
                      "You convert a short free-text job/role description into strict XML with this exact structure and tag names. Use multiple <item> tags for lists. Return ONLY raw XML, no code fences, no commentary. Example structure: <profile><role>...</role><industry>...</industry><productFocus>optional</productFocus><audience>...</audience><geography><item>USA</item><item>Canada</item></geography><priorities><item>Curriculum alignment</item></priorities><avoid><item>Crypto</item></avoid></profile>";
                    const userPrompt = `Generate profile XML from this description: ${description}`;
                    const res = await fetch("/api/deepinfra", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        prompt: userPrompt,
                        systemPrompt,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(
                        data?.error || "Failed to generate profile"
                      );
                    }
                    let content = data?.content || "";
                    // Strip code fences if present
                    content = content
                      .replace(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/m, "$1")
                      .trim();

                    // Helper to extract a single tag's text content
                    const extractTag = (xml, tag) => {
                      const regex = new RegExp(
                        `<${tag}>([\\s\\S]*?)<\\/${tag}>`,
                        "i"
                      );
                      const match = xml.match(regex);
                      return match ? match[1].trim() : "";
                    };

                    // Helper to extract list of <item> within a parent tag
                    const extractList = (xml, parentTag) => {
                      const parentRegex = new RegExp(
                        `<${parentTag}>([\\s\\S]*?)<\\/${parentTag}>`,
                        "i"
                      );
                      const parentMatch = xml.match(parentRegex);
                      if (!parentMatch) return [];
                      const inner = parentMatch[1];
                      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
                      const items = [];
                      let m;
                      while ((m = itemRegex.exec(inner)) !== null) {
                        const val = (m[1] || "").trim();
                        if (val) items.push(val);
                      }
                      if (items.length) return items;
                      // Fallback: split plain text by commas
                      const plain = inner.replace(/<[^>]+>/g, "").trim();
                      if (!plain) return [];
                      return plain
                        .split(/,|\n|;|\|/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                    };

                    // Build profile object from XML
                    const parsed = {
                      role: extractTag(content, "role"),
                      industry: extractTag(content, "industry"),
                      productFocus: extractTag(content, "productFocus"),
                      audience: extractTag(content, "audience"),
                      geography: extractList(content, "geography"),
                      priorities: extractList(content, "priorities"),
                      avoid: extractList(content, "avoid"),
                    };

                    if (
                      !parsed.role ||
                      !parsed.industry ||
                      !parsed.audience ||
                      parsed.priorities.length === 0
                    ) {
                      throw new Error("AI returned incomplete profile XML");
                    }

                    setPrefillData(parsed);
                  } catch (err) {
                    console.error(err);
                    setError(err.message || "Error generating profile");
                  } finally {
                    setAiLoading(false);
                  }
                }}
                className={`btn-gradient px-4 py-2 text-sm inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
                  aiLoading ? "opacity-80 cursor-not-allowed" : ""
                }`}
                disabled={aiLoading}
              >
                {aiLoading ? "Filling with AI…" : "Fill with AI"}
              </button>
              {aiLoading && (
                <div className="flex items-center gap-2 text-stone-300 text-sm">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-blue"></div>
                  <span>Analyzing your description…</span>
                </div>
              )}
              {prefillData && (
                <span className="text-emerald-300 text-sm">
                  Prefilled. You can review and edit below.
                </span>
              )}
            </div>
          </div>

          <ProfileForm
            initialData={prefillData || undefined}
            onSubmit={handleSubmit}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
