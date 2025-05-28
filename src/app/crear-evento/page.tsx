"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Stack,
  Divider,
  InputLabel,
  OutlinedInput,
  CircularProgress,
  Checkbox,
  ListItemText,
  Box,
  Grid,
  Avatar,
  useTheme,
  Fade,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import GroupIcon from "@mui/icons-material/Group";
import PlaceIcon from "@mui/icons-material/Place";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import {
  doc,
  getDoc,
  collection,
  collectionGroup,
  query,
  where,
  addDoc,
  setDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  Autocomplete as GoogleAutocomplete,
  useLoadScript,
} from "@react-google-maps/api";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/es";
import { motion } from "framer-motion";

dayjs.locale("es");

const diasSemana = [
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
];
const libraries: ("places")[] = ["places"];
const ITEM_HEIGHT = 48;
const ITEM_PADDING = 8;
const MenuProps = {
  PaperProps: {
    style: { maxHeight: ITEM_HEIGHT * 6.5 + ITEM_PADDING, width: 260 },
  },
};

interface Equipo {
  id: string;
  nombre: string;
  campo_local?: string;
  deporte?: string;
  categoria?: string;
}

interface JugadorParaSeleccion {
  id: string;
  nombre: string;
  apellidos: string | null;
  nombreCompleto: string;
  padre_id: string | null;
  telefono_padre?: string | null;
}

