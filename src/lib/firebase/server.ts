'use server';

import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';
import { firebaseConfig as clientFirebaseConfig } from '@/lib/firebase/config';

const firebaseConfig: FirebaseOptions = {
    credential: credential.applicationDefault(),
    projectId: clientFirebaseConfig.projectId,
};

export async function getSdks() {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return {
        firestore: getFirestore(app),
    };
}
