"use client";
// Client-side Firebase initialization
// This file runs in the browser and initializes Firebase client SDK
// Note: NEXT_PUBLIC_* env vars are exposed to the client by Next.js

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Read config directly from env vars (Next.js exposes NEXT_PUBLIC_* to client)
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    process.env.FIREBASE_AUTH_DOMAIN,
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    process.env.FIREBASE_MEASUREMENT_ID,
};

// Check if config is valid
const isFirebaseConfigValid =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

// Only initialize Firebase if we have the required config
let app = null;
if (isFirebaseConfigValid) {
  try {
    // Check if Firebase app is already initialized (prevents errors during hot reload)
    const existingApps = getApps();
    if (existingApps.length === 0) {
      // No apps initialized, create a new one
      app = initializeApp(firebaseConfig);
    } else {
      // App already exists, use it
      app = existingApps[0];
    }
  } catch (error) {
    // If initialization fails, try to get existing app
    console.error("Error initializing Firebase:", error);
    try {
      app = getApp();
    } catch (getAppError) {
      console.error("Failed to get Firebase app:", getAppError);
      app = null;
    }
  }
}

// Export app instance for use in other files
export { app };

// Initialize Firestore
export const appDb = app ? getFirestore(app) : null;

// Initialize Analytics (only in browser)
export const analytics =
  app && typeof window !== "undefined" ? getAnalytics(app) : null;
