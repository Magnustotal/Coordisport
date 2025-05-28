"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
  Chip,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Fade,
} from "@mui/material";
import SportsIcon from "@mui/icons-material/Sports";
import PersonIcon from "@mui/icons-material/Person";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import GroupIcon from "@mui/icons-material/Group";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

interface EquipoAsignado {
  id: string;
  nombre: string;
  categoria?: string;
  deporte?: string;
}

export default function PerfilEntrenadorPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [perfil, setPerfil] = useState<any>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [equiposAsignados, setEquiposAsignados] = useState<EquipoAsignado[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setEmail(user.email);
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (!snap.exists() || snap.data().rol !== "entrenador") {
          router.replace("/perfil");
          return;
        }
        const perfilData = snap.data();
        setPerfil(perfilData);

        // Cargar equipos asignados por ID y mostrar nombre real
        if (
          perfilData.equipos_asignados &&
          Array.isArray(perfilData.equipos_asignados) &&
          perfilData.equipos_asignados.length > 0
        ) {
          setLoadingEquipos(true);
          const promesas = perfilData.equipos_asignados.map(async (equipoId: string) => {
            try {
              const eqSnap = await getDoc(doc(db, "equipos", equipoId));
              if (eqSnap.exists()) {
                const eqData = eqSnap.data();
                return {
                  id: equipoId,
                  nombre: eqData.nombre || "Equipo sin nombre",
                  categoria: eqData.categoria || "",
                  deporte: eqData.deporte || "",
                } as EquipoAsignado;
              } else {
                return { id: equipoId, nombre: "Equipo desconocido" } as EquipoAsignado;
              }
            } catch {
              return { id: equipoId, nombre: "Equipo desconocido" } as EquipoAsignado;
            }
          });
          const equipos = await Promise.all(promesas);
          setEquiposAsignados(equipos);
          setLoadingEquipos(false);
        } else {
          setEquiposAsignados([]);
        }
      } catch (err: any) {
        console.error(err);
        setError("Error al cargar tu perfil.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
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
        transition={{ duration: 0.45 }}
      >
        <Paper
          elevation={5}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            boxShadow: 4,
            maxWidth: 560,
            mx: "auto",
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Fade in timeout={600}>
            <Box textAlign="center" mb={3}>
              <Avatar
                sx={{
                  width: 82,
                  height: 82,
                  bgcolor: "secondary.main",
                  mx: "auto",
                  boxShadow: 2,
                  mb: 2,
                  fontSize: 48,
                }}
              >
                <SportsIcon fontSize="inherit" />
              </Avatar>
              <Typography variant="h5" fontWeight={800} letterSpacing={0.3}>
                Perfil Entrenador/a
              </Typography>
              <Typography color="text.secondary" fontSize="1.08rem">
                Tus datos personales y equipos asignados
              </Typography>
            </Box>
          </Fade>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={3}>
            {/* Datos personales */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
                borderRadius: 2,
                mb: 1,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Datos personales
              </Typography>
              <Stack spacing={1.2}>
                {perfil?.nombre && (
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography fontWeight={600}>{perfil.nombre}</Typography>
                  </Box>
                )}
                {perfil?.apellidos && (
                  <Box display="flex" alignItems="center" gap={1.5}>
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
                borderRadius: 2,
                mb: 1,
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Contacto
              </Typography>
              <Stack spacing={1.2}>
                {perfil?.telefono && (
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography>{perfil.telefono}</Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="center" gap={1.5}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography>{email || "—"}</Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Equipos asignados */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.50",
                borderRadius: 2,
                mb: 1,
                minHeight: 64,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Equipos asignados
              </Typography>
              {loadingEquipos ? (
                <Stack sx={{ width: "100%" }}>
                  <Skeleton variant="rectangular" height={34} sx={{ mb: 1, borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={34} sx={{ borderRadius: 1 }} />
                </Stack>
              ) : equiposAsignados.length > 0 ? (
                <List dense sx={{ width: "100%", p: 0, mt: 1 }}>
                  {equiposAsignados.map((e) => (
                    <ListItem
                      key={e.id}
                      disablePadding
                      secondaryAction={
                        <Chip
                          label={e.categoria && e.deporte ? `${e.categoria} - ${e.deporte}` : "Equipo"}
                          size="small"
                          color="primary"
                          sx={{ ml: 1, fontWeight: 600 }}
                        />
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.secondary.light,
                            color: theme.palette.secondary.main,
                            width: 36,
                            height: 36,
                            fontSize: 20,
                          }}
                        >
                          <GroupIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={e.nombre}
                        secondary={e.id}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert
                  severity="info"
                  icon={<AddIcon />}
                  sx={{
                    width: "100%",
                    my: 1,
                    bgcolor: "grey.100",
                    color: theme.palette.text.secondary,
                  }}
                  action={
                    <Button
                      size="small"
                      color="primary"
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => router.push("/equipo/nuevo")}
                      sx={{ textTransform: "none", borderRadius: 2, boxShadow: 1 }}
                    >
                      Añadir equipo
                    </Button>
                  }
                >
                  No tienes ningún equipo asignado aún.
                </Alert>
              )}
            </Paper>
          </Stack>

          <Box textAlign="right" mt={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => router.push("/perfil/entrenador/editar")}
              sx={{
                px: 3,
                borderRadius: 2,
                boxShadow: 2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "1.08rem",
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
