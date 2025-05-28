"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Stack,
  Button,
  Fab,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  CardActions,
  useTheme,
  Divider,
  useMediaQuery,
  Chip,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  CalendarToday as CalendarTodayIcon,
  List as ListIcon,
  Sports as SportsIcon,
  SportsSoccer as SportsSoccerIcon,
  SportsBasketball as SportsBasketballIcon,
  SportsVolleyball as SportsVolleyballIcon,
  Add as AddIcon,
  Event as EventIcon,
  Group as GroupIcon,
  Place as PlaceIcon,
  InfoOutlined as InfoOutlinedIcon,
} from "@mui/icons-material";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  Views,
} from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import esES from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  addHours,
  isBefore,
  isValid,
  isSameDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  isAfter,
  subDays,
  addDays,
  compareAsc,
} from "date-fns";
import { motion } from "framer-motion";

const locales = { es: esES };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface Evento {
  id: string;
  tipo: string;
  fecha?: string;
  fechaInicio?: string;
  fechaFin?: string;
  hora?: string;
  horaInicio?: string;
  horaFin?: string;
  equipo_id: string;
  equipoNombre?: string;
  condicion?: "local" | "visitante";
  ubicacion?: { direccion: string };
  rival?: string;
  deporte?: string;
  categoria?: string;
  dias?: string[];
}

function parsearFechaHoraFlexible(fecha: string, hora: string): Date | null {
  const formatos = ["dd-MM-yyyy HH:mm", "yyyy-MM-dd HH:mm", "dd/MM/yyyy HH:mm"];
  for (const formato of formatos) {
    const date = parse(`${fecha} ${hora}`, formato, new Date());
    if (isValid(date)) return date;
  }
  return null;
}

// Expande entrenamientos recurrentes a eventos individuales
function expandirEntrenamientos(evento: Evento) {
  if (
    evento.tipo !== "entrenamiento" ||
    !evento.fechaInicio ||
    !evento.fechaFin ||
    !evento.horaInicio ||
    !evento.horaFin ||
    !Array.isArray(evento.dias)
  )
    return [];

  // Mapeo de días de la semana
  const diasSemanaMap: Record<string, number> = {
    Lunes: 1,
    Martes: 2,
    Miércoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sábado: 6,
    Domingo: 0,
  };
  const ocurrencias: any[] = [];
  let actual = parse(evento.fechaInicio, "dd-MM-yyyy", new Date());
  const fin = parse(evento.fechaFin, "dd-MM-yyyy", new Date());

  while (!isAfter(actual, fin)) {
    // Si el día de la semana está seleccionado
    const diaActual = actual.getDay();
    if (
      evento.dias.some(
        (nombreDia: string) => diasSemanaMap[nombreDia] === diaActual
      )
    ) {
      const [hIni, mIni] = evento.horaInicio.split(":").map(Number);
      const [hFin, mFin] = evento.horaFin.split(":").map(Number);
      const fechaIni = new Date(actual);
      fechaIni.setHours(hIni, mIni, 0, 0);
      const fechaFin = new Date(actual);
      fechaFin.setHours(hFin, mFin, 0, 0);
      ocurrencias.push({
        ...evento,
        id: `${evento.id}_${format(actual, "yyyyMMdd")}`,
        start: fechaIni,
        end: fechaFin,
        title: "Entrenamiento",
        deporte: evento.deporte || "Fútbol",
        tipo: "entrenamiento",
        equipo_id: evento.equipo_id,
        equipoNombre: evento.equipoNombre,
      });
    }
    actual = addDays(actual, 1);
  }
  return ocurrencias;
}

