"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Chip,
  Box,
  Stack,
  Divider,
  Alert,
  Snackbar,
  Skeleton,
  useMediaQuery,
  useTheme,
  Avatar,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SchoolIcon from "@mui/icons-material/School";
import PlaceIcon from "@mui/icons-material/Place";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import AddIcon from "@mui/icons-material/Add";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, where, query } from "firebase/firestore";
import dayjs from "dayjs";
import "dayjs/locale/es";
import UniformePreview from "@/components/UniformePreview";
import { motion } from "framer-motion";

dayjs.locale("es");

interface EquipoData {
  id: string;
  nombre: string;
  categoria?: string;
  deporte?: string;
  campo_local?: string;
  equipacion_local?: Record<string, string>;
  equipacion_visitante?: Record<string, string>;
}

type RolUsuario = "padre" | "entrenador" | "admin" | null;

// Hook optimizado para carga de equipos
function useEquipos(uid: string | undefined, role: RolUsuario) {
  const [equipos, setEquipos] = useState<EquipoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!uid || !role) return;

    let ignore = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        let equiposData: EquipoData[] = [];

        if (role === "entrenador") {
          const userSnap = await getDoc(doc(db, "usuarios", uid));
          const equipoIds: string[] = userSnap.data()?.equipos_asignados || [];
          if (equipoIds.length === 0) {
            setEquipos([]);
          } else {
            // Firestore solo permite máximo 10 elementos en un "in"
            const batchSize = 10;
            const docs: EquipoData[] = [];
            for (let i = 0; i < equipoIds.length; i += batchSize) {
              const batchIds = equipoIds.slice(i, i + batchSize);
              const equiposSnap = await getDocs(
                query(collection(db, "equipos"), where("__name__", "in", batchIds))
              );
              equiposSnap.forEach((docu) => {
                docs.push({ id: docu.id, ...docu.data() } as EquipoData);
              });
            }
            equiposData = docs;
          }
        } else if (role === "padre") {
          const hijosSnap = await getDocs(collection(db, "usuarios", uid, "hijos"));
          const equipoIds = hijosSnap.docs
            .map((h) => (h.data() as any).equipo)
            .filter(Boolean);
          if (equipoIds.length === 0) {
            equiposData = [];
          } else {
            // Idem límite de 10
            const batchSize = 10;
            const docs: EquipoData[] = [];
            for (let i = 0; i < equipoIds.length; i += batchSize) {
              const batchIds = equipoIds.slice(i, i + batchSize);
              const equiposSnap = await getDocs(
                query(collection(db, "equipos"), where("__name__", "in", batchIds))
              );
              equiposSnap.forEach((docu) => {
                docs.push({ id: docu.id, ...docu.data() } as EquipoData);
              });
            }
            equiposData = docs;
          }
        } else if (role === "admin") {
          const all = await getDocs(collection(db, "equipos"));
          equiposData = all.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as EquipoData));
        }

        if (!ignore) setEquipos(equiposData);
      } catch (e: any) {
        if (!ignore) setError(e.message || "Error al cargar equipos.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [uid, role]);

  return { equipos, loading, error };
}

export default function EquipoPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [user, setUser] = useState<User | null>(null);
  const [rol, setRol] = useState<RolUsuario>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      const snap = await getDoc(doc(db, "usuarios", u.uid));
      setRol(snap.data()?.rol ?? null);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, [router]);

  const { equipos, loading: loadingEquipos, error: errorEquipos } = useEquipos(
    user?.uid,
    rol
  );

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  useEffect(() => {
    if (errorEquipos) setSnackbarOpen(true);
  }, [errorEquipos]);
  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const renderEquipacion = (
    etiqueta: string,
    equipacion?: Record<string, string>
  ) => {
    if (!equipacion) return null;
    return (
      <Accordion
        elevation={0}
        sx={{
          mb: 1,
          bgcolor: "grey.50",
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 0,
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography
            variant="subtitle2"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontWeight: 600,
              color: theme.palette.secondary.main,
            }}
          >
            <CheckroomIcon fontSize="small" /> Equipación {etiqueta}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 1, pb: 2 }}>
          <UniformePreview
            camiseta={equipacion.camiseta || "#ccc"}
            pantalon={equipacion.pantalon || "#ccc"}
            medias={equipacion.medias || "#ccc"}
            size={isMdUp ? 140 : 110}
          />
        </AccordionDetails>
      </Accordion>
    );
  };

  // Feedback visual durante la carga de usuario o equipos
  if (loadingAuth || loadingEquipos) {
    return (
      <Container
        maxWidth="lg"
        sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 4, md: 6 } }}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress size={48} color="primary" />
        </Box>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {[...Array(6)].map((_, i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton
                variant="rectangular"
                height={260}
                sx={{ borderRadius: 3, mb: 2 }}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 4, md: 6 } }}
    >
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: { xs: 2, md: 4 },
            borderRadius: 3,
            bgcolor: theme.palette.background.paper,
            boxShadow: 1,
          }}
        >
          <Box display="flex" alignItems="center" gap={2} mb={1.5}>
            <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
              <GroupIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant={isMdUp ? "h4" : "h5"} fontWeight={800}>
                {rol === "padre"
                  ? "Equipo de tu hijo"
                  : rol === "entrenador"
                  ? "Tus equipos"
                  : "Todos los equipos"}
              </Typography>
              <Typography color="text.secondary" fontSize={isMdUp ? "1.11rem" : "0.97rem"}>
                Consulta y gestiona los equipos y equipaciones asociados
              </Typography>
            </Box>
            {(rol === "admin" || rol === "entrenador") && (
              <Box flexGrow={1} display="flex" justifyContent="flex-end">
                <Tooltip title="Añadir equipo">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push("/crear-equipo")}
                    sx={{
                      borderRadius: 2,
                      px: 2.5,
                      fontWeight: 600,
                      textTransform: "none",
                      fontSize: "1.05rem",
                    }}
                  >
                    Añadir equipo
                  </Button>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Paper>

        {equipos.length === 0 ? (
          <Alert severity="info" sx={{ my: 4, fontSize: "1.09rem" }}>
            No hay equipos disponibles.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {equipos.map((eq) => (
              <Grid item xs={12} md={6} lg={4} key={eq.id}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    p: { xs: 1.5, md: 2 },
                    boxShadow: 1,
                    transition: "transform 0.20s, box-shadow 0.20s",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: 5 },
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    bgcolor: "grey.50",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 0 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <SportsSoccerIcon color="primary" fontSize="large" />
                      <Typography variant="h6" fontWeight={700}>
                        {eq.nombre}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <EmojiEventsIcon fontSize="small" />
                      <Chip
                        label={eq.deporte || "Sin deporte"}
                        size="small"
                        color="secondary"
                        sx={{ fontWeight: 500 }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <SchoolIcon fontSize="small" />
                      <Chip
                        label={eq.categoria || "Sin categoría"}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 500 }}
                      />
                    </Stack>
                    {eq.campo_local && (
                      <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <PlaceIcon fontSize="small" color="action" />
                        <Typography fontSize="0.96rem" color="text.secondary">
                          {eq.campo_local}
                        </Typography>
                      </Stack>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                    >
                      {renderEquipacion("local", eq.equipacion_local)}
                      {renderEquipacion("visitante", eq.equipacion_visitante)}
                    </Stack>
                  </CardContent>
                  {(rol === "admin" || rol === "entrenador") && (
                    <CardActions sx={{ justifyContent: "flex-end", pt: 1.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/editar-equipo/${eq.id}`)}
                        sx={{ borderRadius: 2, fontWeight: 500 }}
                      >
                        Editar
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="error" onClose={handleCloseSnackbar}>
            {errorEquipos}
          </Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
}
