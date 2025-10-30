"use client";
import { useState, useEffect, useCallback } from "react";
import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  listenToDocument,
  listenToCollection,
} from "../lib/firebase";

/**
 * Hook for managing a single document
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - Document ID
 * @param {boolean} listen - Whether to listen for real-time updates
 * @returns {Object} Document data, loading state, and operations
 */
export const useDocument = (collectionName, documentId, listen = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocument = useCallback(async () => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getDocument(collectionName, documentId);

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collectionName, documentId]);

  const updateDoc = useCallback(
    async (updateData) => {
      if (!documentId) return { success: false, error: "No document ID" };

      try {
        setError(null);
        const result = await updateDocument(
          collectionName,
          documentId,
          updateData
        );

        if (result.success) {
          // Update local state
          setData((prev) => ({ ...prev, ...updateData }));
        } else {
          setError(result.error);
        }

        return result;
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [collectionName, documentId]
  );

  const deleteDoc = useCallback(async () => {
    if (!documentId) return { success: false, error: "No document ID" };

    try {
      setError(null);
      const result = await deleteDocument(collectionName, documentId);

      if (result.success) {
        setData(null);
      } else {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [collectionName, documentId]);

  useEffect(() => {
    if (listen && documentId) {
      const unsubscribe = listenToDocument(
        collectionName,
        documentId,
        (docData) => {
          setData(docData);
          setLoading(false);
          setError(null);
        }
      );

      return unsubscribe;
    } else if (documentId) {
      fetchDocument();
    }
  }, [collectionName, documentId, listen, fetchDocument]);

  return {
    data,
    loading,
    error,
    updateDocument: updateDoc,
    deleteDocument: deleteDoc,
    refetch: fetchDocument,
  };
};

/**
 * Hook for managing a collection of documents
 * @param {string} collectionName - Name of the collection
 * @param {Array} constraints - Query constraints
 * @param {boolean} listen - Whether to listen for real-time updates
 * @returns {Object} Documents array, loading state, and operations
 */
export const useCollection = (
  collectionName,
  constraints = [],
  listen = false,
  enabled = true
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    if (!enabled || !collectionName) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await getDocuments(collectionName, constraints);

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collectionName, constraints, enabled]);

  const addDocument = useCallback(
    async (documentData) => {
      try {
        setError(null);
        const result = await createDocument(collectionName, documentData);

        if (result.success) {
          // Add to local state
          setData((prev) => [{ id: result.id, ...documentData }, ...prev]);
        } else {
          setError(result.error);
        }

        return result;
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [collectionName]
  );

  useEffect(() => {
    if (!enabled || !collectionName) {
      setLoading(false);
      return;
    }
    if (listen) {
      const unsubscribe = listenToCollection(
        collectionName,
        constraints,
        (documents) => {
          setData(documents);
          setLoading(false);
          setError(null);
        }
      );

      return unsubscribe;
    } else {
      fetchDocuments();
    }
  }, [collectionName, constraints, listen, enabled, fetchDocuments]);

  return {
    data,
    loading,
    error,
    addDocument,
    refetch: fetchDocuments,
  };
};

/**
 * Hook for creating documents
 * @param {string} collectionName - Name of the collection
 * @returns {Object} Create function and loading state
 */
export const useCreateDocument = (collectionName) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(
    async (documentData) => {
      try {
        setLoading(true);
        setError(null);
        const result = await createDocument(collectionName, documentData);

        if (!result.success) {
          setError(result.error);
        }

        return result;
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return {
    create,
    loading,
    error,
  };
};

/**
 * Hook for updating documents
 * @param {string} collectionName - Name of the collection
 * @returns {Object} Update function and loading state
 */
export const useUpdateDocument = (collectionName) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(
    async (documentId, updateData) => {
      try {
        setLoading(true);
        setError(null);
        const result = await updateDocument(
          collectionName,
          documentId,
          updateData
        );

        if (!result.success) {
          setError(result.error);
        }

        return result;
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return {
    update,
    loading,
    error,
  };
};

/**
 * Hook for deleting documents
 * @param {string} collectionName - Name of the collection
 * @returns {Object} Delete function and loading state
 */
export const useDeleteDocument = (collectionName) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const remove = useCallback(
    async (documentId) => {
      try {
        setLoading(true);
        setError(null);
        const result = await deleteDocument(collectionName, documentId);

        if (!result.success) {
          setError(result.error);
        }

        return result;
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [collectionName]
  );

  return {
    remove,
    loading,
    error,
  };
};
