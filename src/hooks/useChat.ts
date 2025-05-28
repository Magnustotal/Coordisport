// src/hooks/useChat.ts
"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { PerfilUsuario } from "./useUser";

export interface Mensaje {
  id: string;
  autor_id: string;
  autor_nombre: string;
  mensaje: string;
  timestamp: any;
}

export function useChat(eventoId: string, perfil: PerfilUsuario | null) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  useEffect(() => {
    if (!eventoId) return;
    const q = query(
      collection(db, "mensajes"),
      where("evento_id", "==", eventoId),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nuevos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Mensaje[];

      // Filtramos mensajes de eventos antiguos (más de 7 días)
      const ahora = Date.now();
      const recientes = nuevos.filter(
        (m) => ahora - m.timestamp?.toMillis() < 1000 * 60 * 60 * 24 * 7
      );

      setMensajes(recientes);
    });

    return () => unsubscribe();
  }, [eventoId]);

  const enviarMensaje = async (mensaje: string) => {
    if (!auth.currentUser || !perfil) return;

    await addDoc(collection(db, "mensajes"), {
      evento_id: eventoId,
      autor_id: perfil.id,
      autor_nombre: perfil.nombre,
      mensaje,
      timestamp: serverTimestamp(),
    });
  };

  return { mensajes, enviarMensaje };
}
