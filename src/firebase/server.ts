import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

const firebaseConfig: FirebaseOptions = {
    credential: credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export function getSdks() {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return {
        firestore: getFirestore(app),
    };
}
