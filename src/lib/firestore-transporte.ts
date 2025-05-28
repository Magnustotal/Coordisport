// src/lib/firestore-transporte.ts
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
  arrayUnion
} from "firebase/firestore";

export const obtenerTransporteUsuario = async (eventoId: string, usuarioId: string) => {
  const q = query(
    collection(db, "transportes"),
    where("evento_id", "==", eventoId),
    where("usuario_id", "==", usuarioId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  return null;
};

export const registrarTransporte = async (
  eventoId: string,
  usuarioId: string,
  tipo: "ofrece" | "necesita",
  plazas: number,
  punto_encuentro: string
) => {
  const nuevo = {
    evento_id: eventoId,
    usuario_id,
    tipo,
    plazas,
    estado: "pendiente",
    asignados: [],
    punto_encuentro,
    timestamp: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "transportes"), nuevo);

  if (tipo === "necesita") {
    await intentarAsignarTransporte(eventoId, usuarioId, plazas, docRef.id);
  }

  return docRef;
};

export const intentarAsignarTransporte = async (
  eventoId: string,
  solicitanteId: string,
  plazasNecesarias: number,
  solicitudId: string
) => {
  const q = query(
    collection(db, "transportes"),
    where("evento_id", "==", eventoId),
    where("tipo", "==", "ofrece"),
    where("estado", "==", "pendiente")
  );

  const snap = await getDocs(q);

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const plazasDisponibles = data.plazas - (data.asignados?.length || 0);

    if (plazasDisponibles >= plazasNecesarias) {
      await updateDoc(doc(db, "transportes", docSnap.id), {
        asignados: arrayUnion(solicitanteId),
        estado: "asignado",
      });

      await updateDoc(doc(db, "transportes", solicitudId), { estado: "asignado" });
      break;
    }
  }
};
