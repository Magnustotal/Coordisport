"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { Alert, Button, Stack } from "@mui/material";
import { useRouter } from "next/navigation";

export default function NotificacionConvocatorias() {
  const [notis, setNotis] = useState<{ hijoNombre: string; eventoId: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    let unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      // 1. Obtener hijos
      const hijosSnap = await getDocs(collection(db, "usuarios", user.uid, "hijos"));
      if (hijosSnap.empty) return;
      const hijos = hijosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 2. Buscar en TODAS las convocatorias si algún hijo está pendiente
      const convocSnap = await getDocs(collection(db, "convocatorias"));
      const notificaciones: { hijoNombre: string; eventoId: string }[] = [];
      for (const convoc of convocSnap.docs) {
        const data = convoc.data();
        // Solo eventos de tipo partido (si quieres filtrar solo partidos)
        if (data.tipo && data.tipo !== "partido") continue;
        for (const hijo of hijos) {
          const esTitularPendiente = Array.isArray(data.titulares) && data.titulares.some(
            (j: any) => j.jugador_id === hijo.id && j.estado === "pendiente"
          );
          const esReservaPendiente = Array.isArray(data.reservas) && data.reservas.some(
            (j: any) => j.jugador_id === hijo.id && j.estado === "pendiente"
          );
          if (esTitularPendiente || esReservaPendiente) {
            notificaciones.push({ hijoNombre: hijo.nombre, eventoId: convoc.id });
          }
        }
      }
      setNotis(notificaciones);
    });
    return () => unsub();
  }, []);

  if (notis.length === 0) return null;

  return (
    <Stack spacing={2} sx={{ my: 2 }}>
      {notis.map((n, i) => (
        <Alert
          key={i}
          severity="info"
          action={
            <Button size="small" variant="outlined" onClick={() => router.push(`/resumen/${n.eventoId}`)}>
              Ver detalles
            </Button>
          }
        >
          ¡Tu hijo/a <strong>{n.hijoNombre}</strong> ha sido convocado para un partido y está pendiente de responder!
        </Alert>
      ))}
    </Stack>
  );
}
