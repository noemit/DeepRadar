// Server-side Firebase configuration
// This file runs on the server and reads environment variables

// Direct access to environment variables
const apiKey =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
const authDomain =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
  process.env.FIREBASE_AUTH_DOMAIN;
const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID;
const storageBucket =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
  process.env.FIREBASE_STORAGE_BUCKET;
const messagingSenderId =
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
  process.env.FIREBASE_MESSAGING_SENDER_ID;
const appId =
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID;
const measurementId =
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
  process.env.FIREBASE_MEASUREMENT_ID;

// Check which required vars are missing
const missingVars = [];
if (!apiKey) missingVars.push("NEXT_PUBLIC_FIREBASE_API_KEY");
if (!authDomain) missingVars.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
if (!projectId) missingVars.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
if (!storageBucket) missingVars.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
if (!messagingSenderId)
  missingVars.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
if (!appId) missingVars.push("NEXT_PUBLIC_FIREBASE_APP_ID");

// Only show errors if variables are actually missing
if (missingVars.length > 0) {
  console.error(
    `Missing Firebase environment variables: ${missingVars.join(", ")}`
  );
  console.error(
    `\nPlease add these to your .env.local file:\n${missingVars
      .map((name) => `${name}=your_value_here`)
      .join("\n")}`
  );
  console.error(
    "\n⚠️ IMPORTANT: After updating .env.local, you MUST restart your Next.js dev server!"
  );
}

// Firebase configuration object
export const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
};

// Export config validation
export const isFirebaseConfigValid = missingVars.length === 0;