export default function EventosPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [user, setUser] = useState<any>(null);
  const [rol, setRol] = useState("");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vista, setVista] = useState<"calendario" | "lista">("calendario");
  const [equipos, setEquipos] = useState<Record<string, { nombre: string; deporte: string }>>({});
  const [mensajeDia, setMensajeDia] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) return router.push("/login");
      setUser(u);
      const userSnap = await getDoc(doc(db, "usuarios", u.uid));
      if (userSnap.exists()) setRol(userSnap.data().rol);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const cargarEventos = async () => {
      try {
        const eventosSnap = await getDocs(collection(db, "eventos"));
        const eventosData: Evento[] = eventosSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Evento[];

        const equipoIds = Array.from(new Set(eventosData.map((e) => e.equipo_id)));
        const equipoNombres: Record<string, { nombre: string; deporte: string }> = {};
        await Promise.all(
          equipoIds.map(async (id) => {
            const snap = await getDoc(doc(db, "equipos", id));
            if (snap.exists()) {
              const data = snap.data();
              equipoNombres[id] = {
                nombre: data.nombre,
                deporte: data.deporte || "Fútbol",
              };
            }
          })
        );

        setEventos(eventosData);
        setEquipos(equipoNombres);
      } catch (err: any) {
        setError("Error al cargar eventos: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    cargarEventos();
  }, [user]);

  // Corrige la distinción entre local/visitante
  const formatearTitulo = (evento: Evento) => {
    const equipo = equipos[evento.equipo_id];
    const nombreEquipo = equipo?.nombre || "Tu equipo";
    const rival = evento.rival || "Rival";
    // Usar evento.condicion en vez de localVisitante
    if (evento.tipo === "partido") {
      if (evento.condicion === "local") {
        return `${nombreEquipo} vs ${rival}`;
      } else if (evento.condicion === "visitante") {
        return `${rival} vs ${nombreEquipo}`;
      }
      return `${nombreEquipo} vs ${rival}`;
    }
    return "Entrenamiento";
  };

  // Expande partidos y entrenamientos
  const eventosExpandidos = useMemo(() => {
    let resultado: any[] = [];
    eventos.forEach((e) => {
      if (e.tipo === "entrenamiento") {
        resultado = resultado.concat(expandirEntrenamientos(e));
      } else {
        // Eventos de partido normales
        const horaValida = e.hora || e.horaInicio || "00:00";
        if (!e.fecha || !horaValida) return;
        const start = parsearFechaHoraFlexible(e.fecha, horaValida);
        if (!start) return;
        const end = addHours(start, 1);
        const equipo = equipos[e.equipo_id];
        const deporte = equipo?.deporte || "Fútbol";
        resultado.push({
          id: e.id,
          title: formatearTitulo(e),
          start,
          end,
          tipo: e.tipo,
          deporte,
          equipo_id: e.equipo_id,
          ubicacion: e.ubicacion,
        });
      }
    });
    return resultado;
  }, [eventos, equipos]);

  // Ordenar cronológicamente (más próximos primero)
  const eventosOrdenados = useMemo(() => {
    return [...eventosExpandidos].sort((a, b) => compareAsc(a.start, b.start));
  }, [eventosExpandidos]);

  const handleSelectEvent = (event: any) => {
    const idReal = event.id.includes("_") ? event.id.split("_")[0] : event.id;
    router.push(`/resumen/${idReal}`);
  };

  const handleSelectSlot = (slotInfo: any) => {
    const fecha = slotInfo.start;
    const eventosEseDia = eventosExpandidos.filter((e) => isSameDay(e.start, fecha));
    if (eventosEseDia.length === 0) {
      setMensajeDia("No hay eventos programados para este día.");
      if (rol === "entrenador") {
        setTimeout(() => {
          if (confirm("¿Deseas crear un evento para este día?")) {
            router.push("/crear-evento");
          }
        }, 300);
      }
      setTimeout(() => setMensajeDia(""), 4000);
    }
  };

  const eventoIcono = (evento: any, size = "medium") => {
    const iconProps = { sx: { mr: 1, fontSize: size === "large" ? 28 : 22 } };
    if (evento.tipo === "entrenamiento") return <SportsIcon color="primary" {...iconProps} />;
    switch (evento.deporte) {
      case "Fútbol":
        return <SportsSoccerIcon color="success" {...iconProps} />;
      case "Baloncesto":
        return <SportsBasketballIcon color="warning" {...iconProps} />;
      case "Voleibol":
        return <SportsVolleyballIcon color="info" {...iconProps} />;
      default:
        return <EventIcon color="secondary" {...iconProps} />;
    }
  };

  // Leyenda visual según deportes activos en eventos
  const deportesPresentes = Array.from(
    new Set(eventosExpandidos.map((e) => e.deporte))
  );

  const ahora = new Date();
  const unaSemanaAtras = subDays(ahora, 7);
  const eventosFuturos = eventosOrdenados.filter((e) => isAfter(e.start, ahora));
  const eventosRecientes = eventosOrdenados.filter(
    (e) => isBefore(e.start, ahora) && isAfter(e.start, unaSemanaAtras)
  );

  if (loading) {
    return (
      <Container sx={{ mt: 6 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, mb: 3, boxShadow: 5 }}>
          <Stack direction="row" alignItems="center" spacing={1.2} mb={2}>
            <EventIcon color="primary" fontSize="large" />
            <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700}>
              Eventos
            </Typography>
            <Chip
              color="primary"
              variant="outlined"
              label={`Total: ${eventosOrdenados.length}`}
              sx={{ ml: 2, fontWeight: 700 }}
            />
          </Stack>
          {/* Leyenda de iconos */}
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <InfoOutlinedIcon sx={{ color: "text.secondary" }} fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Leyenda:&nbsp;
            </Typography>
            {deportesPresentes.includes("Fútbol") && (
              <Chip icon={<SportsSoccerIcon color="success" />} label="Fútbol" size="small" />
            )}
            {deportesPresentes.includes("Baloncesto") && (
              <Chip icon={<SportsBasketballIcon color="warning" />} label="Baloncesto" size="small" />
            )}
            {deportesPresentes.includes("Voleibol") && (
              <Chip icon={<SportsVolleyballIcon color="info" />} label="Voleibol" size="small" />
            )}
            {deportesPresentes.includes(undefined) && (
              <Chip icon={<EventIcon color="secondary" />} label="Otros" size="small" />
            )}
            <Chip icon={<SportsIcon color="primary" />} label="Entrenamiento" size="small" />
          </Stack>

          <ToggleButtonGroup
            value={vista}
            exclusive
            onChange={(_, val) => val && setVista(val)}
            fullWidth={isMobile}
            sx={{ mb: 2, mt: 1 }}
            color="primary"
          >
            <ToggleButton value="calendario" sx={{ fontWeight: 600 }}>
              <CalendarTodayIcon sx={{ mr: 1 }} />
              Calendario
            </ToggleButton>
            <ToggleButton value="lista" sx={{ fontWeight: 600 }}>
              <ListIcon sx={{ mr: 1 }} />
              Lista
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {vista === "lista" ? (
          <>
            <Typography variant="h6" sx={{ display: "flex", alignItems: "center", mb: 1, fontWeight: 600 }}>
              <EventIcon sx={{ mr: 1 }} color="primary" />
              Próximos eventos
            </Typography>
            <Stack spacing={2} mb={4}>
              {eventosFuturos.length === 0 && (
                <Alert severity="info" sx={{ my: 2 }}>
                  No hay próximos eventos programados.
                </Alert>
              )}
              {eventosFuturos.map((e: any) => (
                <Card
                  key={e.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    boxShadow: 2,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": { transform: "translateY(-2px) scale(1.015)", boxShadow: 4 },
                  }}
                >
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1.3} sx={{ mb: 0.5 }}>
                      <Tooltip title="Fecha y hora">
                        <EventIcon fontSize="small" color="action" />
                      </Tooltip>
                      <Typography variant="body2" color="text.secondary">
                        {format(e.start, "EEEE dd/MM/yyyy", { locale: esES })} a las {format(e.start, "HH:mm")}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      {eventoIcono(e, "large")} {e.title}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={1}>
                      <Chip icon={<GroupIcon />} label={equipos[e.equipo_id]?.nombre} />
                      <Chip icon={<PlaceIcon />} label={e.ubicacion?.direccion || "Ubicación no especificada"} />
                    </Stack>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => router.push(`/resumen/${e.id.split("_")[0]}`)}>
                      Ver más detalles
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Stack>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" sx={{ display: "flex", alignItems: "center", mb: 1, fontWeight: 600 }}>
              <EventIcon sx={{ mr: 1 }} color="secondary" />
              Eventos recientes
            </Typography>
            <Stack spacing={2}>
              {eventosRecientes.length === 0 && (
                <Alert severity="info" sx={{ my: 2 }}>
                  No hay eventos recientes.
                </Alert>
              )}
              {eventosRecientes.map((e: any) => (
                <Card
                  key={e.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    boxShadow: 1,
                    opacity: 0.8,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": { transform: "translateY(-2px) scale(1.015)", boxShadow: 4 },
                  }}
                >
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {format(e.start, "EEEE dd/MM/yyyy", { locale: esES })} a las {format(e.start, "HH:mm")}
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      sx={{ display: "flex", alignItems: "center", mb: 1 }}
                    >
                      {eventoIcono(e, "large")} {e.title}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => router.push(`/resumen/${e.id.split("_")[0]}`)}>
                      Ver más detalles
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Stack>
          </>
        ) : (
          <Paper
            elevation={2}
            sx={{
              p: isMobile ? 0.5 : 2,
              backgroundColor: "#f7fbff",
              borderRadius: 4,
              mb: 4,
              mt: 1,
              boxShadow: 2,
            }}
          >
            <BigCalendar
              date={currentDate}
              onNavigate={(newDate, _view, action) =>
                setCurrentDate(
                  action === "TODAY"
                    ? today
                    : action === "PREV"
                    ? addMonths(currentDate, -1)
                    : addMonths(currentDate, 1)
                )
              }
              localizer={localizer}
              events={eventosOrdenados}
              startAccessor="start"
              endAccessor="end"
              defaultView={Views.MONTH}
              views={[Views.MONTH]}
              style={{
                height: isMobile ? 480 : 650,
                backgroundColor: "white",
                borderRadius: 10,
                padding: isMobile ? 3 : 10,
                marginTop: 4,
              }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={(event) => {
                const color = event.tipo === "partido" ? "#1976d2" : "#8e24aa";
                return {
                  style: {
                    backgroundColor: color,
                    borderRadius: "6px",
                    color: "#fff",
                    padding: "2px 6px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  },
                };
              }}
              components={{
                event: ({ event }) => (
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {eventoIcono(event, "large")} {event.title}
                  </span>
                ),
              }}
              culture="es"
              messages={{
                allDay: "Todo el día",
                previous: "Anterior",
                next: "Siguiente",
                today: "Hoy",
                month: "Mes",
                week: "Semana",
                day: "Día",
                date: "Fecha",
                time: "Hora",
                event: "Evento",
                noEventsInRange: "No hay eventos en este rango",
                showMore: (total) => `+ ver ${total} más`,
              }}
            />
          </Paper>
        )}

        {mensajeDia && (
          <Box mt={2}>
            <Alert severity="info">{mensajeDia}</Alert>
          </Box>
        )}

        {rol === "entrenador" && (
          <Fab
            color="primary"
            variant="extended"
            sx={{
              position: "fixed",
              bottom: 28,
              right: 28,
              boxShadow: 4,
              fontWeight: 600,
              zIndex: 1600,
              transition: "background 0.15s",
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
            onClick={() => router.push("/crear-evento")}
          >
            <AddIcon sx={{ mr: 1 }} />
            Añadir evento
          </Fab>
        )}

        <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError("")}>
          <Alert severity="error">{error}</Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
}
