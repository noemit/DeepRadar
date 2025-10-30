"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CustomEventonPathChange } from "../hooks/useFirebaseAnalytics";
import {
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

function NotFoundContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [referrer, setReferrer] = useState("");

  useEffect(() => {
    setReferrer(document.referrer || "Direct access");
  }, []);

  CustomEventonPathChange("NotFound_page", pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        {/* Header Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Not all who wander are lost
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          But we are - we couldn&apos;t find the page you were looking for.
        </p>

        {/* Debug Information */}
        <div className="text-left bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
          <div className="flex items-center mb-4">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Debugging Information:
            </h2>
          </div>
          <div className="font-mono text-sm space-y-3">
            <div className="flex items-center">
              <GlobeAltIcon className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
              <span>
                <strong>Attempted URL:</strong> {pathname}
              </span>
            </div>
            <div className="flex items-center">
              <DocumentTextIcon className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
              <span>
                <strong>Query Parameters:</strong>{" "}
                {searchParams.toString() || "None"}
              </span>
            </div>
            <div className="flex items-center">
              <ArrowLeftIcon className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
              <span>
                <strong>Referrer:</strong> {referrer}
              </span>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
              <span>
                <strong>Timestamp:</strong> {new Date().toISOString()}
              </span>
            </div>
          </div>
        </div>

        <p className="text-red-600 font-semibold mb-8">
          Running into errors? Screenshot this page and send it to Noemi
        </p>

        <button
          onClick={() => router.back()}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-stone-200 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Go Back
        </button>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <NotFoundContent />
    </Suspense>
  );
}
