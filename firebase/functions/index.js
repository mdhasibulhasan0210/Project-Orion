const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

exports.signCommand = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { deviceId, command, params } = data;
  if (!deviceId || !command) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing deviceId or command.');
  }

  const userId = context.auth.uid;

  // Verify user owns this device
  const deviceSnap = await admin.firestore().collection('devices').doc(deviceId).get();
  if (!deviceSnap.exists || deviceSnap.data().userId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Device not found or not owned by user.');
  }

  // Get user's secret key from settings
  const settingsSnap = await admin.firestore().collection('settings').doc(userId).get();
  let secretKey = settingsSnap.exists ? settingsSnap.data().secretKey : null;

  if (!secretKey) {
    // Generate a new secret key if it doesn't exist (for first time use)
    secretKey = crypto.randomBytes(32).toString('hex');
    await admin.firestore().collection('settings').doc(userId).set({ secretKey }, { merge: true });
  }

  const timestamp = Date.now();
  const payload = `${deviceId}:${command}:${timestamp}`;
  const signature = crypto.createHmac('sha256', secretKey).update(payload).digest('hex');

  // We return the signed payload to the client so the client can write to Firestore,
  // OR we can just write it directly from here and return success.
  // The prompt says: "Dashboard calls this function, gets signed payload, writes to Firestore."

  return {
    deviceId,
    command,
    params: params || {},
    timestamp,
    signature,
    status: 'pending'
  };
});
