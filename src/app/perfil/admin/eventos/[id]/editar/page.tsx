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
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";

type EventoTipo = "partido" | "entrenamiento";

interface Evento {
  id: string;
  tipo: EventoTipo;
  fecha: string;
  hora?: string;
  hora_inicio?: string;
  hora_fin?: string;
  equipo_id: string;
  rival?: string;
  ubicacion?: {
    direccion: string;
  };
}

export default function EditarEventoAdminPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [evento, setEvento] = useState<any>(null);
  const [equipos, setEquipos] = useState<{ id: string; nombre: string }[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");

      const snap = await getDoc(doc(db, "usuarios", user.uid));
      if (!snap.exists() || snap.data()?.rol !== "admin") {
        router.push("/perfil");
      }

      try {
        const eventoSnap = await getDoc(doc(db, "eventos", id as string));
        if (!eventoSnap.exists()) throw new Error("Evento no encontrado.");
        setEvento({ id: eventoSnap.id, ...eventoSnap.data() });

        const equiposSnap = await getDocs(collection(db, "equipos"));
        const lista = equiposSnap.docs.map((e) => ({
          id: e.id,
          nombre: e.data().nombre || "(sin nombre)",
        }));
        setEquipos(lista);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => authUnsub();
  }, [id, router]);

  const handleChange = (field: string, value: any) => {
    setEvento((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!evento.fecha || !evento.equipo_id || !evento.tipo) {
      setError("Faltan campos obligatorios.");
      return;
    }

    setGuardando(true);
    try {
      await setDoc(doc(db, "eventos", evento.id), {
        tipo: evento.tipo,
        fecha: evento.fecha,
        hora: evento.hora || null,
        hora_inicio: evento.hora_inicio || null,
        hora_fin: evento.hora_fin || null,
        equipo_id: evento.equipo_id,
        rival: evento.rival || null,
        ubicacion: {
          direccion: evento.ubicacion?.direccion || "",
        },
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

  if (!evento) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">No se pudo cargar el evento.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Editar evento
        </Typography>

        <Stack spacing={2} mt={2}>
          <FormControl fullWidth>
            <InputLabel>Tipo de evento</InputLabel>
            <Select
              value={evento.tipo}
              label="Tipo de evento"
              onChange={(e) => handleChange("tipo", e.target.value)}
            >
              <MenuItem value="partido">Partido</MenuItem>
              <MenuItem value="entrenamiento">Entrenamiento</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Fecha (DD-MM-YYYY)"
            value={evento.fecha || ""}
            onChange={(e) => handleChange("fecha", e.target.value)}
            fullWidth
          />

          {evento.tipo === "partido" && (
            <>
              <TextField
                label="Hora del partido (HH:mm)"
                value={evento.hora || ""}
                onChange={(e) => handleChange("hora", e.target.value)}
                fullWidth
              />
              <TextField
                label="Rival"
                value={evento.rival || ""}
                onChange={(e) => handleChange("rival", e.target.value)}
                fullWidth
              />
            </>
          )}

          {evento.tipo === "entrenamiento" && (
            <>
              <TextField
                label="Hora de inicio"
                value={evento.hora_inicio || ""}
                onChange={(e) => handleChange("hora_inicio", e.target.value)}
                fullWidth
              />
              <TextField
                label="Hora de fin"
                value={evento.hora_fin || ""}
                onChange={(e) => handleChange("hora_fin", e.target.value)}
                fullWidth
              />
            </>
          )}

          <FormControl fullWidth>
            <InputLabel>Equipo</InputLabel>
            <Select
              value={evento.equipo_id || ""}
              label="Equipo"
              onChange={(e) => handleChange("equipo_id", e.target.value)}
            >
              {equipos.map((e) => (
                <MenuItem key={e.id} value={e.id}>
                  {e.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Ubicación (dirección)"
            value={evento.ubicacion?.direccion || ""}
            onChange={(e) =>
              handleChange("ubicacion", { direccion: e.target.value })
            }
            fullWidth
          />

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
