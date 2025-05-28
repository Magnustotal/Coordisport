"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const crearCookieSesion = async () => {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error("No se pudo obtener el token");
    await fetch("/api/sessionLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });
  };

  // Lógica para comprobar perfil tras login y redirigir correctamente
  const comprobarPerfilYRedirigir = async (uid: string) => {
    try {
      const perfilRef = doc(db, "usuarios", uid);
      const perfilSnap = await getDoc(perfilRef);

      if (!perfilSnap.exists()) {
        router.push("/completar-perfil");
        return;
      }

      const perfil = perfilSnap.data();
      if (!perfil.rol) {
        router.push("/completar-perfil");
        return;
      }

      if (perfil.rol === "entrenador") {
        if (!perfil.nombre || !perfil.telefono || !perfil.deporte) {
          router.push("/completar-perfil-entrenador");
          return;
        }
      }
      if (perfil.rol === "padre") {
        if (!perfil.nombre || !perfil.telefono) {
          router.push("/completar-perfil-padre");
          return;
        }
      }

      // Si todo está completo, redirigir a /eventos
      router.push("/eventos");
    } catch (e: any) {
      setError("Error verificando tu perfil tras el login. " + e.message);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await crearCookieSesion();
      await comprobarPerfilYRedirigir(userCredential.user.uid);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError("Error al iniciar sesión: " + err.message);
      setLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await crearCookieSesion();
      await comprobarPerfilYRedirigir(userCredential.user.uid);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError("Error al registrarse: " + err.message);
      setLoading(false);
      return false;
    }
  };

  const googleLogin = async (): Promise<boolean> => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await crearCookieSesion();
      await comprobarPerfilYRedirigir(result.user.uid);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError("Error con Google: " + err.message);
      setLoading(false);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError("Error al enviar correo de recuperación: " + err.message);
      setLoading(false);
      return false;
    }
  };

  return {
    login,
    register,
    googleLogin,
    resetPassword,
    loading,
    error,
    setError,
  };
}
