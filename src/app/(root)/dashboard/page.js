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

  // Redirect to latest radar or create page and avoid rendering dashboard UI
  useEffect(() => {
    if (!authLoading && user && !radarsLoading) {
      const newest = radars && radars[0];
      if (newest && newest.id) {
        router.replace(`/radar/${newest.id}`);
      } else {
        router.replace("/radar/create");
      }
    }
  }, [authLoading, user, radarsLoading, radars, router]);

  if (authLoading || (user && radarsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  // We performed a redirect; render nothing
  return null;
}
