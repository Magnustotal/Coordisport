"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { User } from "firebase/auth";

export interface Hijo {
  id: string;
  nombre: string;
  apellidos: string;
  fotoURL?: string;
  [key: string]: any; // Admite campos extra
}

export function useMisHijos(user: User | null) {
  const [hijos, setHijos] = useState<Hijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user) {
      setHijos([]);
      setLoading(false);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    getDocs(collection(db, "usuarios", user.uid, "hijos"))
      .then((snap) => setHijos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))))
      .catch(() => setError("No se pudieron cargar los hijos."))
      .finally(() => setLoading(false));
  }, [user]);

  return { hijos, loading, error, setHijos };
}
