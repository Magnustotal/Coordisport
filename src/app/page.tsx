"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { CircularProgress, Box, Typography, Paper } from "@mui/material";

type RolUsuario = "padre" | "entrenador" | "admin" | null;

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("Cargando tu sesión...");

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isMounted) {
          setMensaje("Redirigiendo a inicio de sesión...");
          router.replace("/login");
        }
        return;
      }

      try {
        const userRef = doc(db, "usuarios", user.uid);
        const userSnap = await getDoc(userRef);
        const rol: RolUsuario = userSnap.exists() ? userSnap.data()?.rol || null : null;

        if (!rol) {
          if (isMounted) {
            setMensaje("Completa tu perfil para continuar...");
            router.replace("/completar-perfil");
          }
        } else {
          if (isMounted) {
            setMensaje("Redirigiendo a tu panel...");
            router.replace("/perfil");
          }
        }
      } catch (error) {
        console.error("Error en redirección inicial:", error);
        if (isMounted) {
          setMensaje("Error al cargar tus datos. Redirigiendo a inicio de sesión...");
          router.replace("/login");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router]);

  return (
    <Box
      component="main"
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ backgroundColor: "background.default" }}
      aria-busy={loading}
      aria-label="Pantalla de carga"
    >
      <Paper
        elevation={4}
        sx={{
          p: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <CircularProgress color="primary" aria-busy={loading} />
        <Typography variant="h5" fontWeight={700} mt={2}>
          CoordiSport
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          {mensaje}
        </Typography>
      </Paper>
    </Box>
  );
}
