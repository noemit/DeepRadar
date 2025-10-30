const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();

// Basic user document creation when a new user signs up
exports.createUserDocument = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;

  try {
    // Create a basic user document
    await db
      .collection("users")
      .doc(uid)
      .set({
        email: email,
        displayName: displayName || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // Basic user settings
        settings: {
          theme: "light",
          notifications: true,
          language: "en",
        },
      });

    functions.logger.info("user.doc.created", { email, uid });
    return { success: true };
  } catch (error) {
    functions.logger.error("user.doc.create.error", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Update user document when user profile changes
exports.updateUserDocument = functions.auth.user().onUpdate(async (user) => {
  const { uid, email, displayName } = user;

  try {
    await db
      .collection("users")
      .doc(uid)
      .update({
        email: email,
        displayName: displayName || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    functions.logger.info("user.doc.updated", { email, uid });
    return { success: true };
  } catch (error) {
    functions.logger.error("user.doc.update.error", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Delete user document when user is deleted
exports.deleteUserDocument = functions.auth.user().onDelete(async (user) => {
  const { uid } = user;

  try {
    // Delete user document
    await db.collection("users").doc(uid).delete();

    // Optionally delete other user-related data
    // You can add more cleanup logic here as needed

    functions.logger.info("user.doc.deleted", { uid });
    return { success: true };
  } catch (error) {
    functions.logger.error("user.doc.delete.error", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Example: Track document creation counts (generic)
exports.trackDocumentCount = functions.firestore
  .document("{collection}/{documentId}")
  .onCreate(async (snapshot, context) => {
    try {
      const collectionName = context.params.collection;
      const documentData = snapshot.data();

      // Only track if it's a user-related collection
      if (documentData.userId && collectionName !== "users") {
        const userId = documentData.userId;
        const userRef = db.collection("users").doc(userId);

        // Update user's document count
        await userRef.update({
          [`${collectionName}Count`]: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info("doc.count.incremented", {
          collection: collectionName,
          userId,
        });
      }

      return { success: true };
    } catch (error) {
      functions.logger.error("doc.count.update.error", error);
      // Don't throw error for tracking functions to avoid breaking main functionality
      return { success: false, error: error.message };
    }
  });

// Example: Track document deletion counts (generic)
exports.trackDocumentDeletion = functions.firestore
  .document("{collection}/{documentId}")
  .onDelete(async (snapshot, context) => {
    try {
      const collectionName = context.params.collection;
      const documentData = snapshot.data();

      // Only track if it's a user-related collection
      if (documentData.userId && collectionName !== "users") {
        const userId = documentData.userId;
        const userRef = db.collection("users").doc(userId);

        // Update user's document count
        await userRef.update({
          [`${collectionName}Count`]: admin.firestore.FieldValue.increment(-1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info("doc.count.decremented", {
          collection: collectionName,
          userId,
        });
      }

      return { success: true };
    } catch (error) {
      functions.logger.error("doc.count.update.error", error);
      // Don't throw error for tracking functions to avoid breaking main functionality
      return { success: false, error: error.message };
    }
  });

// Example: HTTP function for basic operations
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.json({
    message: "Hello from Firebase Functions!",
    timestamp: new Date().toISOString(),
    function: "helloWorld",
  });
});

// Example: Callable function for authenticated operations
exports.getUserData = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const uid = context.auth.uid;

  try {
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "User document not found"
      );
    }

    return {
      success: true,
      data: userDoc.data(),
    };
  } catch (error) {
    functions.logger.error("user.data.fetch.error", error, { uid });
    throw new functions.https.HttpsError("internal", error.message);
  }
});
