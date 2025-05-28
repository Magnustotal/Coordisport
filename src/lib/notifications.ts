import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
}

/**
 * Obtiene todas las notificaciones de un usuario, ordenadas por fecha descendente.
 */
export async function getNotificationsForUser(
  userId: string
): Promise<Notification[]> {
  const q = query(
    collection(db, "notificaciones"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Notification, "id">),
  }));
}

/**
 * Marca una notificación como leída.
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<void> {
  const ref = doc(db, "notificaciones", notificationId);
  await updateDoc(ref, { read: true });
}

/**
 * Crea una nueva notificación para un usuario.
 */
export async function addNotification(
  userId: string,
  message: string
): Promise<void> {
  await addDoc(collection(db, "notificaciones"), {
    userId,
    message,
    createdAt: Timestamp.now(),
    read: false,
  });
}
