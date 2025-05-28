"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  DatePicker,
  TimePicker,
  LocalizationProvider,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

interface Evento {
  id: string;
  tipo: "partido" | "entrenamiento";
  fecha: string;
  horaInicio: string;
  horaFin: string;
  repetirHasta?: string;
  grupoRecurrente?: string;
  ubicacion: { direccion: string };
  equipoNombre: string;
  categoria: string;
  deporte?: string;
  localVisitante?: "local" | "visitante";
  notas?: string;
  creado_por: string;
}

export default function EditarEventoPage() {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [tipo, setTipo] = useState<"partido" | "entrenamiento">("partido");
  const [fecha, setFecha] = useState<Dayjs | null>(null);
  const [horaInicio, setHoraInicio] = useState<Dayjs | null>(null);
  const [horaFin, setHoraFin] = useState<Dayjs | null>(null);
  const [repetirHasta, setRepetirHasta] = useState<Dayjs | null>(null);
  const [ubicacion, setUbicacion] = useState("");
  const [equipoNombre, setEquipoNombre] = useState("");
  const [categoria, setCategoria] = useState("");
  const [deporte, setDeporte] = useState("");
  const [localVisitante, setLocalVisitante] = useState<"local" | "visitante" | "">("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<null | "uno" | "futuros">(null);

  const ahora = dayjs();

  // 1) Autenticación
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  // 2) Cargar evento
  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      try {
        const ref = doc(db, "eventos", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Evento no encontrado.");
          setLoading(false);
          return;
        }
        const data = snap.data() as Omit<Evento, "id">;
        if (data.creado_por !== user.uid) {
          setError("⛔ No tienes permiso para editar este evento.");
          setLoading(false);
          return;
        }

        const ev: Evento = { id: snap.id, ...data };
        setEvento(ev);

        // Parseo fechas/horas en DD-MM-YYYY y HH:mm
        const f = dayjs(data.fecha, "DD-MM-YYYY");
        const hi = dayjs(data.horaInicio, "HH:mm");
        const hf = dayjs(data.horaFin, "HH:mm");
        const rt = data.repetirHasta ? dayjs(data.repetirHasta, "DD-MM-YYYY") : null;

        setTipo(data.tipo);
        setFecha(f);
        setHoraInicio(hi);
        setHoraFin(hf);
        setRepetirHasta(rt);
        setUbicacion(data.ubicacion.direccion);
        setEquipoNombre(data.equipoNombre);
        setCategoria(data.categoria);
        setDeporte(data.deporte || "");
        setLocalVisitante(data.localVisitante || "");
        setNotas(data.notas || "");

        // Deshabilitar si ya pasó la hora de inicio
        const fechaHora = dayjs(`${data.fecha} ${data.horaInicio}`, "DD-MM-YYYY HH:mm");
        setDisabled(fechaHora.isBefore(ahora));
      } catch (e: any) {
        setError("Error al cargar el evento: " + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  // Eliminar evento (uno o futuros)
  const eliminarEvento = async (modo: "uno" | "futuros") => {
    if (!evento) return;
    try {
      const refHora = dayjs(`${evento.fecha} ${evento.horaInicio}`, "DD-MM-YYYY HH:mm");
      if (modo === "uno") {
        await deleteDoc(doc(db, "eventos", evento.id));
      } else {
        const grupoId = evento.grupoRecurrente || evento.id;
        const snaps = await getDocs(
          query(collection(db, "eventos"), where("grupoRecurrente", "==", grupoId))
        );
        for (const d of snaps.docs) {
          const dt = d.data() as Evento;
          const fh = dayjs(`${dt.fecha} ${dt.horaInicio}`, "DD-MM-YYYY HH:mm");
          if (!fh.isBefore(refHora)) {
            await deleteDoc(doc(db, "eventos", d.id));
          }
        }
        // También elimino el principal si corresponde
        if (grupoId !== evento.id) {
          const pRef = doc(db, "eventos", grupoId);
          const pSnap = await getDoc(pRef);
          if (pSnap.exists()) {
            const pd = pSnap.data() as Evento;
            const pf = dayjs(`${pd.fecha} ${pd.horaInicio}`, "DD-MM-YYYY HH:mm");
            if (!pf.isBefore(refHora)) await deleteDoc(pRef);
          }
        }
      }
      setConfirmDialog(null);
      router.push("/eventos");
    } catch (e: any) {
      setError("Error al eliminar evento: " + e.message);
    }
  };

  // Validación antes de guardar
  const validarCampos = () => {
    if (!tipo || !fecha || !horaInicio || !horaFin || !ubicacion) {
      setError("Todos los campos son obligatorios.");
      return false;
    }
    const fh = dayjs(`${fecha.format("DD-MM-YYYY")} ${horaInicio.format("HH:mm")}`, "DD-MM-YYYY HH:mm");
    if (fh.isBefore(ahora)) {
      setError("No se pueden guardar eventos en el pasado.");
      return false;
    }
    return true;
  };

  // Guardar cambios
  const handleGuardar = async () => {
    if (!evento || !validarCampos()) return;
    try {
      await updateDoc(doc(db, "eventos", evento.id), {
        tipo,
        fecha: fecha.format("DD-MM-YYYY"),
        horaInicio: horaInicio.format("HH:mm"),
        horaFin: horaFin.format("HH:mm"),
        repetirHasta: repetirHasta?.format("DD-MM-YYYY") || "",
        ubicacion: { direccion: ubicacion },
        localVisitante,
        notas,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/eventos/${evento.id}`), 2000);
    } catch (e: any) {
      setError("Error al guardar los cambios: " + e.message);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Editar Evento
        </Typography>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <FormLabel>Tipo de evento</FormLabel>
            <RadioGroup
              row
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
              disabled={disabled}
            >
              <FormControlLabel value="partido" control={<Radio />} label="Partido" />
              <FormControlLabel value="entrenamiento" control={<Radio />} label="Entrenamiento" />
            </RadioGroup>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
            <DatePicker
              label="Fecha"
              value={fecha}
              onChange={setFecha}
              disabled={disabled}
              renderInput={(p) => <TextField {...p} fullWidth />}
            />
            <TimePicker
              label="Hora de inicio"
              value={horaInicio}
              onChange={setHoraInicio}
              disabled={disabled}
              renderInput={(p) => <TextField {...p} fullWidth />}
            />
            <TimePicker
              label="Hora de fin"
              value={horaFin}
              onChange={setHoraFin}
              disabled={disabled}
              renderInput={(p) => <TextField {...p} fullWidth />}
            />
            {tipo === "entrenamiento" && (
              <DatePicker
                label="Repetir hasta"
                value={repetirHasta}
                onChange={setRepetirHasta}
                disabled={disabled}
                renderInput={(p) => <TextField {...p} fullWidth />}
              />
            )}
          </LocalizationProvider>

          <TextField
            label="Ubicación"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            fullWidth
            disabled={disabled}
          />
          <TextField label="Equipo" value={equipoNombre} fullWidth disabled />
          <TextField label="Categoría" value={categoria} fullWidth disabled />
          <TextField label="Deporte" value={deporte} fullWidth disabled />

          {tipo === "partido" && (
            <FormControl component="fieldset" disabled={disabled}>
              <FormLabel component="legend">Condición Local/Visitante</FormLabel>
              <RadioGroup
                row
                value={localVisitante}
                onChange={(e) => setLocalVisitante(e.target.value as any)}
              >
                <FormControlLabel value="local" control={<Radio />} label="Local" />
                <FormControlLabel value="visitante" control={<Radio />} label="Visitante" />
              </RadioGroup>
            </FormControl>
          )}

          <TextField
            label="Notas adicionales"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            fullWidth
            multiline
            rows={4}
            disabled={disabled}
          />

          <Stack direction="row" spacing={2}>
            {!disabled && (
              <>
                <Button variant="contained" onClick={handleGuardar}>
                  Guardar Cambios
                </Button>
                <Button color="error" onClick={() => setConfirmDialog("uno")}>
                  Eliminar evento
                </Button>
              </>
            )}
            <Button variant="outlined" onClick={() => router.push(`/eventos/${evento?.id}`)}>
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Alertas */}
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError("")}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success">Cambios guardados con éxito</Alert>
      </Snackbar>

      {/* Diálogo de confirmación */}
      <Dialog open={confirmDialog !== null} onClose={() => setConfirmDialog(null)}>
        <DialogTitle>¿Eliminar evento?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Este evento forma parte de una serie recurrente. ¿Qué deseas eliminar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => eliminarEvento("uno")}>Eliminar solo este</Button>
          <Button onClick={() => eliminarEvento("futuros")} color="error">
            Eliminar este y futuros
          </Button>
          <Button onClick={() => setConfirmDialog(null)}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
