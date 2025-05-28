// src/hooks/useEquipo.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export interface DatosEquipo {
  id: string;
  nombre: string;
  categoria: string;
  campo_local: string;
  // Puedes añadir más campos si tu modelo de Firestore lo requiere
}

export function useEquipo(equipoId?: string) {
  const [equipo, setEquipo] = useState<DatosEquipo | null>(null);
  const [loading, setLoading] = useState<boolean>(!!equipoId);
  const [error, setError] = useState<string | null>(null);

  const fetchEquipo = useCallback(async () => {
    if (!equipoId) {
      setEquipo(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ref = doc(db, "equipos", equipoId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setEquipo({ id: snap.id, ...snap.data() } as DatosEquipo);
      } else {
        setEquipo(null);
        setError("Equipo no encontrado.");
      }
    } catch (err) {
      setEquipo(null);
      setError("Error al cargar el equipo.");
    } finally {
      setLoading(false);
    }
  }, [equipoId]);

  useEffect(() => {
    fetchEquipo();
  }, [fetchEquipo]);

  return { equipo, loading, error, reload: fetchEquipo };
}
