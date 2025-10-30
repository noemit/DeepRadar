"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  signUpUser,
  signInUser,
  signInWithGoogle,
  signOutUser,
  sendPasswordReset,
  resetPassword,
  listenToAuthState,
} from "../lib/firebase";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = listenToAuthState((user) => {
      setUser(user);
      setLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, displayName = "") => {
    try {
      setError(null);
      const result = await signUpUser(email, password, displayName);

      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true, user: result.user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const signin = async (email, password) => {
    try {
      setError(null);
      const result = await signInUser(email, password);

      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true, user: result.user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const signinWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithGoogle();

      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true, user: result.user };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const signout = async () => {
    try {
      setError(null);
      const result = await signOutUser();

      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      const result = await sendPasswordReset(email);

      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const confirmPasswordReset = async (oobCode, newPassword) => {
    try {
      setError(null);
      const result = await resetPassword(oobCode, newPassword);

      if (!result.success) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    signup,
    signin,
    signinWithGoogle,
    signout,
    resetPassword: resetPassword,
    confirmPasswordReset,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
