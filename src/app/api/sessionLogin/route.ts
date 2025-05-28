import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, AppOptions } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// ⚠️ Variables desde entorno
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Soporte para \n en claves privadas multi-línea (Vercel/Next)
if (privateKey?.includes("\\n")) {
  privateKey = privateKey.replace(/\\n/g, "\n");
}

// Validación segura de variables obligatorias
if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Faltan variables de entorno para Firebase Admin. Revisa FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY."
  );
}

// Inicialización idempotente de Firebase Admin SDK
if (!getApps().length) {
  const options: AppOptions = {
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  };
  initializeApp(options);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body?.idToken;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "ID token inválido" }, { status: 400 });
    }

    // Duración de la cookie: 5 días
    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // Crear cookie de sesión segura
    const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true });

    // Configuración de cookie según entorno (secure solo en producción)
    response.cookies.set("__session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Cookie __session creada correctamente (desarrollo)");
    }

    return response;
  } catch (error: any) {
    console.error("❌ Error en /api/sessionLogin:", error);
    return NextResponse.json(
      { error: "Fallo al crear la sesión" },
      { status: 401 }
    );
  }
}
