"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Box,
  Avatar,
  Grid,
  Typography,
  Chip,
  Divider,
  Stack,
  Button,
  Alert,
  CircularProgress,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  TextField,
} from "@mui/material";
import {
  CalendarToday as CalendarIcon,
  AccessTime as AccessTimeIcon,
  Schedule as ScheduleIcon,
  FitnessCenter as FitnessCenterIcon,
  LocationOn as LocationIcon,
  Directions as DirectionsIcon,
  ListAlt as ListAltIcon,
  Commute as CommuteIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Group as GroupIcon,
  LocalOffer as LocalOfferIcon,
  PeopleOutline as PeopleOutlineIcon,
  Info as InfoIcon,
  Help as HelpIcon,
} from "@mui/icons-material";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp, collection, query, where, getDocs, collectionGroup } from "firebase/firestore";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/es";
import { auth, db } from "@/lib/firebase";
import TransportePadre from "@/components/TransportePadre";
import WeatherForecast from "@/components/WeatherForecast";
import { PerfilUsuario } from "@/hooks/useUser";


dayjs.extend(customParseFormat);
dayjs.locale("es");

interface EventoData {
  id: string;
  tipo: "partido" | "entrenamiento";
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  convocatoria?: string;
  ubicacion: {
    direccion: string;
    latitud?: string;
    longitud?: string;
  };
  equipoNombre: string;
  creado_por: string;
  equipo_id: string;
  categoria?: string;
  deporte?: string;
  rival?: string;
  notas?: string;
}

interface JugadorConv {
  jugador_id: string | null; 
  padre_id?: string | null; 
  tipo: "titular" | "reserva";
  estado: "pendiente" | "confirmado" | "rechazado";
  nombre: string; 
  apellidos: string | null; 
  telefono: string | null; 
  motivo: string | null;
}

interface TransporteEntry {
  jugador_id: string; 
  nombre_padre: string; 
  nombre_hijo: string; 
  plazas: number;
  telefono: string | null;
  tipo: "oferta" | "solicitud";
}

interface ConvocatoriaData {
  evento_id: string | null;
  equipo_id: string | null;
  titulares: JugadorConv[];
  reservas: JugadorConv[];
  transporte?: {
    ofertas: TransporteEntry[];
    solicitudes: TransporteEntry[];
  };
  fecha_limite_confirmacion?: Timestamp;
}

interface HijoData {
    id: string;
    nombre: string;
    apellidos: string;
    equipoId?: string;
    padre_id?: string; 
}

const MotivoRechazoDialogComponent = ({ open, onClose, onSubmit }: { open: boolean, onClose: () => void, onSubmit: (motivo: string) => void }) => {
  const [motivo, setMotivo] = useState("");
  
  const handleSubmit = () => {
    onSubmit(motivo);
    setMotivo(""); 
  };

  const handleClose = () => {
    setMotivo(""); 
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Motivo del Rechazo</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{mb:2}}>
          Por favor, indica brevemente por qué se rechaza la convocatoria.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="Motivo (opcional)"
          type="text"
          fullWidth
          variant="outlined"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          multiline
          rows={3}
        />
      </DialogContent>
      <DialogActions sx={{p: '0 24px 16px'}}>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="error">Confirmar Rechazo</Button>
      </DialogActions>
    </Dialog>
  );
};

