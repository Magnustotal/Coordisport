// src/hooks/useUser.ts
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface PerfilUsuario {
  id: string;
  nombre: string;
  correo: string;
  rol: "padre" | "entrenador" | "admin";
  hijos?: string[]; // lista de IDs de jugadores vinculados
  equipos_asignados?: string[]; // en caso de entrenador
}

export function useUser() {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarPerfil = async () => {
      const user = auth.currentUser;
      if (!user) {
        setPerfil(null);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "usuarios", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setPerfil({ id: snap.id, ...snap.data() } as PerfilUsuario);
        } else {
          setPerfil(null);
        }
      } catch {
        setPerfil(null);
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, []);

  return { perfil, loading };
}
