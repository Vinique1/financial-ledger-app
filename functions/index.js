const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Cloud Function that triggers when a document in the 'user_profiles' collection is written.
 * It reads the 'role' from the document and sets it as a custom claim on the user's
 * Firebase Auth token. This allows security rules to leverage the role for authorization.
 */
exports.setUserRoleClaim = functions.firestore
  .document("user_profiles/{userId}")
  .onWrite(async (change, context) => {
    const data = change.after.data();
    const userId = context.params.userId;

    // Exit if there's no data or role defined.
    if (!data || !data.role) {
      console.log(`No role found for user ${userId}. Skipping claim update.`);
      return null;
    }

    try {
      const user = await admin.auth().getUser(userId);

      // Only set the claim if it's different from the existing one to avoid unnecessary updates.
      if (user.customClaims && user.customClaims.role === data.role) {
        console.log(`Role for user ${userId} is already set to '${data.role}'. No update needed.`);
        return null;
      }

      console.log(`Setting custom claim for user ${userId} to role: ${data.role}`);
      await admin.auth().setCustomUserClaims(userId, { role: data.role });

      return null;
    } catch (error) {
      console.error(`Error setting custom claim for user ${userId}:`, error);
      return null;
    }
  });