export default function ResumenEventoPage() {
  const { eventoId: eventoIdFromParams } = useParams();
  const router = useRouter();
  const theme = useTheme();

  const [motivoRechazoDialogOpen, setMotivoRechazoDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<PerfilUsuario | null>(null);
  const [rol, setRol] = useState<"padre" | "entrenador" | "admin" | null>(null);
  const [hijosDelPadre, setHijosDelPadre] = useState<HijoData[]>([]);
  const [hijoConvocado, setHijoConvocado] = useState<HijoData | null>(null); 
  const [evento, setEvento] = useState<EventoData | null>(null);
  const [convocatoria, setConvocatoria] = useState<ConvocatoriaData | null>(null);
  const [estadoHijo, setEstadoHijo] = useState<"pendiente" | "confirmado" | "rechazado" | "no-convocado" | "reserva">("no-convocado");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  const eventoId = Array.isArray(eventoIdFromParams) ? eventoIdFromParams[0] : eventoIdFromParams;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      try {
        const userDocSnap = await getDoc(doc(db, "usuarios", user.uid));
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as PerfilUsuario;
          setCurrentUserProfile(userData);
          setRol(userData?.rol || null);
          if (userData?.rol === "padre") {
            const hijosQuery = query(collection(db, "usuarios", user.uid, "hijos"));
            const hijosSnap = await getDocs(hijosQuery);
            const hijosList = hijosSnap.docs.map(d => ({ id: d.id, padre_id: user.uid, ...d.data() } as HijoData));
            setHijosDelPadre(hijosList);
          }
        } else {
          setRol(null);
          setError("Perfil de usuario no encontrado.");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Error al cargar datos del usuario.");
        setRol(null);
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUser || !rol || !eventoId) {
      if (currentUser && rol && !eventoId) setError("ID de evento no proporcionado.");
      setLoading(false); 
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const eventoDocSnap = await getDoc(doc(db, "eventos", eventoId));
        if (!eventoDocSnap.exists()) {
          throw new Error("Evento no encontrado");
        }
        const eventoDataFirebase = eventoDocSnap.data();
        const eventoTypedData = { id: eventoDocSnap.id, ...eventoDataFirebase } as EventoData;
        setEvento(eventoTypedData);

        const convDocSnap = await getDoc(doc(db, "convocatorias", eventoId));
        if (convDocSnap.exists()) {
          const convBaseData = convDocSnap.data() as any;

          const mapJugadores = async (jugadoresArray: any[], tipoDefault: "titular" | "reserva"): Promise<JugadorConv[]> => {
            if (!Array.isArray(jugadoresArray)) return [];
            return Promise.all(
              jugadoresArray.map(async (j: any) => {
                let nombreJugador = j.nombre_hijo || "Jugador Desconocido";
                let apellidosJugador = j.apellidos_hijo || null;
                let telefonoPadreContacto = j.telefono_padre || null;
                let padreIdDetectado = j.padre_id || null;

                if (j.jugador_id) { 
                  if (!padreIdDetectado) {
                    const qHijos = query(collectionGroup(db, "hijos"), where("id", "==", j.jugador_id));
                    const hijosSnaps = await getDocs(qHijos);
                    if (!hijosSnaps.empty) {
                        const hijoDoc = hijosSnaps.docs[0];
                        padreIdDetectado = hijoDoc.ref.parent.parent?.id || null; 
                    }
                  }

                  if (padreIdDetectado) {
                    const hijoDocRef = doc(db, "usuarios", padreIdDetectado, "hijos", j.jugador_id);
                    const hijoSnap = await getDoc(hijoDocRef);
                    if (hijoSnap.exists()) {
                      const datosHijo = hijoSnap.data();
                      nombreJugador = datosHijo.nombre || nombreJugador;
                      apellidosJugador = datosHijo.apellidos || null;
                    }
                    const padreSnap = await getDoc(doc(db, "usuarios", padreIdDetectado));
                    if (padreSnap.exists()) {
                        telefonoPadreContacto = padreSnap.data()?.telefono || null;
                    }
                  }
                }
                
                return {
                  jugador_id: j.jugador_id || null,
                  padre_id: padreIdDetectado,
                  tipo: j.tipo || tipoDefault,
                  estado: j.estado || "pendiente",
                  nombre: nombreJugador,
                  apellidos: apellidosJugador, 
                  telefono: telefonoPadreContacto,   
                  motivo: j.estado === "rechazado" ? (j.motivo || null) : null,
                };
              })
            );
          };

          const mapTransporte = async (transporteArray: any[]): Promise<TransporteEntry[]> => {
            if (!Array.isArray(transporteArray)) return [];
            return Promise.all(
              transporteArray.map(async (t: any) => {
                const userDocSnap = await getDoc(doc(db, "usuarios", t.jugador_id)); 
                const userData = userDocSnap.data() || {};
                return {
                  jugador_id: t.jugador_id || null,
                  nombre_padre: `${userData.nombre || "Usuario"} ${userData.apellidos || ""}`.trim(),
                  nombre_hijo: t.nombre_hijo || "Hijo no especificado",
                  plazas: t.plazas || 0,
                  telefono: userData.telefono || null,
                  tipo: t.tipo || "solicitud",
                };
              })
            );
          };
          
          const titulares = await mapJugadores(convBaseData.titulares, "titular");
          const reservas = await mapJugadores(convBaseData.reservas, "reserva");
          const ofertas = await mapTransporte(convBaseData.transporte?.ofertas);
          const solicitudes = await mapTransporte(convBaseData.transporte?.solicitudes);

          const convocatoriaData: ConvocatoriaData = {
            evento_id: convBaseData.evento_id || null,
            equipo_id: convBaseData.equipo_id || null,
            titulares,
            reservas,
            transporte: { ofertas, solicitudes },
            fecha_limite_confirmacion: convBaseData.fecha_limite_confirmacion,
          };
          setConvocatoria(convocatoriaData);

          if (rol === "padre" && hijosDelPadre.length > 0) {
            let encontrado = false;
            for (const hijo of hijosDelPadre) {
              const convTitular = titulares.find(j => j.jugador_id === hijo.id);
              if (convTitular) {
                setEstadoHijo(convTitular.estado);
                setHijoConvocado(hijo);
                encontrado = true;
                break;
              }
              const convReserva = reservas.find(j => j.jugador_id === hijo.id);
              if (convReserva) {
                setEstadoHijo(convReserva.estado === "pendiente" ? "reserva" : convReserva.estado);
                setHijoConvocado(hijo);
                encontrado = true;
                break;
              }
            }
            if (!encontrado) {
              setEstadoHijo("no-convocado");
              setHijoConvocado(null);
            }
          }
        } else {
           setConvocatoria(null);
           if (rol === "padre") {
            setEstadoHijo("no-convocado");
            setHijoConvocado(null);
           }
        }
      } catch (e: any) {
        console.error("Error loading event/convocatoria data:", e);
        setError(e.message || "Error al cargar los datos del evento.");
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser, rol, eventoId, hijosDelPadre]);

  const handleResponderConvocatoria = useCallback(async (nuevaRespuesta: "confirmado" | "rechazado", motivoDelRechazo?: string) => {
    if (!hijoConvocado?.id) {
      setError("Error: No se ha podido identificar al hijo/a para responder. Por favor, recarga la página o contacta con soporte si el problema persiste.");
      return;
    }
    if (!eventoId) {
      setError("ID de evento no disponible para responder.");
      return;
    }
    if (!convocatoria) {
      setError("Datos de la convocatoria no cargados o no existentes. No se puede responder.");
      return;
    }

    const refConvocatoria = doc(db, "convocatorias", eventoId);
    let actualizado = false;

    const actualizarListaJugadores = (lista: JugadorConv[]): JugadorConv[] => {
      if (!Array.isArray(lista)) return [];
      return lista.map(jOriginal => {
        const jugadorActualizado: JugadorConv = {
          jugador_id: jOriginal.jugador_id || null,
          padre_id: jOriginal.padre_id || null,
          tipo: jOriginal.tipo,
          estado: jOriginal.estado,
          nombre: jOriginal.nombre || "Nombre Desconocido",
          apellidos: jOriginal.apellidos || null,
          telefono: jOriginal.telefono || null,
          motivo: jOriginal.motivo || null, 
        };

        if (jOriginal.jugador_id === hijoConvocado?.id) {
          actualizado = true;
          jugadorActualizado.estado = nuevaRespuesta;
          jugadorActualizado.motivo = nuevaRespuesta === "rechazado" ? (motivoDelRechazo || null) : null;
        }
        return jugadorActualizado;
      });
    };

    const nuevosTitulares = actualizarListaJugadores(convocatoria.titulares);
    const nuevasReservas = actualizarListaJugadores(convocatoria.reservas);

    if (actualizado) {
      try {
        const updateData: any = {
          titulares: nuevosTitulares,
          reservas: nuevasReservas,
        };
        if (hijoConvocado?.id) {
            updateData[`respuestas.${hijoConvocado.id}`] = {
                estado: nuevaRespuesta,
                fecha: Timestamp.now(),
                rol: rol || null,
                motivo: nuevaRespuesta === "rechazado" ? (motivoDelRechazo || null) : null
            };
        }

        await updateDoc(refConvocatoria, updateData);
        
        setEstadoHijo(nuevaRespuesta);
        setConvocatoria(prev => prev ? ({
            ...prev,
            titulares: nuevosTitulares,
            reservas: nuevasReservas,
        }) : null);
      } catch (e: any) {
        console.error("Error al responder convocatoria:", e);
        setError(e.message || "Error al guardar la respuesta.");
      }
    } else {
      setError("No se encontró a tu hijo/a en la convocatoria actual para actualizar el estado.");
    }
  }, [hijoConvocado, eventoId, convocatoria, rol]);

  const handleBorrarEvento = async () => {
    if (!eventoId) return;
    try {
      await deleteDoc(doc(db, "eventos", eventoId));
      if (convocatoria) {
        await deleteDoc(doc(db, "convocatorias", eventoId)).catch(e => console.warn("No se pudo borrar convocatoria asociada", e));
      }
      router.push("/eventos");
    } catch (e: any)
{
      console.error("Error al borrar evento:", e);
      setError(e.message || "Error al borrar el evento.");
    }
    setOpenDeleteDialog(false);
  };

  const isPartido = evento?.tipo === "partido";
  const fechaFormateada = evento?.fecha ? dayjs(evento.fecha, "DD-MM-YYYY").format("dddd, D [de] MMMM [de] YYYY") : "Fecha no disponible";
  const horaConvocatoria = evento?.convocatoria || (isPartido ? "No especificada" : "");
  const horaInicioEvento = evento?.horaInicio || "No especificada";
  const horaFinEvento = evento?.horaFin || (isPartido && evento.horaInicio ? dayjs(evento.horaInicio, "HH:mm").add(1.5, 'hour').format("HH:mm") : "No especificada");
  const direccionCompleta = evento?.ubicacion?.direccion || "Ubicación no disponible";
  const latitud = evento?.ubicacion?.latitud;
  const longitud = evento?.ubicacion?.longitud;
  
  const googleMapsEmbedUrl = latitud && longitud && process.env.NEXT_PUBLIC_Maps_API_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_Maps_API_KEY}&q=${latitud},${longitud}&zoom=15`
    : null;
  const googleMapsDirectionsUrl = latitud && longitud 
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}` 
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccionCompleta)}`;

  const fechaLimiteConvocatoriaTS = convocatoria?.fecha_limite_confirmacion;
  let puedePadreModificarRespuesta = false;
  if (isPartido && evento?.fecha && evento?.horaInicio) {
      const defaultLimite = dayjs(`${evento.fecha}T${evento.horaInicio}`, "DD-MM-YYYYTHH:mm").subtract(12, "hour");
      if (fechaLimiteConvocatoriaTS && typeof fechaLimiteConvocatoriaTS.toDate === 'function') {
          puedePadreModificarRespuesta = dayjs().isBefore(dayjs(fechaLimiteConvocatoriaTS.toDate()));
      } else {
          puedePadreModificarRespuesta = dayjs().isBefore(defaultLimite);
      }
  }

  if (loading || !currentUser || !rol) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: "flex", justifyContent: "center", py: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !evento) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, py: 5 }}>
        <Alert severity="error" onClose={() => setError("")}>{error}</Alert>
        <Button onClick={() => router.back()} sx={{ mt: 2 }}>Volver</Button>
      </Container>
    );
  }
  
  if (!evento) {
     return (
      <Container maxWidth="md" sx={{ mt: 4, py: 5 }}>
        <Alert severity="warning">No se encontraron datos para este evento o no tienes permiso para verlo.</Alert>
         <Button onClick={() => router.back()} sx={{ mt: 2 }}>Volver</Button>
      </Container>
    );
  }

  const renderInfoItem = (icon: React.ReactNode, label: string, value?: string | null) => value && (
    <Box display="flex" alignItems="flex-start" gap={1.5} sx={{mb: 1.5}}>
      <ListItemIcon sx={{minWidth: 'auto', color: theme.palette.text.secondary, mt: 0.5 }}>{icon}</ListItemIcon>
      <ListItemText 
        primary={<Typography variant="body1" component="span" fontWeight="medium">{value}</Typography>} 
        secondary={label} 
        secondaryTypographyProps={{variant: 'caption'}}
      />
    </Box>
  );

  let alertaConvocatoriaPadre;
  if (rol === "padre" && isPartido) {
    let hijoEncontradoEnConvocatoriaDirecta = null;
    if(convocatoria && hijoConvocado){
        hijoEncontradoEnConvocatoriaDirecta = convocatoria.titulares.find(j=>j.jugador_id === hijoConvocado.id) || convocatoria.reservas.find(j=>j.jugador_id === hijoConvocado.id);
    }

    switch (estadoHijo) {
      case "confirmado":
        alertaConvocatoriaPadre = { severity: "success", message: `Has confirmado la asistencia de ${hijoConvocado?.nombre || 'tu hijo/a'}.` };
        break;
      case "rechazado":
        const motivoRechazo = hijoEncontradoEnConvocatoriaDirecta?.motivo;
        alertaConvocatoriaPadre = { severity: "error", message: `Has rechazado la convocatoria para ${hijoConvocado?.nombre || 'tu hijo/a'}.${motivoRechazo ? ` Motivo: ${motivoRechazo}` : ''}` };
        break;
      case "pendiente":
        alertaConvocatoriaPadre = { severity: "info", message: `Respuesta pendiente para la convocatoria de ${hijoConvocado?.nombre || 'tu hijo/a'}.` };
        break;
      case "reserva":
        alertaConvocatoriaPadre = { severity: "info", message: `${hijoConvocado?.nombre || 'Tu hijo/a'} ha sido incluido en la lista de reservas. Permanece atento/a por si finalmente fuera convocado.`};
        break;
      case "no-convocado":
      default:
        alertaConvocatoriaPadre = { severity: "warning", message: "No se ha encontrado una convocatoria para ninguno de tus hijos en este evento." };
        break;
    }
  }


  return (
    <Container maxWidth="md" sx={{ mt: { xs: 2, md: 4 }, mb: 6 }}>
      {error && !alertaConvocatoriaPadre && <Alert severity="error" sx={{mb:2}} onClose={() => setError("")}>{error}</Alert>}
      {!isOnline && <Alert severity="warning" sx={{ mb: 2 }}>Estás sin conexión. Algunas funcionalidades podrían estar limitadas.</Alert>}
      
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, overflow: 'hidden' }}>
        <Stack spacing={3}>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56, mr: 2 }}>
              <CalendarIcon fontSize="large" />
            </Avatar>
            <Box flexGrow={1}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                {isPartido
                  ? `${evento.equipoNombre || "Equipo"} vs ${evento.rival || "Rival"}`
                  : `Entrenamiento: ${evento.equipoNombre || "Equipo"}`}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {evento.categoria && evento.deporte ? `${evento.categoria} - ${evento.deporte}` : evento.categoria || evento.deporte || ""}
              </Typography>
            </Box>
            <Box>
              <Tooltip title="Volver">
                <IconButton onClick={() => router.back()} aria-label="Volver">
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              {rol === "entrenador" && (
                <>
                  <Tooltip title="Más acciones">
                    <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} aria-label="Más acciones">
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={() => setMenuAnchor(null)}
                    transformOrigin={{ horizontal: 'right', vertical: 'top'}}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom'}}
                  >
                    <MenuItem onClick={() => { setMenuAnchor(null); router.push(`/eventos/${eventoId}/editar`); }}>
                      <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>Editar Evento
                    </MenuItem>
                    <MenuItem onClick={() => { setMenuAnchor(null); setOpenDeleteDialog(true); }} sx={{color: 'error.main'}}>
                      <ListItemIcon><CancelIcon fontSize="small" color="error" /></ListItemIcon>Borrar Evento
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Box>
          <Divider />

          {rol === "padre" && isPartido && alertaConvocatoriaPadre && (
            <Stack spacing={2} p={2} bgcolor={theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100]} borderRadius={theme.shape.borderRadius}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon color="primary" /> Estado de Convocatoria
              </Typography>
              <Alert
                iconMapping={{
                  success: <CheckCircleIcon fontSize="inherit" />,
                  error: <CancelIcon fontSize="inherit" />,
                  info: <NotificationsIcon fontSize="inherit" />,
                  warning: <HelpIcon fontSize="inherit" />
                }}
                severity={alertaConvocatoriaPadre.severity as any}
                sx={{width: '100%', '& .MuiAlert-message': { flexGrow: 1 } }}
              >
                {alertaConvocatoriaPadre.message}
              </Alert>
              {(estadoHijo === "pendiente" || estadoHijo === "reserva") && puedePadreModificarRespuesta && hijoConvocado && (
                <Stack direction={{xs: 'column', sm: 'row'}} spacing={1.5} justifyContent="center">
                  <Button fullWidth variant="contained" color="success" onClick={() => handleResponderConvocatoria("confirmado")} startIcon={<CheckCircleIcon/>}>
                    Aceptar Convocatoria
                  </Button>
                  <Button fullWidth variant="outlined" color="error" onClick={() => setMotivoRechazoDialogOpen(true)} startIcon={<CancelIcon/>}>
                    Rechazar Convocatoria
                  </Button>
                </Stack>
              )}
              {evento && estadoHijo === "confirmado" && convocatoria && eventoId && currentUserProfile && hijoConvocado && (
                <TransportePadre 
                  eventoId={eventoId} 
                  currentUserProfile={currentUserProfile} 
                  eventoEquipoId={evento.equipo_id}
                  hijoConvocado={hijoConvocado}
                />
              )}
            </Stack>
          )}

          <Grid container spacing={{xs: 2, md: 3}}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="action"/>Detalles del Evento
              </Typography>
              <Paper variant="outlined" sx={{p: 2.5, borderRadius: 2}}>
                <Stack spacing={1.5}>
                  {renderInfoItem(<CalendarIcon fontSize="small" />, "Fecha", fechaFormateada)}
                  {isPartido && renderInfoItem(<ScheduleIcon fontSize="small" />, "Hora Convocatoria", horaConvocatoria)}
                  {renderInfoItem(<AccessTimeIcon fontSize="small" />, isPartido ? "Hora Partido" : "Hora Inicio", horaInicioEvento)}
                  {evento.tipo === "entrenamiento" && renderInfoItem(<AccessTimeIcon fontSize="small" />, "Hora Fin", horaFinEvento)}
                  {renderInfoItem(<LocationIcon fontSize="small" />, "Ubicación", direccionCompleta)}
                </Stack>
              </Paper>
              
              {googleMapsEmbedUrl && (
                <Box mt={2.5} borderRadius={2} overflow="hidden" sx={{border: `1px solid ${theme.palette.divider}`}}>
                  <iframe
                    src={googleMapsEmbedUrl}
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Mapa de ubicación del evento"
                  />
                </Box>
              )}
              <Button 
                startIcon={<DirectionsIcon />} 
                href={googleMapsDirectionsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                variant="outlined" 
                fullWidth 
                sx={{ mt: googleMapsEmbedUrl ? 1.5 : 2.5}}
              >
                Cómo llegar
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              {latitud && longitud && evento.fecha && evento.horaInicio && (
                 <WeatherForecast
                    lat={latitud}
                    lon={longitud}
                    partidoFecha={evento.fecha} 
                    partidoHora={evento.horaInicio} 
                  />
              )}
            </Grid>
          </Grid>

          {rol === "entrenador" && isPartido && convocatoria && (
            <Stack spacing={2}>
              <Divider sx={{my:1}}/>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GroupIcon color="action"/> Gestión de Convocatoria
              </Typography>
              {((convocatoria.titulares || []).length === 0 && (convocatoria.reservas || []).length === 0) ? (
                <Alert severity="info">No se ha creado o no hay jugadores en la convocatoria para este partido. <Button size="small" onClick={() => router.push(`/convocatorias/${eventoId}`)}>Gestionar Convocatoria</Button></Alert>
              ) : (
                <>
                  {[
                    { title: "Titulares", players: convocatoria.titulares || [], icon: <ListAltIcon /> },
                    { title: "Reservas", players: convocatoria.reservas || [], icon: <PeopleOutlineIcon /> }
                  ].map(section => (
                    section.players.length > 0 && 
                    <Accordion key={section.title} defaultExpanded={section.title === "Titulares"}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <ListItemIcon sx={{minWidth: 'auto', mr: 1.5, color: theme.palette.primary.main}}>{section.icon}</ListItemIcon>
                        <Typography fontWeight="medium">{section.title} ({section.players.length})</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: {xs: 1, sm: 1.5} }}>
                        <List dense disablePadding>
                          {section.players.map((j) => (
                            <ListItem key={j.jugador_id || Math.random()} divider sx={{py: 1, '&:last-child': { borderBottom: 'none'}}}>
                              <ListItemText 
                                primary={`${j.nombre} ${j.apellidos || ''}`} 
                                secondary={
                                  <>
                                    {j.telefono || "Sin teléfono"}
                                    {j.estado === "rechazado" && j.motivo && 
                                      <Typography component="span" variant="caption" color="error.main" sx={{display: 'block', mt:0.5}}>
                                        Motivo Rechazo: {j.motivo}
                                      </Typography>}
                                  </>
                                }
                              />
                              <Chip
                                label={j.estado.charAt(0).toUpperCase() + j.estado.slice(1)}
                                icon={j.estado === "confirmado" ? <CheckCircleIcon fontSize="small"/> : j.estado === "rechazado" ? <CancelIcon fontSize="small"/> : <NotificationsIcon fontSize="small"/>}
                                color={j.estado === "confirmado" ? "success" : j.estado === "rechazado" ? "error" : "warning"}
                                size="small"
                                variant="outlined"
                                sx={{ml:1}}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}

                  <Divider sx={{my:1}}/>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CommuteIcon color="action"/> Gestión de Transporte
                  </Typography>
                  {(!convocatoria.transporte || ((convocatoria.transporte.ofertas || []).length === 0 && (convocatoria.transporte.solicitudes || []).length === 0)) && 
                      <Typography variant="body2" color="text.secondary" sx={{textAlign: 'center', py: 1}}>No hay ofertas ni solicitudes de transporte registradas.</Typography>
                  }
                  {[
                    { title: "Ofertas de Transporte", entries: convocatoria.transporte?.ofertas || [], icon: <LocalOfferIcon /> },
                    { title: "Solicitudes de Transporte", entries: convocatoria.transporte?.solicitudes || [], icon: <PeopleOutlineIcon /> }
                  ].map(section => (
                     section.entries.length > 0 && 
                     <Accordion key={section.title}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <ListItemIcon sx={{minWidth: 'auto', mr: 1.5, color: theme.palette.secondary.main}}>{section.icon}</ListItemIcon>
                        <Typography fontWeight="medium">{section.title} ({section.entries.length})</Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ p: {xs: 1, sm: 1.5} }}>
                         <List dense disablePadding>
                           {section.entries.map((entry, index) => (
                             <ListItem key={`${entry.jugador_id}-${entry.tipo}-${index}`} divider sx={{py: 1, '&:last-child': { borderBottom: 'none'}}}>
                               <ListItemText 
                                 primary={`${entry.nombre_padre} (${entry.nombre_hijo ? `padre/madre de ${entry.nombre_hijo}, ` : ''}${entry.plazas} plaza${entry.plazas > 1 ? 's' : ''})`}
                                 secondary={entry.telefono || "Sin teléfono"}
                               />
                             </ListItem>
                           ))}
                         </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </>
              )}
                <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={() => router.push(`/convocatorias/${eventoId}`)}
                    sx={{mt: 2, py: 1.2}}
                    startIcon={<EditIcon />}
                >
                    {convocatoria ? "Modificar Convocatoria" : "Crear Convocatoria"}
                </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmar Eliminación de Evento</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas borrar este evento ({evento?.tipo} de {evento?.equipoNombre} el {fechaFormateada})? Esta acción es irreversible y también eliminará la convocatoria asociada si existe.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{p:2}}>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">Cancelar</Button>
          <Button color="error" onClick={handleBorrarEvento} variant="contained">
            Eliminar Evento
          </Button>
        </DialogActions>
      </Dialog>
      
      <MotivoRechazoDialogComponent
        open={motivoRechazoDialogOpen}
        onClose={() => {
            setMotivoRechazoDialogOpen(false);
        }}
        onSubmit={(motivo) => {
            handleResponderConvocatoria("rechazado", motivo);
            setMotivoRechazoDialogOpen(false);
        }}
      />

    </Container>
  );
}