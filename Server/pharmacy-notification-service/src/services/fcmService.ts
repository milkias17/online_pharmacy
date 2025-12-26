import admin from 'firebase-admin';
import { logger } from '../config/logger';

let isInitialized = false;

if (process.env.FIREBASE_CREDENTIALS_JSON) {
  try {
    // Parse the JSON string from Env Variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isInitialized = true;
    logger.info("Firebase Admin Initialized via JSON Env Var");
  } catch (error) {
    logger.error("Firebase Init Failed", error);
  }
} else {
  logger.warn("Running in MOCK FCM mode");
}

export const sendPushNotification = async (
  token: string, 
  title: string, 
  body: string, 
  data?: Record<string, any>
) => {
  if (!isInitialized) {
    logger.info(`[MOCK PUSH] To: ${token} | Title: ${title}`);
    return;
  }

  try {
    // Ensure all data values are strings for FCM
    const stringifiedData = data 
      ? Object.keys(data).reduce((acc, key) => {
          acc[key] = String(data[key]);
          return acc;
        }, {} as Record<string, string>)
      : {};

    await admin.messaging().send({
      token,
      notification: { title, body },
      data: stringifiedData,
    });
  } catch (error) {
    logger.error(`FCM Send Error for token ${token.slice(0, 10)}...`, error);
  }
};