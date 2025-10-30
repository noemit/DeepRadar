"use client";
import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import {
  UserIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useCollection } from "../../hooks/useFirestore";

export default function Home() {
  const {
    user,
    loading: authLoading,
    signinWithGoogle,
    error: authError,
    clearError,
    signout,
  } = useAuth();
  const router = useRouter();
  const [signInLoading, setSignInLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [youTestLoading, setYouTestLoading] = useState(false);
  const [youTestResult, setYouTestResult] = useState(null);
  const [youTestError, setYouTestError] = useState(null);
  const [diTestLoading, setDiTestLoading] = useState(false);
  const [diTestResult, setDiTestResult] = useState(null);
  const [diTestError, setDiTestError] = useState(null);

  // Handle Google sign-in with loading state
  const handleGoogleSignIn = async () => {
    setSignInLoading(true);
    setLocalError(null);
    clearError();

    try {
      const result = await signinWithGoogle();
      if (!result.success) {
        setLocalError(result.error || "Failed to sign in with Google");
      }
      // If redirect is needed, the function will handle it
      // The page will reload and handleGoogleRedirect will be called
    } catch (error) {
      setLocalError(error.message || "An unexpected error occurred");
    } finally {
      setSignInLoading(false);
    }
  };

  // Check for redirect result on mount (when user returns from Google sign-in)
  useEffect(() => {
    // Only check redirect result if auth is not loading and user is not already signed in
    if (!authLoading) {
      import("../../lib/firebase").then(({ handleGoogleRedirect }) => {
        handleGoogleRedirect().then((result) => {
          if (result.success && result.user) {
            // User was redirected and signed in successfully
            // The auth state listener should pick this up automatically,
            // but we refresh to ensure UI updates
            router.refresh();
          } else if (result.error) {
            // Handle redirect errors
            setLocalError(result.error);
          }
        });
      });
    }
  }, [authLoading, router]);

  // Determine error to display
  const displayError = localError || authError;

  // Redirect signed-in users to latest radar or create
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
  const { data: newestRadars, loading: newestLoading } = useCollection(
    "radars",
    constraints,
    false,
    !!user && !authLoading
  );

  // No redirect on home; show navigation buttons instead

  if (authLoading || (user && newestLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-accent rounded-full mb-4 shadow-lg shadow-green-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-8 h-8 text-stone-200"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m3.75 7.5 16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 0 0 4.5 21h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0 0 12 6.75Zm-1.683 6.443-.005.005-.006-.005.006-.005.005.005Zm-.005 2.127-.005-.006.005-.005.005.005-.005.005Zm-2.116-.006-.005.006-.006-.006.005-.005.006.005Zm-.005-2.116-.006-.005.006-.005.005.005-.005.005ZM9.255 10.5v.008h-.008V10.5h.008Zm3.249 1.88-.007.004-.003-.007.006-.003.004.006Zm-1.38 5.126-.003-.006.006-.004.004.007-.006.003Zm.007-6.501-.003.006-.007-.003.004-.007.006.004Zm1.37 5.129-.007-.004.004-.006.006.003-.004.007Zm.504-1.877h-.008v-.007h.008v.007ZM9.255 18v.008h-.008V18h.008Zm-3.246-1.87-.007.004L6 16.127l.006-.003.004.006Zm1.366-5.119-.004-.006.006-.004.004.007-.006.003ZM7.38 17.5l-.003.006-.007-.003.004-.007.006.004Zm-1.376-5.116L6 12.38l.003-.007.007.004-.004.007Zm-.5 1.873h-.008v-.007h.008v.007ZM17.25 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm0 4.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-3">DeepRadar</h1>
          <p className="text-xl text-stone-200 mb-1">
            Personalized, daily industry scans
          </p>
          <p className="text-base text-stone-200">
            Adapt to your role, domain, and evolving interests
          </p>
        </div>

        {/* CTA Section for signed-out users */}
        {!user ? (
          <div className="card-sleek card-hover mb-6">
            <h2 className="text-xl font-semibold text-stone-200 mb-3 text-center">
              Get Started
            </h2>
            <p className="text-stone-200 mb-4 text-center text-sm">
              Sign in to create your personalized radar, or explore examples
              below.
            </p>

            {/* Error Display */}
            {displayError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-200">{displayError}</p>
                    {(displayError.includes("popup") ||
                      displayError.includes("blocked")) && (
                      <p className="text-xs text-red-300 mt-1">
                        If popups are blocked, try disabling your popup blocker
                        or allow popups for this site.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setLocalError(null);
                      clearError();
                    }}
                    className="text-red-300 hover:text-red-200 ml-2"
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={signInLoading}
                className="btn-gradient w-full px-4 py-2.5 text-sm inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signInLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
              <Link
                href="/company-overview"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm rounded-lg border border-stone-700/70 bg-stone-900/30 text-stone-200 hover:bg-stone-900/50 transition-colors"
              >
                Company overview
              </Link>
            </div>
          </div>
        ) : null}

        {/* Navigation for signed-in users */}
        {user && (
          <div className="card-sleek card-hover mb-6">
            <h2 className="text-xl font-semibold text-stone-200 mb-3 text-center">
              Your navigation
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {newestRadars && newestRadars[0]?.id && (
                <Link
                  href={`/radar/${newestRadars[0].id}`}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm rounded-lg border border-stone-700/70 bg-stone-900/30 text-stone-200 hover:bg-stone-900/50 transition-colors"
                >
                  Your radar
                </Link>
              )}
              <Link
                href="/radar/create"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm rounded-lg border border-stone-700/70 bg-stone-900/30 text-stone-200 hover:bg-stone-900/50 transition-colors"
              >
                Create
              </Link>
              <Link
                href="/company-overview"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm rounded-lg border border-stone-700/70 bg-stone-900/30 text-stone-200 hover:bg-stone-900/50 transition-colors"
              >
                Company overview
              </Link>
              <button
                onClick={async () => {
                  await signout();
                  router.refresh();
                }}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm rounded-lg border border-stone-700/70 bg-stone-900/30 text-stone-200 hover:bg-stone-900/50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card-sleek card-hover">
            <h3 className="text-lg font-semibold text-stone-200 mb-2">
              Personalized Radar
            </h3>
            <p className="text-stone-200 text-sm">
              Define your role, industry, and interests to generate a custom
              search plan.
            </p>
          </div>
          <div className="card-sleek card-hover">
            <h3 className="text-lg font-semibold text-stone-200 mb-2">
              Daily Reports
            </h3>
            <p className="text-stone-200 text-sm">
              Get synthesized daily reports from curated web searches based on
              your radar.
            </p>
          </div>
          <div className="card-sleek card-hover">
            <h3 className="text-lg font-semibold text-stone-200 mb-2">
              Refine & Share
            </h3>
            <p className="text-stone-200 text-sm">
              Chat to refine your radar and share insights in your own voice.
            </p>
          </div>
        </div>

        {/* API tests removed */}
      </div>
    </div>
  );
}
