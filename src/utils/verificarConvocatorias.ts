// src/utils/verificarConvocatorias.ts
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import dayjs from "dayjs";

export const verificarConvocatoriasInactivas = async () => {
  const snap = await getDocs(query(collection(db, "convocatorias")));
  const ahora = dayjs();

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const ref = doc(db, "convocatorias", docSnap.id);

    if (data.estado === "pendiente" && data.fecha_limite) {
      const fechaLimite = dayjs(data.fecha_limite.toDate());
      const diff = ahora.diff(fechaLimite, "hour");

      if (diff >= 2 && data.avisado) {
        // Cancelamos y buscamos reserva
        await updateDoc(ref, { estado: "cancelado", timestamp: serverTimestamp() });

        const reservasSnap = await getDocs(
          query(
            collection(db, "convocatorias"),
            where("evento_id", "==", data.evento_id),
            where("tipo", "==", "reserva"),
            where("estado", "==", "pendiente"),
            orderBy("timestamp")
          )
        );

        if (!reservasSnap.empty) {
          const reserva = reservasSnap.docs[0];
          await updateDoc(doc(db, "convocatorias", reserva.id), {
            tipo: "titular",
            timestamp: serverTimestamp()
          });
        }

      } else if (diff >= 0 && !data.avisado) {
        await updateDoc(ref, { avisado: true });
        console.log(`Recordatorio enviado a jugador ${data.jugador_id}`);
      }
    }
  }

  console.log("Verificación de convocatorias completada.");
};
