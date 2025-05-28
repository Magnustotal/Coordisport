"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Divider,
  Grid,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import EventIcon from "@mui/icons-material/Event";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import GroupIcon from "@mui/icons-material/Group";

export default function PerfilAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");

      try {
        const ref = doc(db, "usuarios", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error("Usuario no encontrado");
        const data = snap.data();
        if (data.rol !== "admin") {
          router.replace("/perfil");
          return;
        }
        setUsuario({ uid: user.uid, email: user.email, ...data });
      } catch (e: any) {
        setError("Error al cargar el perfil: " + e.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Panel de Administración
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>Datos del administrador</Typography>
        <Typography><strong>Email:</strong> {usuario?.email}</Typography>
        {usuario?.nombre && (
          <Typography><strong>Nombre:</strong> {usuario.nombre}</Typography>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6">Accesos por rol</Typography>
        <Stack spacing={2} direction={{ xs: "column", sm: "row" }} useFlexGap flexWrap="wrap" mt={2}>
          <Button
            variant="outlined"
            startIcon={<SupervisorAccountIcon />}
            onClick={() => router.push("/perfil/entrenador")}
          >
            Ver como entrenador
          </Button>

          <Button
            variant="outlined"
            startIcon={<FamilyRestroomIcon />}
            onClick={() => router.push("/perfil/padre")}
          >
            Ver como padre
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6">Gestión global</Typography>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GroupIcon />}
              onClick={() => router.push("/admin/usuarios")}
            >
              Ver usuarios
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GroupsIcon />}
              onClick={() => router.push("/admin/equipos")}
            >
              Ver equipos
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<EventIcon />}
              onClick={() => router.push("/admin/eventos")}
            >
              Ver eventos
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6">Herramientas administrativas</Typography>
        <Box mt={2}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AdminPanelSettingsIcon />}
            onClick={() => alert("Funcionalidades futuras: backups, informes, permisos, etc.")}
          >
            Herramientas avanzadas
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
