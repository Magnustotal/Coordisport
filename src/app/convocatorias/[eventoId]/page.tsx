"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collectionGroup,
  query,
  where,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  FormControl,
  Select,
  OutlinedInput,
  ListItemText,
  MenuItem,
  FormLabel,
  Stack,
  Divider,
  Checkbox,
  useTheme,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

interface JugadorParaSeleccion {
  id: string;
  nombre: string;
  apellidos: string | null;
  nombreCompleto: string;
  padre_id: string | null;
  telefono_padre?: string | null;
}

interface Evento {
  id: string;
  fecha: string;
  horaInicio?: string;
  equipo_id: string;
  tipo: string;
  equipoNombre: string;
  categoria: string | null;
  deporte?: string | null;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 6.5 + ITEM_PADDING,
      width: 250,
    },
  },
};

export default function GestionConvocatoriaPage() {
  const router = useRouter();
  const theme = useTheme();
  const params = useParams();

  // Soporta eventoId como string o array
  let eventoId: string | undefined = undefined;
  if (params && typeof params.eventoId === "string") {
    eventoId = params.eventoId;
  } else if (params && Array.isArray(params.eventoId) && params.eventoId.length > 0) {
    eventoId = params.eventoId[0];
  }

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [evento, setEvento] = useState<Evento | null>(null);
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState<JugadorParaSeleccion[]>([]);

  const [titularesSeleccionados, setTitularesSeleccionados] = useState<string[]>([]);
  const [reservasSeleccionados, setReservasSeleccionados] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingJugadores, setLoadingJugadores] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user || !eventoId) return;

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Cargar evento
        const eventoRef = doc(db, "eventos", eventoId!);
        const eventoSnap = await getDoc(eventoRef);
        if (!eventoSnap.exists()) {
          setError("No se ha encontrado el evento solicitado.");
          setLoading(false);
          return;
        }

        const eventoData = eventoSnap.data();
        if (!eventoData.equipo_id) {
          setError("El evento existe pero no tiene equipo asignado. Corrige esto en la edición del evento.");
          setLoading(false);
          return;
        }
        setEvento({ id: eventoSnap.id, ...eventoData } as Evento);

        // Cargar jugadores asociados al equipo
        const equipoId = eventoData.equipo_id;
        setLoadingJugadores(true);
        const qJugadores = query(collectionGroup(db, "hijos"), where("equipoId", "==", equipoId));
        const hijosSnapshot = await getDocs(qJugadores);

        if (hijosSnapshot.empty) {
          setError("No hay jugadores registrados en este equipo.");
          setJugadoresDisponibles([]);
        } else {
          const fetchedJugadoresPromises = hijosSnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const padreId = docSnap.ref.parent.parent?.id || null;
            let telefonoPadre: string | null = null;
            if (padreId) {
              try {
                const padreSnap = await getDoc(doc(db, "usuarios", padreId));
                if (padreSnap.exists()) {
                  telefonoPadre = padreSnap.data()?.telefono || null;
                }
              } catch (e) {
                console.warn("No se pudo obtener tel. del padre", padreId, e);
              }
            }
            return {
              id: docSnap.id,
              nombre: data.nombre || "Jugador",
              apellidos: data.apellidos || null,
              nombreCompleto: `${data.nombre || ""} ${data.apellidos || ""}`.trim() || "Jugador sin nombre",
              padre_id: padreId,
              telefono_padre: telefonoPadre,
            };
          });
          const listaJugadores = await Promise.all(fetchedJugadoresPromises);
          setJugadoresDisponibles(listaJugadores);
        }

        // Cargar convocatoria existente, si existe
        const convRef = doc(db, "convocatorias", eventoId!);
        const convSnap = await getDoc(convRef);
        if (convSnap.exists()) {
          const convData = convSnap.data();
          setTitularesSeleccionados((convData.titulares || []).map((j: any) => j.jugador_id));
          setReservasSeleccionados((convData.reservas || []).map((j: any) => j.jugador_id));
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos: " + (err.message || err.toString()));
      } finally {
        setLoading(false);
        setLoadingJugadores(false);
      }
    };

    fetchData();
  }, [user, eventoId]);

  const guardarConvocatoria = async () => {
    if (!evento || (titularesSeleccionados.length === 0 && reservasSeleccionados.length === 0)) {
      setError("Debes seleccionar al menos un jugador titular o reserva.");
      return;
    }
    if (!user) {
      setError("Usuario no autenticado.");
      return;
    }
    if (!eventoId) {
      setError("No se ha proporcionado un identificador de evento.");
      return;
    }

    setGuardando(true);
    setError("");

    try {
      const mapJugadoresParaGuardar = (idsJugadores: string[], tipoJugador: "titular" | "reserva") => {
        return idsJugadores.map((hijoId) => {
          const jugadorInfo = jugadoresDisponibles.find((j) => j.id === hijoId);
          return {
            jugador_id: hijoId,
            padre_id: jugadorInfo?.padre_id || null,
            nombre_hijo: jugadorInfo?.nombre || "Nombre Desconocido",
            apellidos_hijo: jugadorInfo?.apellidos || null,
            telefono_padre: jugadorInfo?.telefono_padre || null,
            estado: "pendiente",
            tipo: tipoJugador,
            motivo: null,
          };
        });
      };

      const titularesData = mapJugadoresParaGuardar(titularesSeleccionados, "titular");
      const reservasData = mapJugadoresParaGuardar(reservasSeleccionados, "reserva");

      let fechaLimiteConfirmacion = Timestamp.fromDate(dayjs(evento.fecha, "DD-MM-YYYY").subtract(2, "day").toDate());
      if (evento.tipo === "partido" && evento.horaInicio) {
        const fechaHoraPartido = dayjs(`${evento.fecha} ${evento.horaInicio}`, "DD-MM-YYYY HH:mm");
        if (fechaHoraPartido.isValid()) {
          fechaLimiteConfirmacion = Timestamp.fromDate(fechaHoraPartido.subtract(2, "day").toDate());
        }
      }

      const ref = doc(db, "convocatorias", eventoId!);
      await setDoc(
        ref,
        {
          evento_id: evento.id,
          equipo_id: evento.equipo_id,
          categoria: evento.categoria || null,
          deporte: evento.deporte || null,
          titulares: titularesData,
          reservas: reservasData,
          creada_por: user.uid,
          fecha_evento: evento.fecha,
          fecha_limite_confirmacion: fechaLimiteConfirmacion,
          transporte: { ofertas: [], solicitudes: [] },
        },
        { merge: true }
      );

      setSuccess(true);
      setTimeout(() => router.push(`/resumen/${evento.id}`), 2000);
    } catch (err: any) {
      console.error("Error guardando convocatoria:", err);
      setError("Error al guardar la convocatoria: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => router.back()} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography>Cargando datos del evento...</Typography>
      </Container>
    );
  }

  if (!evento) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">No se pudo cargar el evento o no existe.</Alert>
        <Button onClick={() => router.back()} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          maxWidth: 540,
          mx: "auto",
          bgcolor: theme.palette.background.paper,
          boxShadow: 3,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight="bold" align="center" gutterBottom>
          Gestión de Convocatoria
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box mb={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, display: "flex", gap: 1 }}>
            <b>Evento:</b> {evento?.tipo} - {dayjs(evento?.fecha, "DD-MM-YYYY").format("dddd, D MMMM")}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ display: "flex", gap: 1 }}>
            <b>Equipo:</b> {evento?.equipoNombre} ({evento?.categoria || "N/A"})
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2.5}>
          <FormControl fullWidth required>
            <FormLabel sx={{ mb: 0.5 }}>Titulares *</FormLabel>
            <Select
              multiple
              value={titularesSeleccionados}
              onChange={(e) => setTitularesSeleccionados(e.target.value as string[])}
              input={<OutlinedInput label="Titulares" />}
              renderValue={(selected) =>
                selected
                  .map((id) => jugadoresDisponibles.find((j) => j.id === id)?.nombreCompleto || id)
                  .join(", ")
              }
              MenuProps={MenuProps}
              displayEmpty
            >
              <MenuItem disabled value="">
                <em>{loadingJugadores ? "Cargando jugadores..." : "Selecciona titulares"}</em>
              </MenuItem>
              {!loadingJugadores && jugadoresDisponibles.length === 0 && (
                <MenuItem disabled>No hay jugadores en este equipo.</MenuItem>
              )}
              {jugadoresDisponibles.map((j) => (
                <MenuItem key={j.id} value={j.id} disabled={reservasSeleccionados.includes(j.id)}>
                  <Checkbox checked={titularesSeleccionados.includes(j.id)} />
                  <ListItemText primary={j.nombreCompleto} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <FormLabel sx={{ mb: 0.5 }}>Reservas</FormLabel>
            <Select
              multiple
              value={reservasSeleccionados}
              onChange={(e) => setReservasSeleccionados(e.target.value as string[])}
              input={<OutlinedInput label="Reservas" />}
              renderValue={(selected) =>
                selected
                  .map((id) => jugadoresDisponibles.find((j) => j.id === id)?.nombreCompleto || id)
                  .join(", ")
              }
              MenuProps={MenuProps}
              displayEmpty
            >
              <MenuItem disabled value="">
                <em>{loadingJugadores ? "Cargando jugadores..." : "Selecciona reservas"}</em>
              </MenuItem>
              {!loadingJugadores &&
                jugadoresDisponibles.filter((j) => !titularesSeleccionados.includes(j.id)).length === 0 && (
                  <MenuItem disabled>No hay jugadores disponibles para reserva.</MenuItem>
                )}
              {jugadoresDisponibles
                .filter((j) => !titularesSeleccionados.includes(j.id))
                .map((j) => (
                  <MenuItem key={j.id} value={j.id}>
                    <Checkbox checked={reservasSeleccionados.includes(j.id)} />
                    <ListItemText primary={j.nombreCompleto} />
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<CancelIcon />}
              onClick={() => router.push(`/resumen/${evento.id}`)}
              disabled={guardando}
              sx={{
                px: 3,
                borderRadius: 2,
                textTransform: "none",
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={guardarConvocatoria}
              disabled={guardando || loadingJugadores}
              sx={{
                px: 3,
                borderRadius: 2,
                textTransform: "none",
                boxShadow: 2,
              }}
            >
              {guardando ? "Guardando..." : "Guardar Convocatoria"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setError("")} sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Convocatoria guardada correctamente
        </Alert>
      </Snackbar>
    </Container>
  );
}
