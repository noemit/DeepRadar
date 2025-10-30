"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { analytics } from "../lib/firebaseClient";

/**
 * Hook for tracking page views and custom events with Firebase Analytics
 */
export const useFirebaseAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views automatically
  useEffect(() => {
    if (analytics && typeof window !== "undefined") {
      // Track page view
      analytics.logEvent("page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_path: pathname,
      });
    }
  }, [pathname]);

  // Track search query changes
  useEffect(() => {
    if (analytics && searchParams.toString()) {
      analytics.logEvent("search", {
        search_term: searchParams.toString(),
        page_path: pathname,
      });
    }
  }, [searchParams, pathname]);

  /**
   * Track custom events
   * @param {string} eventName - Name of the event
   * @param {Object} parameters - Event parameters
   */
  const logEvent = (eventName, parameters = {}) => {
    if (analytics && typeof window !== "undefined") {
      analytics.logEvent(eventName, {
        ...parameters,
        timestamp: new Date().toISOString(),
        page_path: pathname,
      });
    }
  };

  /**
   * Track user actions (clicks, form submissions, etc.)
   * @param {string} action - Action being performed
   * @param {string} element - Element being interacted with
   * @param {Object} additionalParams - Additional parameters
   */
  const trackUserAction = (action, element, additionalParams = {}) => {
    logEvent("user_action", {
      action,
      element,
      ...additionalParams,
    });
  };

  /**
   * Track form interactions
   * @param {string} formName - Name of the form
   * @param {string} action - Action (submit, start, complete, etc.)
   * @param {Object} additionalParams - Additional parameters
   */
  const trackFormInteraction = (formName, action, additionalParams = {}) => {
    logEvent("form_interaction", {
      form_name: formName,
      action,
      ...additionalParams,
    });
  };

  /**
   * Track API calls
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {boolean} success - Whether the call was successful
   * @param {number} duration - Duration in milliseconds
   * @param {Object} additionalParams - Additional parameters
   */
  const trackApiCall = (
    endpoint,
    method,
    success,
    duration,
    additionalParams = {}
  ) => {
    logEvent("api_call", {
      endpoint,
      method,
      success,
      duration,
      ...additionalParams,
    });
  };

  /**
   * Track errors
   * @param {string} errorType - Type of error
   * @param {string} errorMessage - Error message
   * @param {Object} additionalParams - Additional parameters
   */
  const trackError = (errorType, errorMessage, additionalParams = {}) => {
    logEvent("error", {
      error_type: errorType,
      error_message: errorMessage,
      ...additionalParams,
    });
  };

  /**
   * Track user engagement
   * @param {string} engagementType - Type of engagement
   * @param {Object} additionalParams - Additional parameters
   */
  const trackEngagement = (engagementType, additionalParams = {}) => {
    logEvent("user_engagement", {
      engagement_type: engagementType,
      ...additionalParams,
    });
  };

  /**
   * Track feature usage
   * @param {string} featureName - Name of the feature
   * @param {Object} additionalParams - Additional parameters
   */
  const trackFeatureUsage = (featureName, additionalParams = {}) => {
    logEvent("feature_usage", {
      feature_name: featureName,
      ...additionalParams,
    });
  };

  /**
   * Track performance metrics
   * @param {string} metricName - Name of the metric
   * @param {number} value - Metric value
   * @param {string} unit - Unit of measurement
   * @param {Object} additionalParams - Additional parameters
   */
  const trackPerformance = (metricName, value, unit, additionalParams = {}) => {
    logEvent("performance", {
      metric_name: metricName,
      value,
      unit,
      ...additionalParams,
    });
  };

  /**
   * Track user preferences
   * @param {string} preferenceType - Type of preference
   * @param {any} value - Preference value
   * @param {Object} additionalParams - Additional parameters
   */
  const trackUserPreference = (
    preferenceType,
    value,
    additionalParams = {}
  ) => {
    logEvent("user_preference", {
      preference_type: preferenceType,
      value: String(value),
      ...additionalParams,
    });
  };

  /**
   * Track navigation events
   * @param {string} fromPath - Path user is coming from
   * @param {string} toPath - Path user is going to
   * @param {string} navigationType - Type of navigation (link, button, etc.)
   * @param {Object} additionalParams - Additional parameters
   */
  const trackNavigation = (
    fromPath,
    toPath,
    navigationType,
    additionalParams = {}
  ) => {
    logEvent("navigation", {
      from_path: fromPath,
      to_path: toPath,
      navigation_type: navigationType,
      ...additionalParams,
    });
  };

  /**
   * Track content interactions
   * @param {string} contentType - Type of content
   * @param {string} contentId - Content identifier
   * @param {string} action - Action performed on content
   * @param {Object} additionalParams - Additional parameters
   */
  const trackContentInteraction = (
    contentType,
    contentId,
    action,
    additionalParams = {}
  ) => {
    logEvent("content_interaction", {
      content_type: contentType,
      content_id: contentId,
      action,
      ...additionalParams,
    });
  };

  return {
    logEvent,
    trackUserAction,
    trackFormInteraction,
    trackApiCall,
    trackError,
    trackEngagement,
    trackFeatureUsage,
    trackPerformance,
    trackUserPreference,
    trackNavigation,
    trackContentInteraction,
  };
};

/**
 * Utility function to trigger custom events (for backward compatibility)
 * @param {string} eventName - Name of the event
 * @param {Object} parameters - Event parameters
 */
export const TriggerCustomEvent = (eventName, parameters = {}) => {
  if (analytics && typeof window !== "undefined") {
    analytics.logEvent(eventName, {
      ...parameters,
      timestamp: new Date().toISOString(),
      page_path: window.location.pathname,
    });
  }
};

/**
 * Utility function to track path changes (for backward compatibility)
 * @param {string} eventName - Name of the event
 * @param {string} path - Current path
 * @param {Object} additionalParams - Additional parameters
 */
export const CustomEventonPathChange = (
  eventName,
  path,
  additionalParams = {}
) => {
  if (analytics && typeof window !== "undefined") {
    analytics.logEvent(eventName, {
      path,
      timestamp: new Date().toISOString(),
      page_path: path,
      ...additionalParams,
    });
  }
};

/**
 * Utility function to track user journey
 * @param {string} step - Current step in user journey
 * @param {Object} additionalParams - Additional parameters
 */
export const trackUserJourney = (step, additionalParams = {}) => {
  if (analytics && typeof window !== "undefined") {
    analytics.logEvent("user_journey", {
      step,
      timestamp: new Date().toISOString(),
      page_path: window.location.pathname,
      ...additionalParams,
    });
  }
};

/**
 * Utility function to track conversion events
 * @param {string} conversionType - Type of conversion
 * @param {Object} additionalParams - Additional parameters
 */
export const trackConversion = (conversionType, additionalParams = {}) => {
  if (analytics && typeof window !== "undefined") {
    analytics.logEvent("conversion", {
      conversion_type: conversionType,
      timestamp: new Date().toISOString(),
      page_path: window.location.pathname,
      ...additionalParams,
    });
  }
};
