"use client";
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  GoogleAuthProvider,
  applyActionCode,
  sendEmailVerification,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
} from "firebase/auth";
import { appDb, app } from "./firebaseClient";

// Initialize Firebase services
export const db = appDb;
// Pass the app instance to getAuth, or it will try to use the default app which may not be initialized
export const auth = app ? getAuth(app) : null;

// ============================================================================
// AUTHENTICATION UTILITIES
// ============================================================================

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} displayName - User's display name
 * @returns {Promise<Object>} User data or error
 */
export const signUpUser = async (email, password, displayName = "") => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Sign in user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<Object>} User data or error
 */
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Sign in user with Google using popup (with redirect fallback)
 * @param {boolean} useRedirect - Force redirect instead of popup (useful for mobile)
 * @returns {Promise<Object>} User data or error
 */
export const signInWithGoogle = async (useRedirect = false) => {
  try {
    // If auth isn't initialized (likely missing env vars), fail fast with a clear message
    if (!auth) {
      return {
        success: false,
        error:
          "Firebase not initialized. Check NEXT_PUBLIC_FIREBASE_* env vars and restart dev server.",
      };
    }

    const provider = new GoogleAuthProvider();

    // Add scopes if needed
    provider.addScope("profile");
    provider.addScope("email");

    // Set custom parameters
    provider.setCustomParameters({
      prompt: "select_account",
    });

    if (useRedirect) {
      // Use redirect for mobile devices or when popup is blocked
      await signInWithRedirect(auth, provider);
      // Note: signInWithRedirect doesn't return immediately
      // The result is handled by getRedirectResult after page reload
      return { success: true, redirect: true };
    }

    try {
      // Try popup first (better UX on desktop)
      const userCredential = await signInWithPopup(auth, provider);
      return { success: true, user: userCredential.user };
    } catch (popupError) {
      // Check if popup was blocked or closed
      const errorCode = popupError?.code || "";
      const errorMessage = popupError?.message || "";

      if (
        errorCode === "auth/popup-blocked" ||
        errorCode === "auth/popup-closed-by-user" ||
        errorMessage.includes("popup") ||
        errorMessage.includes("blocked")
      ) {
        // Fallback to redirect
        console.warn(
          "Popup blocked or closed, falling back to redirect:",
          errorMessage
        );
        await signInWithRedirect(auth, provider);
        return { success: true, redirect: true };
      }

      // Handle other specific errors with user-friendly messages
      let userFriendlyError = errorMessage;

      if (errorCode === "auth/unauthorized-domain") {
        userFriendlyError =
          "This domain is not authorized. Please contact support.";
      } else if (errorCode === "auth/operation-not-allowed") {
        userFriendlyError =
          "Google sign-in is not enabled. Please contact support.";
      } else if (errorCode === "auth/network-request-failed") {
        userFriendlyError =
          "Network error. Please check your connection and try again.";
      } else if (errorCode === "auth/internal-error") {
        userFriendlyError = "An internal error occurred. Please try again.";
      }

      // Log full error for debugging
      console.error("Google sign-in error:", {
        code: errorCode,
        message: errorMessage,
        fullError: popupError,
      });

      return { success: false, error: userFriendlyError, errorCode };
    }
  } catch (error) {
    // Catch any unexpected errors
    console.error("Unexpected error during Google sign-in:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred. Please try again.",
    };
  }
};

/**
 * Handle redirect result after Google sign-in redirect
 * Call this after page load to check if user completed redirect sign-in
 * @returns {Promise<Object>} User data or null if no redirect happened
 */
