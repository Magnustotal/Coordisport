import { NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDB.collection("usuarios").get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("🔥 Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}
