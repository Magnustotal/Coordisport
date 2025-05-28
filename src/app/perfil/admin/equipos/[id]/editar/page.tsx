"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const deportes = ["Fútbol", "Baloncesto", "Balonmano", "Voleibol"];

export default function EditarEquipoAdminPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [equipo, setEquipo] = useState<any>(null);
  const [entrenadores, setEntrenadores] = useState<{ id: string; nombre: string }[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");

      const userSnap = await getDoc(doc(db, "usuarios", user.uid));
      if (!userSnap.exists() || userSnap.data()?.rol !== "admin") {
        return router.push("/perfil");
      }

      try {
        const eqSnap = await getDoc(doc(db, "equipos", id as string));
        if (!eqSnap.exists()) throw new Error("Equipo no encontrado.");
        setEquipo({ id: eqSnap.id, ...eqSnap.data() });

        const allUsers = await getDocs(collection(db, "usuarios"));
        const entrenadoresDisponibles: { id: string; nombre: string }[] = [];
        allUsers.forEach((u) => {
          const data = u.data();
          if (data.rol === "entrenador") {
            entrenadoresDisponibles.push({
              id: u.id,
              nombre: data.nombre || "(sin nombre)",
            });
          }
        });

        setEntrenadores(entrenadoresDisponibles);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => authUnsub();
  }, [id, router]);

  const handleChange = (field: string, value: any) => {
    setEquipo((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!equipo?.nombre?.trim()) {
      setError("El nombre del equipo es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      const ref = doc(db, "equipos", equipo.id);
      await setDoc(ref, {
        nombre: equipo.nombre,
        deporte: equipo.deporte,
        categoria: equipo.categoria,
        campo_local: equipo.campo_local,
        entrenador_id: equipo.entrenador_id || null,
      }, { merge: true });

      setSuccess(true);
    } catch (err: any) {
      setError("Error al guardar: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!equipo) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">No se pudo cargar el equipo.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Editar equipo
        </Typography>

        <Stack spacing={2} mt={2}>
          <TextField
            label="Nombre del equipo"
            value={equipo.nombre || ""}
            onChange={(e) => handleChange("nombre", e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Deporte"
            select
            value={equipo.deporte || ""}
            onChange={(e) => handleChange("deporte", e.target.value)}
            fullWidth
          >
            {deportes.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Categoría"
            value={equipo.categoria || ""}
            onChange={(e) => handleChange("categoria", e.target.value)}
            fullWidth
          />

          <TextField
            label="Campo local"
            value={equipo.campo_local || ""}
            onChange={(e) => handleChange("campo_local", e.target.value)}
            fullWidth
          />

          <TextField
            select
            label="Entrenador asignado"
            value={equipo.entrenador_id || ""}
            onChange={(e) => handleChange("entrenador_id", e.target.value)}
            fullWidth
          >
            <MenuItem value="">— Ninguno —</MenuItem>
            {entrenadores.map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.nombre} ({e.id})
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => router.back()} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={guardando}
            >
              Guardar cambios
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError("")}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={2500}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success">✅ Cambios guardados</Alert>
      </Snackbar>
    </Container>
  );
}
