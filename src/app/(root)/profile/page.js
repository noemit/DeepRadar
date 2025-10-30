"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { getDocument, setDocument } from "../../../lib/firebase";
import { Input, Button } from "../../../components/HeroUIComponents";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [voiceProfile, setVoiceProfile] = useState({
    toneHints: [],
    samplePhrases: [],
  });
  const [newToneHint, setNewToneHint] = useState("");
  const [newSamplePhrase, setNewSamplePhrase] = useState("");

  useEffect(() => {
    if (user && !authLoading) {
      loadUserProfile();
    }
  }, [user, authLoading]);

  const loadUserProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await getDocument("users", user.uid);
      if (result.success && result.data.voiceProfile) {
        setVoiceProfile(result.data.voiceProfile);
      } else {
        // Initialize user document
        await setDocument("users", user.uid, {
          displayName: user.displayName || "",
          email: user.email || "",
          voiceProfile: {
            toneHints: [],
            samplePhrases: [],
          },
        });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToneHint = () => {
    if (
      newToneHint.trim() &&
      !voiceProfile.toneHints.includes(newToneHint.trim())
    ) {
      setVoiceProfile({
        ...voiceProfile,
        toneHints: [...voiceProfile.toneHints, newToneHint.trim()],
      });
      setNewToneHint("");
    }
  };

  const handleRemoveToneHint = (hint) => {
    setVoiceProfile({
      ...voiceProfile,
      toneHints: voiceProfile.toneHints.filter((h) => h !== hint),
    });
  };

  const handleAddSamplePhrase = () => {
    if (
      newSamplePhrase.trim() &&
      !voiceProfile.samplePhrases.includes(newSamplePhrase.trim())
    ) {
      setVoiceProfile({
        ...voiceProfile,
        samplePhrases: [...voiceProfile.samplePhrases, newSamplePhrase.trim()],
      });
      setNewSamplePhrase("");
    }
  };

  const handleRemoveSamplePhrase = (phrase) => {
    setVoiceProfile({
      ...voiceProfile,
      samplePhrases: voiceProfile.samplePhrases.filter((p) => p !== phrase),
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError("");

    try {
      await setDocument("users", user.uid, {
        displayName: user.displayName || "",
        email: user.email || "",
        voiceProfile,
      });

      alert("Profile saved successfully!");
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto py-6 px-4">
        <div className="card-sleek">
          <h1 className="text-2xl font-bold text-gradient mb-5">
            Your Profile
          </h1>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-300 px-3 py-2 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          {/* Voice Profile Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-stone-200 mb-3">
                Voice Profile
              </h2>
              <p className="text-sm text-stone-200 mb-4">
                Customize how share snippets are generated in your writing
                style.
              </p>

              {/* Tone Hints */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-stone-200 mb-2">
                  Tone Hints
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={newToneHint}
                    onChange={(e) => setNewToneHint(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddToneHint();
                      }
                    }}
                    placeholder="e.g., casual, technical, friendly"
                  />
                  <Button
                    type="button"
                    onClick={handleAddToneHint}
                    className="px-4"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {voiceProfile.toneHints.map((hint, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 bg-accent-blue/20 text-accent-blue text-xs rounded-full border border-accent-blue/30"
                    >
                      {hint}
                      <button
                        type="button"
                        onClick={() => handleRemoveToneHint(hint)}
                        className="ml-1.5 text-accent-blue hover:text-accent-cyan text-sm"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Phrases */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-stone-200 mb-2">
                  Sample Phrases
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="text"
                    value={newSamplePhrase}
                    onChange={(e) => setNewSamplePhrase(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSamplePhrase();
                      }
                    }}
                    placeholder="e.g., 'Check this out:', 'Interesting read'"
                  />
                  <Button
                    type="button"
                    onClick={handleAddSamplePhrase}
                    className="px-4"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {voiceProfile.samplePhrases.map((phrase, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 bg-accent-emerald/20 text-accent-emerald text-xs rounded-full border border-accent-emerald/30"
                    >
                      {phrase}
                      <button
                        type="button"
                        onClick={() => handleRemoveSamplePhrase(phrase)}
                        className="ml-1.5 text-accent-emerald hover:text-emerald-300 text-sm"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
