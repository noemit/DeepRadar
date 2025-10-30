export const APP_CONFIG = {
  name: "AI Boilerplate",
  description: "Firebase + DeepInfra + React + HeroUI Template",
  version: "1.0.0",

  // Firebase Configuration
  firebase: {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },

  // DeepInfra Configuration
  deepinfra: {
    apiKey: process.env.DEEP_INFRA_API_KEY || process.env.DEEP_INFRA_API,
    baseUrl:
      process.env.DEEP_INFRA_BASE_URL ||
      "https://api.deepinfra.com/v1/openai/chat/completions",
    defaultModel:
      process.env.DEEP_INFRA_DEFAULT_MODEL || "deepseek-ai/DeepSeek-V3.2-Exp",
    maxTokens: parseInt(process.env.DEEP_INFRA_MAX_TOKENS || "1000", 10),
    temperature: parseFloat(process.env.DEEP_INFRA_TEMPERATURE || "0.7"),
  },

  // App Features
  features: {
    authentication: true,
    pdfExtraction: true,
    aiChat: true,
    realTimeUpdates: true,
  },

  // UI Configuration
  ui: {
    theme: "light", // light, dark, auto
    primaryColor: "#3B82F6", // blue-600
    accentColor: "#10B981", // emerald-500
    errorColor: "#EF4444", // red-500
    successColor: "#10B981", // emerald-500
    warningColor: "#F59E0B", // amber-500
  },

  // API Endpoints
  api: {
    deepinfra: "/api/deepinfra",
    extractPdf: "/api/extract-pdf",
  },

  // Storage Keys
  storage: {
    userPreferences: "ai-boilerplate-user-preferences",
    chatHistory: "ai-boilerplate-chat-history",
    theme: "ai-boilerplate-theme",
  },

  // Default Settings
  defaults: {
    language: "en",
    timezone: "UTC",
    dateFormat: "MMM dd, yyyy",
    timeFormat: "HH:mm",
  },
};

// Environment-specific configurations
export const getConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  return {
    ...APP_CONFIG,
    isDevelopment,
    isProduction,
    debug: isDevelopment,
    analytics: isProduction,
  };
};

// Feature flags
export const FEATURES = {
  AUTHENTICATION: true,
  PDF_EXTRACTION: true,
  AI_CHAT: true,
  REAL_TIME_UPDATES: true,
  GOOGLE_SIGN_IN: true,
  PASSWORD_RESET: true,
  USER_SETTINGS: true,
  CHAT_HISTORY: true,
};

// Check if a feature is enabled
export const isFeatureEnabled = (feature) => {
  return FEATURES[feature] === true;
};
