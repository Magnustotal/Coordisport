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

export default function EditarPerfilPadre() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [perfil, setPerfil] = useState<PadrePerfil>({
    nombre: "",
    apellidos: "",
    telefono: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);

      try {
        const snap = await getDoc(doc(db, "usuarios", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.rol === "padre") {
            setPerfil({
              nombre: data.nombre || "",
              apellidos: data.apellidos || "",
              telefono: data.telefono || "",
            });
          } else {
            router.push("/perfil");
          }
        }
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        setError("Error al cargar tu perfil.");
      } finally {
        setLoading(false);
      }

      setTimeout(() => inputRef.current?.focus(), 120);
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
      setTimeout(() => router.push("/perfil/padre"), 1400);
    } catch (err: any) {
      setError("Error al guardar el perfil: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: "center", mt: 8 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Cargando perfil...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: isMobile ? 6 : 10, mb: 6 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42 }}
      >
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2.5, sm: 5 },
            borderRadius: 4,
            boxShadow: 5,
            maxWidth: 520,
            mx: "auto",
          }}
        >
          <Fade in timeout={650}>
            <Box sx={{ textAlign: "center", mb: 3 }}>
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
                <FamilyRestroomIcon sx={{ fontSize: 42, color: "#fff" }} />
              </Avatar>
              <Typography variant="h5" gutterBottom fontWeight={800}>
                Editar perfil de padre/madre
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 330, mx: "auto" }}>
                Actualiza tus datos personales de contacto
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
                aria-label="Guardar cambios"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
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
          Perfil actualizado correctamente
        </Alert>
      </Snackbar>
    </Container>
  );
}
