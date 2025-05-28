// src/app/lib/firebase.ts

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración del proyecto Firebase
// Es MUY recomendable usar variables de entorno para las claves de API, etc.
// como lo tenías en tu archivo .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa Firebase solo si aún no está inicializado
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase client SDK inicializado.");
} else {
  app = getApp();
  // console.log("Firebase client SDK ya estaba inicializado."); // Puedes comentar esto si es muy verboso
}

// Exportación de servicios de Firebase
export const auth = getAuth(app);
// Conéctate a la base de datos (default)
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("Cliente Firebase inicializado, apuntando a la base de datos (default) del proyecto:", firebaseConfig.projectId);

