"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Container,
  Typography,
  Paper,
  Box,
  Stack,
  Avatar,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  useTheme,
  useMediaQuery,
  Fade,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

export default function PerfilPadrePage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [perfil, setPerfil] = useState<any>(null);
  const [hijosCount, setHijosCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        // Cargo perfil
        const userRef = doc(db, "usuarios", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          setError("Perfil no encontrado.");
          setLoading(false);
          return;
        }
        const data = snap.data();
        if (data.rol !== "padre") {
          router.replace("/perfil");
          return;
        }
        setPerfil({ ...data, email: user.email });

        // Cuento hijos
        const hijosSnap = await getDocs(collection(db, "usuarios", user.uid, "hijos"));
        setHijosCount(hijosSnap.size);
      } catch (e: any) {
        console.error(e);
        setError("Error al cargar tu perfil.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: 'calc(100vh - 64px)', mt: { xs: 4, md: 6 }, mb: 7 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper elevation={5} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, boxShadow: 4 }}>
          <Fade in timeout={600}>
            <Box textAlign="center" mb={3}>
              <Avatar
                sx={{
                  width: 78,
                  height: 78,
                  bgcolor: "primary.main",
                  mx: "auto",
                  mb: 2,
                  boxShadow: 2,
                }}
              >
                <FamilyRestroomIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" fontWeight={800} letterSpacing={0.3}>
                Perfil Padre/Madre
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: "1.08rem" }}>
                Tus datos y tus hijos asociados
              </Typography>
            </Box>
          </Fade>

          <Divider sx={{ my: 2 }} />

          {/* Datos personales */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
              mb: 2,
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Datos personales
            </Typography>
            <Stack spacing={1}>
              {perfil.nombre && (
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography fontWeight={600}>{perfil.nombre}</Typography>
                </Box>
              )}
              {perfil.apellidos && (
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonOutlineIcon fontSize="small" color="action" />
                  <Typography>{perfil.apellidos}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* Contacto */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
              mb: 2,
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Contacto
            </Typography>
            <Stack spacing={1}>
              {perfil.telefono && (
                <Box display="flex" alignItems="center" gap={1}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography>{perfil.telefono}</Typography>
                </Box>
              )}
              <Box display="flex" alignItems="center" gap={1}>
                <EmailIcon fontSize="small" color="action" />
                <Typography>{perfil.email || "—"}</Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Hijos asociados */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
              mb: 2,
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Hijos asociados
            </Typography>
            <Stack spacing={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <FamilyRestroomIcon fontSize="small" color="action" />
                <Typography>
                  {hijosCount === 0
                    ? "No tienes hijos registrados"
                    : `${hijosCount} hijo${hijosCount > 1 ? "s" : ""}`}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Si no hay hijos, invitación a agregar */}
          {hijosCount === 0 && (
            <Alert
              severity="info"
              icon={<AddIcon />}
              sx={{ mb: 2, borderRadius: 2 }}
              action={
                <Button
                  size="small"
                  color="inherit"
                  variant="outlined"
                  onClick={() => router.push("/agregar-hijo")}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                >
                  Añadir hijo/a
                </Button>
              }
            >
              No tienes ningún hijo asociado todavía.
            </Alert>
          )}

          <Box textAlign="right" mt={2}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => router.push("/perfil/padre/editar")}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                py: 1.2,
                boxShadow: 2,
              }}
            >
              Editar perfil
            </Button>
          </Box>
        </Paper>
      </motion.div>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Container>
  );
}
