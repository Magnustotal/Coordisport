"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Avatar,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import { motion } from "framer-motion";

interface PadrePerfil {
  nombre: string;
  apellidos: string;
  telefono: string;
}

export default function CompletarPerfilPadre() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PadrePerfil>({
    nombre: "",
    apellidos: "",
    telefono: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [redirigiendo, setRedirigiendo] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      // Comprobar si ya tiene perfil y rol padre, entonces redirigir
      try {
        const ref = doc(db, "usuarios", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.data().rol === "padre") {
          setRedirigiendo(true);
          router.replace("/perfil/padre");
          return;
        }
      } catch (err) {
        // silent, proseguimos
      }
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    });
    return () => unsubscribe();
  }, [router]);

  const validar = (): boolean => {
    if (!perfil.nombre.trim() || !perfil.apellidos.trim() || !perfil.telefono.trim()) {
      setError("Todos los campos son obligatorios.");
      return false;
    }
    if (!/^[0-9]{9}$/.test(perfil.telefono)) {
      setError("El teléfono debe tener 9 dígitos.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("No se ha detectado sesión iniciada.");
      return;
    }
    if (!validar()) return;

    setGuardando(true);
    try {
      const userRef = doc(db, "usuarios", user.uid);
      await setDoc(
        userRef,
        {
          ...perfil,
          rol: "padre",
        },
        { merge: true }
      );
      setSuccess(true);
      setTimeout(() => router.push("/perfil/padre"), 1300);
    } catch (err: any) {
      setError("Error al guardar el perfil: " + err.message);
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
        transition={{ duration: 0.43 }}
      >
        <Paper
          elevation={5}
          sx={{
            p: { xs: 2.5, sm: 5 },
            borderRadius: 4,
            mt: { xs: 4, sm: 7 },
            boxShadow: 5,
            maxWidth: 520,
            mx: "auto",
          }}
        >
          <Fade in timeout={700}>
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Avatar
                sx={{
                  width: 76,
                  height: 76,
                  mx: "auto",
                  mb: 2,
                  bgcolor: "primary.main",
                  boxShadow: 2,
                }}
              >
                <FamilyRestroomIcon sx={{ fontSize: 44, color: "#fff" }} />
              </Avatar>
              <Typography variant="h5" gutterBottom fontWeight={800}>
                Completa tu perfil como padre/madre
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 320, mx: "auto" }}>
                Introduce tus datos personales para continuar
              </Typography>
            </Box>
          </Fade>

          <Box
            component="form"
            display="flex"
            flexDirection="column"
            gap={2.7}
            noValidate
            autoComplete="off"
            sx={{ mb: 0.5 }}
          >
            <TextField
              label="Correo electrónico"
              value={user?.email ?? ""}
              InputProps={{ readOnly: true }}
              fullWidth
              aria-readonly="true"
            />

            <TextField
              label="Nombre"
              inputRef={inputRef}
              value={perfil.nombre}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, nombre: e.target.value }))
              }
              fullWidth
              required
              autoComplete="given-name"
              aria-required="true"
            />

            <TextField
              label="Apellidos"
              value={perfil.apellidos}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, apellidos: e.target.value }))
              }
              fullWidth
              required
              autoComplete="family-name"
              aria-required="true"
            />

            <TextField
              label="Teléfono de contacto"
              type="tel"
              inputProps={{ maxLength: 9, inputMode: "tel" }}
              value={perfil.telefono}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, telefono: e.target.value }))
              }
              fullWidth
              required
              aria-required="true"
              helperText="Introduce tu número de móvil (9 dígitos)"
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => router.back()}
                disabled={guardando}
                sx={{
                  minWidth: 120,
                  borderRadius: 2,
                  fontWeight: 500,
                  fontSize: "1rem",
                  bgcolor: "grey.50",
                }}
                aria-label="Cancelar"
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={guardando}
                endIcon={guardando ? <CircularProgress size={20} /> : undefined}
                sx={{
                  minWidth: 170,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: "1rem",
                  boxShadow: 2,
                }}
                aria-label="Guardar perfil"
              >
                {guardando ? "Guardando..." : "Guardar perfil"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </motion.div>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError("")} sx={{ fontWeight: 500 }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={2500}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ fontWeight: 500 }}>
          Perfil guardado correctamente
        </Alert>
      </Snackbar>
    </Container>
  );
}
