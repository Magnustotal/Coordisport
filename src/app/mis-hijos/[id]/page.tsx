"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Container,
  Paper,
  Typography,
  Box,
  Stack,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
  useTheme,
} from "@mui/material";
import {
  FamilyRestroom as FamilyIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  SportsSoccer as SportIcon,
  Edit as EditIcon,
  Groups as GroupIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

export default function HijoFichaPage() {
  const { id } = useParams();
  const router = useRouter();
  const theme = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [hijo, setHijo] = useState<any>(null);
  const [equipoNombre, setEquipoNombre] = useState<string>("");
  const [fechaFmt, setFechaFmt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (usr) => {
      if (!usr) {
        router.replace("/login");
        return;
      }
      setUser(usr);

      try {
        const ref = doc(db, "usuarios", usr.uid, "hijos", id as string);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Ficha no encontrada.");
          setLoading(false);
          return;
        }
        const data = snap.data();
        setHijo(data);

        // FECHA
        if (data.fechaNac) {
          const dt = new Date(data.fechaNac);
          setFechaFmt(
            isNaN(dt.getTime())
              ? "Fecha no válida"
              : dt.toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
          );
        } else {
          setFechaFmt("Fecha no registrada");
        }

        // EQUIPO: buscar nombre si hay equipoId
        if (data.equipoId) {
          try {
            const eqSnap = await getDoc(doc(db, "equipos", data.equipoId));
            setEquipoNombre(eqSnap.exists() ? eqSnap.data().nombre : "Equipo no encontrado");
          } catch {
            setEquipoNombre("Equipo no encontrado");
          }
        } else {
          setEquipoNombre("No asignado");
        }
      } catch (e: any) {
        setError("Error al cargar la ficha.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [id, router]);

  if (loading) {
    return (
      <Container sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!hijo) {
    return (
      <Container sx={{ mt: 6 }}>
        <Alert severity="error">Ficha no encontrada.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 4, md: 6 }, mb: 6 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
          <Box textAlign="center" mb={3}>
            <Avatar sx={{ bgcolor: "primary.main", width: 76, height: 76, mx: "auto", mb: 2 }}>
              <FamilyIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" fontWeight={800}>
              Ficha de {hijo.nombre} {hijo.apellidos}
            </Typography>
            {hijo.fotoURL && (
              <Avatar
                src={hijo.fotoURL}
                sx={{ width: 110, height: 110, mx: "auto", my: 2, border: "2px solid #eee" }}
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50", mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Datos personales
            </Typography>
            <Stack spacing={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon fontSize="small" color="action" />
                <Typography>
                  {hijo.nombre} {hijo.apellidos}
                </Typography>
              </Box>
              {hijo.camiseta && (
                <Typography variant="body2" color="text.secondary">
                  Nombre en camiseta: {hijo.camiseta}
                </Typography>
              )}
              {hijo.dorsal != null && hijo.dorsal !== "" && (
                <Typography variant="body2" color="text.secondary">
                  Dorsal: {hijo.dorsal}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Documento: {hijo.docTipo} {hijo.docValor}
              </Typography>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50", mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Deporte y Categoría
            </Typography>
            <Stack spacing={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <SportIcon fontSize="small" color="action" />
                <Typography>Deporte: {hijo.deporte}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Categoría: {hijo.categoria}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarIcon fontSize="small" color="action" />
                <Typography>Fecha nacimiento: {fechaFmt}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50", mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Equipo asignado
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <GroupIcon fontSize="small" color="primary" />
              <Typography>{equipoNombre}</Typography>
            </Box>
          </Paper>

          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button variant="outlined" onClick={() => router.back()}>
              Volver
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => router.push(`/mis-hijos/${id}/editar`)}
            >
              Editar
            </Button>
          </Box>
        </Paper>
      </motion.div>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Container>
  );
}
