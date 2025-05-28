"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  useMediaQuery,
  Avatar,
  Fade,
  useTheme,
} from "@mui/material";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { onAuthStateChanged, User } from "firebase/auth";
import { motion } from "framer-motion";

export default function CompletarPerfil() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const padreBtnRef = useRef<HTMLButtonElement>(null);
  const entrenadorBtnRef = useRef<HTMLButtonElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [redirigiendo, setRedirigiendo] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      try {
        const ref = doc(db, "usuarios", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().rol) {
          setRedirigiendo(true);
          const rol = snap.data().rol;
          const destino =
            rol === "padre"
              ? "/perfil/padre"
              : rol === "entrenador"
              ? "/perfil/entrenador"
              : "/perfil";
          router.replace(destino);
        } else {
          setLoading(false);
          setTimeout(() => padreBtnRef.current?.focus(), 300);
        }
      } catch (err) {
        console.error("Error al verificar rol:", err);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const seleccionarRol = async (rol: "padre" | "entrenador") => {
    if (!user) {
      setError("Usuario no autenticado.");
      return;
    }
    setGuardando(true);
    try {
      await setDoc(doc(db, "usuarios", user.uid), { rol }, { merge: true });
      localStorage.setItem("rolCoordiSport", rol);
      const destino =
        rol === "padre"
          ? "/completar-perfil-padre"
          : "/completar-perfil-entrenador";
      router.push(destino);
    } catch (err) {
      console.error("Error al guardar el rol:", err);
      setError("No se pudo guardar el rol. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  if (loading || redirigiendo) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.palette.background.default,
        }}
      >
        <CircularProgress size={38} />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: 'calc(100vh - 64px)', mt: isMobile ? 5 : 10, mb: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Paper
          elevation={5}
          sx={{
            p: { xs: 2.5, sm: 5 },
            borderRadius: 4,
            mt: { xs: 4, sm: 8 },
            boxShadow: 5,
            maxWidth: 520,
            mx: "auto",
          }}
        >
          <Fade in timeout={700}>
            <Box sx={{ textAlign: "center", mb: 5 }}>
              <Avatar
                sx={{
                  mx: "auto",
                  width: 76,
                  height: 76,
                  mb: 2,
                  bgcolor: "primary.main",
                  boxShadow: 2,
                }}
              >
                <AccountCircleIcon sx={{ fontSize: 50 }} />
              </Avatar>
              <Typography variant="h5" gutterBottom fontWeight={800} letterSpacing={0.3}>
                {user?.displayName
                  ? `¡Hola, ${user.displayName.split(" ")[0]}! 👋`
                  : "¿Quién eres?"}
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 320, mx: "auto" }}>
                Selecciona el tipo de usuario para completar tu perfil en CoordiSport
              </Typography>
            </Box>
          </Fade>

          <Stack spacing={3}>
            <Button
              ref={padreBtnRef}
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              startIcon={<FamilyRestroomIcon />}
              onClick={() => seleccionarRol("padre")}
              disabled={guardando}
              sx={{
                py: 1.6,
                fontWeight: 700,
                fontSize: "1.08rem",
                boxShadow: 2,
                transition: "box-shadow 0.17s, background 0.17s",
                "&:hover": {
                  background: theme.palette.primary.dark,
                  boxShadow: 4,
                },
              }}
            >
              Soy padre o madre
            </Button>

            <Button
              ref={entrenadorBtnRef}
              variant="outlined"
              color="secondary"
              fullWidth
              size="large"
              startIcon={<SupervisorAccountIcon />}
              onClick={() => seleccionarRol("entrenador")}
              disabled={guardando}
              sx={{
                py: 1.6,
                fontWeight: 700,
                fontSize: "1.08rem",
                borderWidth: 2,
                letterSpacing: 0.1,
                "&:hover": {
                  borderWidth: 2,
                  background: theme.palette.secondary.light,
                },
              }}
            >
              Soy entrenador/a
            </Button>
          </Stack>
        </Paper>
      </motion.div>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}
