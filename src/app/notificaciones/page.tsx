"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import { auth } from "@/lib/firebase";
import {
  getNotificationsForUser,
  markNotificationAsRead,
  Notification,
} from "@/lib/notifications";

dayjs.locale("es");

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // 1️⃣ Autenticación y carga de notificaciones
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login");
      } else {
        setUser(u);
        loadNotifications(u.uid);
      }
    });
    return () => unsub();
  }, [router]);

  // 2️⃣ Función para cargar notificaciones
  async function loadNotifications(uid: string) {
    setLoading(true);
    try {
      const nots = await getNotificationsForUser(uid);
      setNotifications(nots);
    } catch (e: any) {
      setError("Error al cargar notificaciones: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // 3️⃣ Marcar como leída
  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e: any) {
      setError("No se pudo marcar como leída: " + e.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" gutterBottom>
        Notificaciones
      </Typography>
      {notifications.length === 0 ? (
        <Alert severity="info">No tienes notificaciones</Alert>
      ) : (
        <List>
          {notifications.map((n) => (
            <React.Fragment key={n.id}>
              <ListItem
                secondaryAction={
                  !n.read && (
                    <IconButton
                      edge="end"
                      aria-label="marcar leído"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      <DoneIcon />
                    </IconButton>
                  )
                }
                sx={{
                  backgroundColor: n.read ? "transparent" : "rgba(0,0,255,0.05)",
                }}
              >
                <ListItemText
                  primary={n.message}
                  secondary={dayjs(n.createdAt.toDate()).format(
                    "DD-MM-YYYY HH:mm"
                  )}
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Container>
  );
}
