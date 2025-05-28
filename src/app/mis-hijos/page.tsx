"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Stack,
  CircularProgress,
  Box,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Divider,
  Fade,
  Fab,
  Tooltip,
  Alert,
  Skeleton,
} from "@mui/material";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import { motion, AnimatePresence } from "framer-motion";

// Hook reutilizable para obtener hijos
function useMisHijos(user: User | null) {
  const [hijos, setHijos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    getDocs(collection(db, "usuarios", user.uid, "hijos"))
      .then((snap) => setHijos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))))
      .catch(() => setError("No se pudieron cargar los hijos."))
      .finally(() => setLoading(false));
  }, [user]);

  return { hijos, loading, error, setHijos };
}

export default function MisHijosPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);

  // Carga usuario autenticado una sola vez
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const { hijos, loading, error, setHijos } = useMisHijos(user);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await import("firebase/firestore").then(({ deleteDoc, doc }) =>
        deleteDoc(doc(db, "usuarios", user!.uid, "hijos", id))
      );
      setHijos((h: any[]) => h.filter((x) => x.id !== id));
    } catch (e: any) {
      console.error("Error borrando hijo:", e);
    } finally {
      setDeleting(null);
      setDialogOpen(null);
    }
  };

  // Feedback loading global (auth o hijos)
  if (authLoading || loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 7 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress />
          <Skeleton variant="rectangular" height={68} width="100%" sx={{ borderRadius: 3 }} />
          <Skeleton variant="rectangular" height={68} width="100%" sx={{ borderRadius: 3 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8, position: "relative" }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {hijos.length === 0 ? (
        <Fade in>
          <Paper
            elevation={5}
            sx={{
              p: isMobile ? 3 : 7,
              textAlign: "center",
              borderRadius: 4,
              boxShadow: 6,
              background: theme.palette.mode === "dark"
                ? "linear-gradient(145deg, #1e1e1e, #262626)"
                : "linear-gradient(145deg, #f5f5f5, #ffffff)",
            }}
          >
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 76,
                height: 76,
                mx: "auto",
                mb: 2,
              }}
            >
              <FamilyRestroomIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              Todavía no tienes hijos agregados
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4, fontSize: "1.08rem" }}>
              Añade los datos de tu(s) hijo(s) para gestionarlos desde CoordiSport.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push("/agregar-hijo")}
              sx={{ fontWeight: 700, borderRadius: 2, px: 4 }}
              startIcon={<AddIcon />}
            >
              Agregar hijo/a
            </Button>
          </Paper>
        </Fade>
      ) : (
        <>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
            <FamilyRestroomIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={800}>
              Mis hijos/as
            </Typography>
            <Box flexGrow={1} />
            <Tooltip title="Añadir hijo/a">
              <Fab
                color="primary"
                aria-label="Agregar hijo/a"
                size="medium"
                sx={{
                  ml: 2,
                  boxShadow: 2,
                  position: "static",
                  fontWeight: 700,
                  transition: "background 0.18s",
                  "&:hover": { backgroundColor: theme.palette.primary.dark },
                }}
                onClick={() => router.push("/agregar-hijo")}
              >
                <AddIcon />
              </Fab>
            </Tooltip>
          </Stack>

          <AnimatePresence>
            <Stack spacing={3} mt={2}>
              {hijos.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 18 }}
                  transition={{ duration: 0.22 + i * 0.02 }}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: 4,
                      background: theme.palette.background.paper,
                      boxShadow: 2,
                      px: { xs: 1, md: 3 },
                      py: { xs: 2, md: 3 },
                      transition: "box-shadow 0.19s, transform 0.19s",
                      "&:hover": {
                        boxShadow: 6,
                        transform: "translateY(-5px) scale(1.012)",
                      },
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={0.5}>
                        <Avatar
                          sx={{
                            bgcolor: theme.palette.primary.light,
                            width: 50,
                            height: 50,
                            fontWeight: 600,
                            fontSize: 26,
                          }}
                          src={h.fotoURL}
                        >
                          {h.fotoURL ? "" : h.nombre.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {h.nombre} {h.apellidos}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <Divider sx={{ my: 1.5 }} />
                    <CardActions sx={{ justifyContent: "flex-end", gap: 1 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<VisibilityIcon />}
                        onClick={() => router.push(`/mis-hijos/${h.id}`)}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      >
                        Ver ficha
                      </Button>
                      <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/mis-hijos/${h.id}/editar`)}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDialogOpen(h.id)}
                        disabled={deleting === h.id}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                      >
                        {deleting === h.id ? <CircularProgress size={16} /> : "Borrar"}
                      </Button>
                    </CardActions>
                  </Card>
                </motion.div>
              ))}
            </Stack>
          </AnimatePresence>
        </>
      )}

      <Dialog
        open={!!dialogOpen}
        onClose={() => setDialogOpen(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle fontWeight={700}>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¿Seguro que deseas eliminar este hijo/a? Esta acción no se puede deshacer.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(null)} variant="outlined">
            Cancelar
          </Button>
          <Button
            color="error"
            onClick={() => dialogOpen && handleDelete(dialogOpen)}
            disabled={!!deleting}
            variant="contained"
            sx={{ fontWeight: 700 }}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
