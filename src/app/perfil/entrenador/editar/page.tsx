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
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Avatar,
  Box,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import { motion } from "framer-motion";

const deportes = ["Fútbol", "Baloncesto", "Balonmano", "Voleibol"];

interface EntrenadorPerfil {
  nombre: string;
  apellidos: string;
  telefono: string;
  deporte: string;
}

export default function EditarPerfilEntrenador() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<EntrenadorPerfil>({
    nombre: "",
    apellidos: "",
    telefono: "",
    deporte: "Fútbol",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push("/login");
      setUser(u);

      try {
        const snap = await getDoc(doc(db, "usuarios", u.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.rol === "entrenador") {
            setPerfil({
              nombre: data.nombre || "",
              apellidos: data.apellidos || "",
              telefono: data.telefono || "",
              deporte: data.deporte || "Fútbol",
            });
          } else {
            router.push("/perfil");
          }
        }
      } catch (err) {
        setError("Error al cargar tu perfil.");
      } finally {
        setLoading(false);
      }

      setTimeout(() => inputRef.current?.focus(), 100);
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
          rol: "entrenador",
        },
        { merge: true }
      );

      setSuccess(true);
      setTimeout(() => router.push("/perfil/entrenador"), 1500);
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
    <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 6 } }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Paper
          elevation={5}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 4,
            mt: { xs: 4, sm: 7 },
            maxWidth: 520,
            mx: "auto",
            position: "relative",
            overflow: "visible",
            boxShadow: 6,
          }}
        >
          <Box textAlign="center" mb={2}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "primary.main",
                mx: "auto",
                mt: -7,
                boxShadow: 3,
                mb: 1.5,
                fontSize: 36,
              }}
            >
              <SportsSoccerIcon fontSize="inherit" />
            </Avatar>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Editar Perfil de Entrenador
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              Actualiza tu información personal y de contacto
            </Typography>
          </Box>
          <Stack gap={2.5} mt={3} sx={{ mb: 1.5 }}>
            <TextField
              label="Correo electrónico"
              value={user?.email ?? ""}
              InputProps={{ readOnly: true }}
              fullWidth
              sx={{ bgcolor: "grey.100" }}
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
              autoFocus
            />
            <TextField
              label="Apellidos"
              value={perfil.apellidos}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, apellidos: e.target.value }))
              }
              fullWidth
              required
            />
            <TextField
              label="Teléfono"
              value={perfil.telefono}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, telefono: e.target.value }))
              }
              fullWidth
              required
              inputProps={{ maxLength: 9, inputMode: "numeric" }}
              helperText="Introduce tu número de móvil (9 dígitos)"
            />
            <TextField
              select
              label="Deporte que entrenas"
              value={perfil.deporte}
              onChange={(e) =>
                setPerfil((prev) => ({ ...prev, deporte: e.target.value }))
              }
              fullWidth
            >
              {deportes.map((dep) => (
                <MenuItem key={dep} value={dep}>
                  {dep}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => router.back()}
              disabled={guardando}
              sx={{
                minWidth: 120,
                borderRadius: 3,
                fontWeight: 500,
                fontSize: "1rem",
                bgcolor: "grey.50",
                boxShadow: 1,
                "&:hover": {
                  bgcolor: "grey.100",
                  boxShadow: 3,
                },
              }}
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
                minWidth: 160,
                borderRadius: 3,
                fontWeight: 700,
                fontSize: "1rem",
                boxShadow: 3,
                "&:hover": {
                  boxShadow: 5,
                  transform: "scale(1.03)",
                },
              }}
            >
              {guardando ? "Guardando..." : "Guardar cambios"}
            </Button>
          </Stack>
        </Paper>
      </motion.div>

      <Snackbar
        open={!!error}
        autoHideDuration={3500}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        TransitionComponent={Fade}
      >
        <Alert severity="error" sx={{ fontWeight: 500 }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={2500}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        TransitionComponent={Fade}
      >
        <Alert severity="success" sx={{ fontWeight: 600 }}>
          Perfil actualizado correctamente
        </Alert>
      </Snackbar>
    </Container>
  );
}
