"use client";
import React, { useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { Button, Input } from "../../components/HeroUIComponents";

/**
 * ChatRefine - Chat UI for refining radar
 * @param {Object} props
 * @param {Function} props.onRefine - Callback with refinement message
 * @param {boolean} props.loading
 */
export default function ChatRefine({ onRefine, loading }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    onRefine(message.trim());
    setMessage("");
  };

  return (
    <div className="card-sleek">
      <h3 className="text-lg font-semibold text-stone-200 mb-2">
        Refine Your Radar
      </h3>
      <p className="text-sm text-stone-200 mb-4">
        Describe changes you'd like to make. For example: "Drop policy, add web
        gaming and accessibility."
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your refinement request..."
          disabled={loading}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={loading || !message.trim()}
          className="px-6"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </Button>
      </form>
    </div>
  );
}