export const handleGoogleRedirect = async () => {
  try {
    if (!auth) {
      return { success: false, error: "Firebase not initialized" };
    }

    const result = await getRedirectResult(auth);
    if (result) {
      return { success: true, user: result.user };
    }
    return { success: false, user: null }; // No redirect happened
  } catch (error) {
    console.error("Error handling redirect result:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Sign out current user
 * @returns {Promise<Object>} Success status or error
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise<Object>} Success status or error
 */
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Reset password with confirmation code
 * @param {string} oobCode - Password reset code
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success status or error
 */
export const resetPassword = async (oobCode, newPassword) => {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================================
// FIRESTORE UTILITIES
// ============================================================================

/**
 * Create a new document in a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Document reference or error
 */
export const createDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id, ref: docRef };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get a document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Document data or error
 */
export const getDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        success: true,
        data: { id: documentId, ...docSnap.data() },
      };
    } else {
      return { success: false, error: "Document not found" };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Update a document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Success status or error
 */
export const updateDocument = async (collectionName, documentId, data) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete a document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Success status or error
 */
export const deleteDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get documents from a collection with optional querying
 * @param {string} collectionName - Name of the collection
 * @param {Array} constraints - Query constraints (where, orderBy, limit, etc.)
 * @returns {Promise<Object>} Documents array or error
 */
export const getDocuments = async (collectionName, constraints = []) => {
  try {
    let q = collection(db, collectionName);

    // Apply constraints
    constraints.forEach((constraint) => {
      if (constraint.type === "where") {
        q = query(
          q,
          where(constraint.field, constraint.operator, constraint.value)
        );
      } else if (constraint.type === "orderBy") {
        q = query(q, orderBy(constraint.field, constraint.direction || "asc"));
      } else if (constraint.type === "limit") {
        q = query(q, limit(constraint.value));
      }
    });

    const querySnapshot = await getDocs(q);
    const documents = [];

    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: documents };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Set a document with custom ID (create or overwrite)
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Success status or error
 */
export const setDocument = async (collectionName, documentId, data) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await setDoc(
      docRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============================================================================
// USER-SPECIFIC UTILITIES
// ============================================================================

/**
 * Get user settings
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User settings or error
 */
export const getUserSettings = async (userId) => {
  return await getDocument("settings", userId);
};

/**
 * Update user settings
 * @param {string} userId - User ID
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Success status or error
 */
export const updateUserSettings = async (userId, settings) => {
  return await updateDocument("settings", userId, settings);
};

/**
 * Save user prompt/chat history
 * @param {string} userId - User ID
 * @param {Object} promptData - Prompt data
 * @returns {Promise<Object>} Success status or error
 */
export const saveUserPrompt = async (userId, promptData) => {
  return await createDocument("userPrompts", {
    userId,
    ...promptData,
  });
};

/**
 * Get user prompts/chat history
 * @param {string} userId - User ID
 * @param {number} limit - Number of prompts to fetch
 * @returns {Promise<Object>} Prompts array or error
 */
export const getUserPrompts = async (userId, limitCount = 50) => {
  return await getDocuments("userPrompts", [
    { type: "where", field: "userId", operator: "==", value: userId },
    { type: "orderBy", field: "createdAt", direction: "desc" },
    { type: "limit", value: limitCount },
  ]);
};

// ============================================================================
// REAL-TIME LISTENERS
// ============================================================================

/**
 * Listen to document changes in real-time
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
export const listenToDocument = (collectionName, documentId, callback) => {
  const docRef = doc(db, collectionName, documentId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
};

/**
 * Listen to collection changes in real-time
 * @param {string} collectionName - Name of the collection
 * @param {Array} constraints - Query constraints
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
export const listenToCollection = (
  collectionName,
  constraints = [],
  callback
) => {
  let q = collection(db, collectionName);

  constraints.forEach((constraint) => {
    if (constraint.type === "where") {
      q = query(
        q,
        where(constraint.field, constraint.operator, constraint.value)
      );
    } else if (constraint.type === "orderBy") {
      q = query(q, orderBy(constraint.field, constraint.direction || "asc"));
    } else if (constraint.type === "limit") {
      q = query(q, limit(constraint.value));
    }
  });

  return onSnapshot(q, (querySnapshot) => {
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    callback(documents);
  });
};

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function for auth state changes
 * @returns {Function} Unsubscribe function
 */
export const listenToAuthState = (callback) => {
  // Handle case when auth is not initialized (e.g., missing env vars)
  if (!auth) {
    // Call callback with null to indicate no user, then return no-op unsubscribe
    callback(null);
    return () => {}; // Return a no-op unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};
