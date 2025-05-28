// src/lib/firestore-convocatorias.ts
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export const obtenerConvocatoria = async (eventoId: string, jugadorId: string) => {
  const q = query(
    collection(db, "convocatorias"),
    where("evento_id", "==", eventoId),
    where("jugador_id", "==", jugadorId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  return null;
};

export const actualizarEstadoConvocatoria = async (
  eventoId: string,
  jugadorId: string,
  estado: "confirmado" | "rechazado"
) => {
  const existente = await obtenerConvocatoria(eventoId, jugadorId);
  if (existente) {
    await updateDoc(doc(db, "convocatorias", existente.id), {
      estado,
      timestamp: serverTimestamp(),
    });
  } else {
    await addDoc(collection(db, "convocatorias"), {
      evento_id: eventoId,
      jugador_id: jugadorId,
      estado,
      timestamp: serverTimestamp(),
    });
  }
};