export default function CrearEventoPage() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_Maps_API_KEY!,
    libraries,
  });
  const router = useRouter();
  const theme = useTheme();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [tipo, setTipo] = useState<"partido" | "entrenamiento" | "">("");
  const [condicion, setCondicion] = useState<"local" | "visitante" | "">("");
  const [fecha, setFecha] = useState<Dayjs | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [horaPartido, setHoraPartido] = useState<Dayjs | null>(null);
  const [horaConvocatoria, setHoraConvocatoria] = useState<Dayjs | null>(null);
  const [ubicacion, setUbicacion] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equipoSel, setEquipoSel] = useState("");
  const [rival, setRival] = useState("");
  const [dias, setDias] = useState<string[]>([]);
  const [horaIni, setHoraIni] = useState<Dayjs | null>(null);
  const [horaFin, setHoraFin] = useState<Dayjs | null>(null);
  const [hasta, setHasta] = useState<Dayjs | null>(null);

  const [jugadoresDisponibles, setJugadoresDisponibles] = useState<JugadorParaSeleccion[]>([]);
  const [loadingJugadores, setLoadingJugadores] = useState(false);

  const [convocados, setConvocados] = useState<string[]>([]);
  const [reservas, setReservas] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoadAC = (ac: google.maps.places.Autocomplete) =>
    (acRef.current = ac);
  const onPlaceChanged = () => {
    const p = acRef.current?.getPlace();
    if (p) {
      setUbicacion(p.formatted_address || "");
      const l = p.geometry?.location;
      if (l) {
        setLat(l.lat().toString());
        setLng(l.lng().toString());
      }
    }
  };

  // AUTENTICACIÓN Y CARGA DE EQUIPOS
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, "usuarios", u.uid));
        if (snap.exists()) {
            const data = snap.data();
            if (!data.equipos_asignados?.length) {
                setError("Debes tener al menos un equipo asignado para crear eventos.");
                return;
            }
            const loadedEquipos = await Promise.all(
                (data.equipos_asignados as string[]).map(async (id: string) => {
                const s = await getDoc(doc(db, "equipos", id));
                return { id: s.id, ...(s.data() as any) } as Equipo;
                })
            );
            setEquipos(loadedEquipos);
            if (loadedEquipos.length === 1) setEquipoSel(loadedEquipos[0].id);
        } else {
            setError("Perfil de usuario no encontrado.");
        }
      } catch (e:any) {
        setError(e.message || "Error al cargar datos iniciales.");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // JUGADORES DISPONIBLES SEGÚN EQUIPO
  useEffect(() => {
    if (!user || !equipoSel) {
      setJugadoresDisponibles([]);
      return;
    }
    (async () => {
      setLoadingJugadores(true);
      setError(""); 
      try {
        const q = query(collectionGroup(db, "hijos"), where("equipoId", "==", equipoSel));
        const hijosSnapshot = await getDocs(q);
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
            } catch (e) {}
          }

          return {
            id: docSnap.id,
            nombre: data.nombre || "Jugador",
            apellidos: data.apellidos || null,
            nombreCompleto: `${data.nombre || ''} ${data.apellidos || ''}`.trim() || "Jugador sin nombre",
            padre_id: padreId,
            telefono_padre: telefonoPadre,
          };
        });
        const fetchedJugadores = await Promise.all(fetchedJugadoresPromises);
        setJugadoresDisponibles(fetchedJugadores);
      } catch (e: any) {
        setError("No se pudieron cargar los jugadores del equipo.");
      } finally {
        setLoadingJugadores(false);
      }
    })();
  }, [user, equipoSel]);

  // ACTUALIZA HORA CONVOCATORIA
  useEffect(() => {
    if (horaPartido) setHoraConvocatoria(horaPartido.subtract(1, "hour"));
    else setHoraConvocatoria(null);
  }, [horaPartido]);

  // RESETEA FORMULARIO AL CAMBIAR EQUIPO O TIPO
  useEffect(() => {
    setFecha(null); setStartDate(null); setHoraPartido(null); setHoraConvocatoria(null);
    setUbicacion(""); setRival(""); setDias([]); setHoraIni(null); setHoraFin(null);
    setHasta(null); setConvocados([]); setReservas([]); setCondicion(""); setError(""); setSuccess(false);
    if (tipo === "entrenamiento" && equipoSel && equipos.length > 0) {
        const team = equipos.find((e) => e.id === equipoSel);
        if (team) setUbicacion(team.campo_local || "");
    }
  }, [tipo, equipoSel, equipos]);

  useEffect(() => {
    if (tipo === "partido" && condicion === "local" && equipoSel && equipos.length > 0) {
      const team = equipos.find((e) => e.id === equipoSel);
      if (team) setUbicacion(team.campo_local || "");
    }
    if (tipo === "partido" && condicion === "visitante") setUbicacion("");
  }, [tipo, condicion, equipoSel, equipos]);

  // VALIDACIÓN
  const validar = () => {
    if (!equipoSel || !tipo) {
      setError("Selecciona equipo y tipo.");
      return false;
    }
    if (tipo === "partido") {
      if (!condicion) { setError("Selecciona si el partido es de local o visitante."); return false; }
      if (!fecha || !horaPartido || !horaConvocatoria || !ubicacion || !rival) {
        setError("Completa todos los campos de partido."); return false;
      }
      if (fecha.isBefore(dayjs(), "day")) {
        setError("La fecha no puede ser anterior a hoy."); return false;
      }
      if (convocados.length < 1) {
        setError("Selecciona al menos un jugador convocado."); return false;
      }
    } else {
      if (!startDate || !dias.length || !horaIni || !horaFin || !hasta || !ubicacion) {
        setError("Completa todos los campos de entrenamiento."); return false;
      }
      if (startDate.isBefore(dayjs(), "day")) {
        setError("La fecha de inicio no puede ser pasada."); return false;
      }
    }
    setError("");
    return true;
  };

  // SUBMIT
  const submit = async () => {
    if (!user || !validar()) return;
    setSaving(true);
    setError("");

    try {
      const team = equipos.find((e: Equipo) => e.id === equipoSel);
      if (!team) {
        setError("Equipo seleccionado no es válido."); setSaving(false); return;
      }

      // Solo incluir condicion si es partido:
      let base: any = {
        tipo,
        equipo_id: equipoSel,
        equipoNombre: team.nombre || "Equipo sin nombre",
        deporte: team.deporte || null,
        categoria: team.categoria || null,
        ubicacion: { direccion: ubicacion || null, lat: lat || null, lng: lng || null },
        creado_por: user.uid,
      };
      if (tipo === "partido" && condicion) base.condicion = condicion;

      const mapJugadoresParaGuardar = (idsJugadores: string[], tipoJugador: "titular" | "reserva") => {
        return idsJugadores.map(hijoId => {
          const jugadorInfo = jugadoresDisponibles.find(j => j.id === hijoId);
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

      if (tipo === "partido") {
        const convocatoriaTime = horaConvocatoria;
        const evRef = await addDoc(collection(db, "eventos"), {
          ...base,
          fecha: fecha!.format("DD-MM-YYYY"),
          horaInicio: horaPartido!.format("HH:mm"),
          horaFin: horaPartido!.add(1, "hour").format("HH:mm"),
          convocatoria: convocatoriaTime ? convocatoriaTime.format("HH:mm") : null,
          rival: rival || null,
        });

        const fechaHoraPartido = fecha!.hour(horaPartido!.hour()).minute(horaPartido!.minute());
        const limiteConfirmacion = Timestamp.fromDate(fechaHoraPartido.subtract(2, "day").toDate());

        const titularesData = mapJugadoresParaGuardar(convocados, "titular");
        const reservasData = mapJugadoresParaGuardar(reservas, "reserva");

        await setDoc(doc(db, "convocatorias", evRef.id), {
          evento_id: evRef.id,
          equipo_id: equipoSel,
          fecha_limite_confirmacion: limiteConfirmacion,
          titulares: titularesData,
          reservas: reservasData,
          creado_por: user.uid,
          transporte: { ofertas: [], solicitudes: [] },
        });
      } else {
        await addDoc(collection(db, "eventos"), {
          ...base,
          dias: dias.length > 0 ? dias : null,
          fechaInicio: startDate!.format("DD-MM-YYYY"),
          fechaFin: hasta!.format("DD-MM-YYYY"),
          horaInicio: horaIni!.format("HH:mm"),
          horaFin: horaFin!.format("HH:mm"),
        });
      }

      setSuccess(true);
      setTimeout(() => router.push("/eventos"), 1500);
    } catch (e: any) {
      setError(e.message || "Ocurrió un error desconocido al guardar.");
    } finally {
      setSaving(false);
    }
  };

  // ---- UI PRINCIPAL ----
  if (!isLoaded) {
    return (
      <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
        >
          <Paper
            elevation={4}
            sx={{
              p: { xs: 2, sm: 4 },
              borderRadius: 3,
              boxShadow: 3,
              mt: { xs: 2, sm: 4 },
              position: "relative",
              overflow: "visible",
            }}
          >
            <Box textAlign="center" mb={2}>
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 64,
                  height: 64,
                  mx: "auto",
                  mb: 1.5,
                  boxShadow: 1,
                }}
              >
                <EventIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Crear Evento
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Organiza partidos y entrenamientos para tu equipo
              </Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2.5}>
              {/* Selección tipo evento */}
              <FormControl>
                <FormLabel sx={{ fontWeight: 600 }}>Tipo de Evento</FormLabel>
                <RadioGroup
                  row
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as "partido" | "entrenamiento" | "")}
                >
                  <FormControlLabel
                    value="partido"
                    control={<Radio />}
                    label="Partido"
                  />
                  <FormControlLabel
                    value="entrenamiento"
                    control={<Radio />}
                    label="Entrenamiento"
                  />
                </RadioGroup>
              </FormControl>

              {tipo && (
                <FormControl fullWidth required>
                  <InputLabel>Equipo</InputLabel>
                  <Select
                    value={equipoSel}
                    label="Equipo"
                    onChange={(e) => setEquipoSel(e.target.value)}
                    startAdornment={<GroupIcon color="primary" sx={{ mr: 1 }} />}
                  >
                    {equipos.map((eq) => (
                      <MenuItem key={eq.id} value={eq.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <SportsSoccerIcon fontSize="small" color="action" />
                          {eq.nombre}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Partido */}
              {tipo === "partido" && (
                <Fade in>
                  <Box>
                    <FormControl sx={{ mb: 1 }}>
                      <FormLabel>¿Juega de local o visitante?</FormLabel>
                      <RadioGroup
                        row
                        value={condicion}
                        onChange={(e) => setCondicion(e.target.value as "local" | "visitante" | "")}
                      >
                        <FormControlLabel
                          value="local"
                          control={<Radio />}
                          label="Local"
                        />
                        <FormControlLabel
                          value="visitante"
                          control={<Radio />}
                          label="Visitante"
                        />
                      </RadioGroup>
                    </FormControl>
                    <TextField
                      label="Rival"
                      value={rival}
                      onChange={(e) => setRival(e.target.value)}
                      fullWidth
                      required
                      sx={{ mb: 2 }}
                    />
                    <DatePicker
                      label="Fecha del Partido"
                      value={fecha}
                      onChange={setFecha}
                      disablePast
                      slotProps={{
                        textField: { fullWidth: true, required: true },
                      }}
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
                      <TimePicker
                        label="Hora Partido"
                        value={horaPartido}
                        onChange={setHoraPartido}
                        slotProps={{ textField: { fullWidth: true, required: true } }}
                      />
                      <TimePicker
                        label="Hora Convocatoria"
                        value={horaConvocatoria}
                        onChange={setHoraConvocatoria}
                        slotProps={{ textField: { fullWidth: true, required: true } }}
                      />
                    </Stack>
                    <Box mt={2}>
                      <GoogleAutocomplete
                        onLoad={onLoadAC}
                        onPlaceChanged={onPlaceChanged}
                        options={{ componentRestrictions: { country: "es" } }}
                      >
                        <TextField
                          label="Ubicación"
                          value={ubicacion}
                          onChange={(e) => setUbicacion(e.target.value)}
                          fullWidth
                          required
                          InputProps={{
                            startAdornment: (
                              <PlaceIcon fontSize="small" sx={{ color: "grey.500", mr: 1 }} />
                            ),
                          }}
                        />
                      </GoogleAutocomplete>
                    </Box>
                    <Grid container spacing={2} mt={1.5}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth required>
                          <FormLabel sx={{ mb: 0.5 }}>Lista de convocados</FormLabel>
                          <Select
                            multiple
                            value={convocados}
                            onChange={(e) => setConvocados(e.target.value as string[])}
                            input={<OutlinedInput label="Lista de convocados" />}
                            renderValue={(selected) =>
                              selected
                                .map((id) =>
                                  jugadoresDisponibles.find((j) => j.id === id)?.nombreCompleto
                                )
                                .join(", ")
                            }
                            MenuProps={MenuProps}
                            displayEmpty
                          >
                            <MenuItem disabled value="">
                              <em>{loadingJugadores ? "Cargando jugadores..." : "Selecciona convocados"}</em>
                            </MenuItem>
                            {!loadingJugadores && jugadoresDisponibles.length === 0 && (
                              <MenuItem disabled>No hay jugadores en este equipo.</MenuItem>
                            )}
                            {jugadoresDisponibles.map((j) => (
                              <MenuItem key={j.id} value={j.id}>
                                <Checkbox checked={convocados.includes(j.id)} />
                                <ListItemText primary={j.nombreCompleto} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <FormLabel sx={{ mb: 0.5 }}>Lista de reservas</FormLabel>
                          <Select
                            multiple
                            value={reservas}
                            onChange={(e) => setReservas(e.target.value as string[])}
                            input={<OutlinedInput label="Lista de reservas" />}
                            renderValue={(selected) =>
                              selected
                                .map((id) =>
                                  jugadoresDisponibles.find((j) => j.id === id)?.nombreCompleto
                                )
                                .join(", ")
                            }
                            MenuProps={MenuProps}
                            displayEmpty
                          >
                            <MenuItem disabled value="">
                              <em>{loadingJugadores ? "Cargando jugadores..." : "Selecciona reservas"}</em>
                            </MenuItem>
                            {!loadingJugadores && jugadoresDisponibles.filter((j) => !convocados.includes(j.id)).length === 0 && (
                              <MenuItem disabled>No hay jugadores disponibles para reserva.</MenuItem>
                            )}
                            {jugadoresDisponibles
                              .filter((j) => !convocados.includes(j.id))
                              .map((j) => (
                                <MenuItem key={j.id} value={j.id}>
                                  <Checkbox checked={reservas.includes(j.id)} />
                                  <ListItemText primary={j.nombreCompleto} />
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}

              {/* Entrenamiento */}
              {tipo === "entrenamiento" && (
                <Fade in>
                  <Box>
                    <DatePicker
                      label="Fecha inicio"
                      value={startDate}
                      onChange={setStartDate}
                      disablePast
                      slotProps={{
                        textField: { fullWidth: true, required: true },
                      }}
                    />
                    <FormControl fullWidth required sx={{ mt: 1 }}>
                      <InputLabel>Días de la semana</InputLabel>
                      <Select
                        multiple
                        value={dias}
                        label="Días de la semana"
                        onChange={(e) => setDias(e.target.value as string[])}
                        input={<OutlinedInput label="Días de la semana" />}
                        renderValue={(selected) => (selected as string[]).join(", ")}
                        MenuProps={MenuProps}
                      >
                        {diasSemana.map((d) => (
                          <MenuItem key={d} value={d}>
                            <Checkbox checked={dias.includes(d)} />
                            <ListItemText primary={d} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
                      <TimePicker
                        label="Hora inicio"
                        value={horaIni}
                        onChange={setHoraIni}
                        slotProps={{ textField: { fullWidth: true, required: true } }}
                      />
                      <TimePicker
                        label="Hora fin"
                        value={horaFin}
                        onChange={setHoraFin}
                        slotProps={{ textField: { fullWidth: true, required: true } }}
                      />
                    </Stack>
                    <DatePicker
                      label="Hasta"
                      value={hasta}
                      onChange={setHasta}
                      disablePast
                      slotProps={{
                        textField: { fullWidth: true, required: true },
                      }}
                      sx={{ mt: 2 }}
                    />
                    <Box mt={2}>
                      <GoogleAutocomplete
                        onLoad={onLoadAC}
                        onPlaceChanged={onPlaceChanged}
                        options={{ componentRestrictions: { country: "es" } }}
                      >
                        <TextField
                          label="Ubicación"
                          value={ubicacion}
                          onChange={(e) => setUbicacion(e.target.value)}
                          fullWidth
                          required
                          InputProps={{
                            startAdornment: (
                              <PlaceIcon fontSize="small" sx={{ color: "grey.500", mr: 1 }} />
                            ),
                          }}
                        />
                      </GoogleAutocomplete>
                    </Box>
                  </Box>
                </Fade>
              )}

              {/* ACCIONES */}
              {tipo && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Stack direction="row" justifyContent="flex-end" spacing={2}>
                    <Button
                      variant="outlined"
                      onClick={() => router.push("/eventos")}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="contained"
                      onClick={submit}
                      disabled={saving || (tipo === "partido" && loadingJugadores)}
                      endIcon={saving ? <CircularProgress size={20} /> : null}
                    >
                      {saving ? "Guardando..." : "Guardar Evento"}
                    </Button>
                  </Stack>
                </>
              )}
            </Stack>

            {error && (
              <Alert severity="error" icon={<ErrorOutlineIcon />} sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}
            <Snackbar
              open={!!error}
              autoHideDuration={6000}
              onClose={() => setError("")}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
              <Alert severity="error" onClose={() => setError("")} sx={{ width: '100%' }}>{error}</Alert>
            </Snackbar>
            <Snackbar
              open={success}
              autoHideDuration={3000}
              onClose={() => setSuccess(false)}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
              <Alert severity="success" sx={{ width: '100%' }}>✅ Evento creado correctamente</Alert>
            </Snackbar>
          </Paper>
        </motion.div>
      </Container>
    </LocalizationProvider>
  );
}
