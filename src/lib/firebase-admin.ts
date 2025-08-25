import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
} else {
  adminApp = getApps()[0];
}

const app = getApps()[0] ?? initializeApp({
  credential: cert({
    projectId: process.env.FB_PROJECT_ID!,
    clientEmail: process.env.FB_CLIENT_EMAIL!,
    privateKey: (process.env.FB_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  }),
});

export const adminDb = getFirestore(app);

// Auth
export const adminAuth = getAuth(adminApp);