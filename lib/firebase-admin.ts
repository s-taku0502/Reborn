import admin from 'firebase-admin';

function getPrivateKey(): string | undefined {
    const raw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (!raw) return undefined;
    return raw.replace(/\\n/g, '\n');
}

export function getAdminApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = getPrivateKey();

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase Admin 環境変数が未設定です');
    }

    return admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
}

export function getAdminFirestore() {
    return getAdminApp().firestore();
}
