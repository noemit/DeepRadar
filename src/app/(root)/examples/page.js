"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { exampleRadars } from "../../../lib/data/exampleRadars";
import {
  ChartBarIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function ExamplesGallery() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <button
          onClick={() => router.push("/")}
          className="text-green-300 hover:text-green-400 mb-4 inline-flex items-center transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Home
        </button>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-stone-200 mb-4">
            Example Radars
          </h1>
          <p className="text-xl text-stone-200">
            Explore pre-built radar templates and fork them to get started
          </p>
        </div>

        {/* Examples Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exampleRadars.map((example) => (
            <div
              key={example.slug}
              className="card-sleek card-hover cursor-pointer"
              onClick={() => router.push(`/examples/${example.slug}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-stone-200 mb-2">
                    {example.title}
                  </h3>
                  <p className="text-stone-200 text-sm mb-4">
                    {example.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {example.profile.priorities
                      .slice(0, 4)
                      .map((priority, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-accent-blue/20 text-accent-blue text-xs rounded-full border border-accent-blue/30"
                        >
                          {priority}
                        </span>
                      ))}
                  </div>
                </div>
                <ChartBarIcon className="w-8 h-8 text-accent-blue flex-shrink-0 ml-4" />
              </div>
              <div className="flex items-center text-accent-blue text-sm font-medium">
                View Details
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
