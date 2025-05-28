import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Faltan variables de entorno para Firebase Admin.");
}

if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1).replace(/\\n/g, "\n");
}

const app: App =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
    : getApps()[0];

const adminDB = getFirestore(app);

export { adminDB };
