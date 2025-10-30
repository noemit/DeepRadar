"use client";
import { useState, useCallback, useRef } from "react";

/**
 * Hook for managing API calls with loading states and error handling
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} API state and functions
 */
export const useApi = (apiFunction, options = {}) => {
  const {
    immediate = false,
    initialData = null,
    onSuccess,
    onError,
    onFinally,
    cacheKey = null,
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const abortControllerRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Check cache for data
  const getCachedData = useCallback(
    (key) => {
      if (!cacheKey || !key) return null;

      const cached = cacheRef.current.get(key);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        return cached.data;
      }

      // Remove expired cache entry
      if (cached) {
        cacheRef.current.delete(key);
      }

      return null;
    },
    [cacheKey, cacheTime]
  );

  // Set cache data
  const setCachedData = useCallback(
    (key, data) => {
      if (!cacheKey || !key) return;

      cacheRef.current.set(key, {
        data,
        timestamp: Date.now(),
      });
    },
    [cacheKey]
  );

  // Execute API call
  const execute = useCallback(
    async (...args) => {
      // Check cache first
      if (cacheKey) {
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setIsSuccess(true);
          return { success: true, data: cachedData, fromCache: true };
        }
      }

      // Abort previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);
        setIsSuccess(false);

        const result = await apiFunction(
          ...args,
          abortControllerRef.current.signal
        );

        if (result.success) {
          setData(result.data || result);
          setIsSuccess(true);

          // Cache the result
          if (cacheKey) {
            setCachedData(cacheKey, result.data || result);
          }

          // Call success callback
          if (onSuccess) {
            onSuccess(result.data || result);
          }

          return { success: true, data: result.data || result };
        } else {
          throw new Error(result.error || "API call failed");
        }
      } catch (err) {
        // Don't set error if request was aborted
        if (err.name === "AbortError") {
          return { success: false, aborted: true };
        }

        const errorMessage = err.message || "An error occurred";
        setError(errorMessage);
        setIsSuccess(false);

        // Call error callback
        if (onError) {
          onError(errorMessage);
        }

        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);

        // Call finally callback
        if (onFinally) {
          onFinally();
        }
      }
    },
    [
      apiFunction,
      cacheKey,
      getCachedData,
      setCachedData,
      onSuccess,
      onError,
      onFinally,
    ]
  );

  // Reset state
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    setIsSuccess(false);
  }, [initialData]);

  // Clear cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Abort current request
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Execute immediately if requested
  if (immediate && !loading && !data && !error) {
    execute();
  }

  return {
    data,
    loading,
    error,
    isSuccess,
    execute,
    reset,
    abort,
    clearCache,
  };
};

/**
 * Hook for managing multiple API calls
 * @param {Object} apiFunctions - Object containing multiple API functions
 * @param {Object} options - Configuration options for each API
 * @returns {Object} Object with API states and functions
 */
export const useMultipleApis = (apiFunctions, options = {}) => {
  const results = {};

  Object.keys(apiFunctions).forEach((key) => {
    results[key] = useApi(apiFunctions[key], options[key] || {});
  });

  return results;
};

/**
 * Hook for managing API calls with retry logic
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} API state and functions
 */
export const useApiWithRetry = (apiFunction, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryCondition = (error) => true, // Retry on any error by default
    ...apiOptions
  } = options;

  const [retryCount, setRetryCount] = useState(0);

  const executeWithRetry = useCallback(
    async (...args) => {
      let lastError;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          setRetryCount(attempt);

          const result = await apiFunction(...args);

          if (result.success) {
            setRetryCount(0);
            return result;
          } else {
            lastError = new Error(result.error);
          }
        } catch (error) {
          lastError = error;
        }

        // Don't retry if we've reached max retries or if retry condition is not met
        if (attempt === maxRetries || !retryCondition(lastError)) {
          break;
        }

        // Wait before retrying
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
        }
      }

      // If we get here, all retries failed
      throw lastError;
    },
    [apiFunction, maxRetries, retryDelay, retryCondition]
  );

  const api = useApi(executeWithRetry, apiOptions);

  return {
    ...api,
    retryCount,
  };
};
