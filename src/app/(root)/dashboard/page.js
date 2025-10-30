"use client";
import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import {
  PlusIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useCollection } from "../../../hooks/useFirestore";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Memoize constraints to prevent infinite re-renders
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

  const {
    data: radars,
    loading: radarsLoading,
    error: radarsError,
  } = useCollection("radars", constraints, false, !!user && !authLoading);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="text-green-300 hover:text-green-400 mb-4 inline-flex items-center transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Home
        </button>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-1">
              Your Radar
            </h1>
            <p className="text-sm text-stone-200">
              Personalized industry scans for {user.email}
            </p>
          </div>
          <button
            onClick={() => router.push("/radar/create")}
            className="btn-gradient inline-flex items-center px-4 py-2 text-sm"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Radar
          </button>
        </div>

        {/* Radar (newest only) */}
        {radarsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
          </div>
        ) : radarsError ? (
          <div className="card-sleek border-red-500/50 bg-red-900/20 text-stone-200">
            Error loading radars: {radarsError}
          </div>
        ) : radars && radars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {radars.map((radar) => (
              <div
                key={radar.id}
                onClick={() => router.push(`/radar/${radar.id}`)}
                className="card-sleek card-hover cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-stone-200">
                    {radar.title || "Untitled Radar"}
                  </h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5 text-accent-blue"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m3.75 7.5 16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 0 0 4.5 21h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0 0 12 6.75Zm-1.683 6.443-.005.005-.006-.005.006-.005.005.005Zm-.005 2.127-.005-.006.005-.005.005.005-.005.005Zm-2.116-.006-.005.006-.006-.006.005-.005.006.005Zm-.005-2.116-.006-.005.006-.005.005.005-.005.005ZM9.255 10.5v.008h-.008V10.5h.008Zm3.249 1.88-.007.004-.003-.007.006-.003.004.006Zm-1.38 5.126-.003-.006.006-.004.004.007-.006.003Zm.007-6.501-.003.006-.007-.003.004-.007.006.004Zm1.37 5.129-.007-.004.004-.006.006.003-.004.007Zm.504-1.877h-.008v-.007h.008v.007ZM9.255 18v.008h-.008V18h.008Zm-3.246-1.87-.007.004L6 16.127l.006-.003.004.006Zm1.366-5.119-.004-.006.006-.004.004.007-.006.003ZM7.38 17.5l-.003.006-.007-.003.004-.007.006.004Zm-1.376-5.116L6 12.38l.003-.007.007.004-.004.007Zm-.5 1.873h-.008v-.007h.008v.007ZM17.25 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 4.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                    />
                  </svg>
                </div>
                <p className="text-stone-200 text-sm mb-3">
                  {radar.profile?.industry || "Industry"} •{" "}
                  {radar.profile?.role || "Role"}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {radar.profile?.priorities
                    ?.slice(0, 3)
                    .map((priority, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-accent-blue/20 text-accent-blue text-xs rounded-full border border-accent-blue/30"
                      >
                        {priority}
                      </span>
                    ))}
                </div>
                <div className="flex items-center text-accent-blue text-sm font-medium">
                  View Details
                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-sleek text-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-12 h-12 text-stone-200 mx-auto mb-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m3.75 7.5 16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 0 0 4.5 21h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0 0 12 6.75Zm-1.683 6.443-.005.005-.006-.005.006-.005.005.005Zm-.005 2.127-.005-.006.005-.005.005.005-.005.005Zm-2.116-.006-.005.006-.006-.006.005-.005.006.005Zm-.005-2.116-.006-.005.006-.005.005.005-.005.005ZM9.255 10.5v.008h-.008V10.5h.008Zm3.249 1.88-.007.004-.003-.007.006-.003.004.006Zm-1.38 5.126-.003-.006.006-.004.004.007-.006.003Zm.007-6.501-.003.006-.007-.003.004-.007.006.004Zm1.37 5.129-.007-.004.004-.006.006.003-.004.007Zm.504-1.877h-.008v-.007h.008v.007ZM9.255 18v.008h-.008V18h.008Zm-3.246-1.87-.007.004L6 16.127l.006-.003.004.006Zm1.366-5.119-.004-.006.006-.004.004.007-.006.003ZM7.38 17.5l-.003.006-.007-.003.004-.007.006.004Zm-1.376-5.116L6 12.38l.003-.007.007.004-.004.007Zm-.5 1.873h-.008v-.007h.008v.007ZM17.25 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 4.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-stone-200 mb-2">
              No radars yet
            </h3>
            <p className="text-stone-200 text-sm mb-4">
              Create your first radar to start receiving personalized industry
              scans
            </p>
            <button
              onClick={() => router.push("/radar/create")}
              className="btn-gradient inline-flex items-center px-4 py-2 text-sm"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Your First Radar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
