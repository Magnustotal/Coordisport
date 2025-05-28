// src/app/resumen/page.tsx
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
} from "@mui/material";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, doc, getDoc, onSnapshot, query } from "firebase/firestore";
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
import SportsIcon from "@mui/icons-material/Sports";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";
import SportsVolleyballIcon from "@mui/icons-material/SportsVolleyball";
import AddIcon from "@mui/icons-material/Add";
import {
  addHours,
  isBefore,
  parse as parseDateFnsAlias,
  isSameDay,
  isValid,
} from "date-fns";

const locales = { es: esES };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const EVENTO_TIPO = {
  PARTIDO: "partido",
  ENTRENAMIENTO: "entrenamiento",
} as const;

type EventoTipoValues = typeof EVENTO_TIPO[keyof typeof EVENTO_TIPO];

const DEPORTES = {
  FUTBOL: "Fútbol",
  BALONCESTO: "Baloncesto",
  VOLEIBOL: "Voleibol",
} as const;

type DeporteValues = typeof DEPORTES[keyof typeof DEPORTES];

const DEPORTE_ICON_MAP: Record<DeporteValues, JSX.Element> = {
  [DEPORTES.FUTBOL]: <SportsSoccerIcon fontSize="small" />,
  [DEPORTES.BALONCESTO]: <SportsBasketballIcon fontSize="small" />,
  [DEPORTES.VOLEIBOL]: <SportsVolleyballIcon fontSize="small" />,
};

interface EventoDb {
  id: string;
  tipo: EventoTipoValues;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  equipo_id: string;
  localVisitante?: "local" | "visitante";
  ubicacion?: { direccion: string };
  rival?: string;
  categoria?: string;
  equipoNombre?: string;
  deporte?: DeporteValues;
}

interface CalendarDisplayEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  tipo: EventoTipoValues;
  deporte: DeporteValues;
}

function parsearFechaHora(fecha: string, hora: string): Date | null {
  const formatos = ["dd-MM-yyyy HH:mm", "yyyy-MM-dd HH:mm", "dd/MM/yyyy HH:mm"];
  for (const f of formatos) {
    const d = parseDateFnsAlias(`${fecha} ${hora}`, f, new Date());
    if (isValid(d)) return d;
  }
  return null;
}

function formatearTitulo(e: EventoDb): string {
  if (e.tipo === EVENTO_TIPO.PARTIDO) {
    const local = e.equipoNombre || "";
    const rival = e.rival || "";
    return e.localVisitante === "local"
      ? `${local} vs ${rival}`
      : `${rival} vs ${local}`;
  }
  return `Entrenamiento ${e.equipoNombre || ""}`;
}

export default function EventosPage() {
  const router = useRouter();
  const theme = useTheme();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [rol, setRol] = useState<string>("");
  const [eventos, setEventos] = useState<EventoDb[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarInfo, setSnackbarInfo] = useState<{
    message: string;
    severity: "error" | "info" | "success" | "warning";
  } | null>(null);
  const [vista, setVista] = useState<"calendario" | "lista">("calendario");
  const [mensajeDia, setMensajeDia] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        setLoading(false);
        return;
      }
      setUser(u);
      const usnap = await getDoc(doc(db, "usuarios", u.uid));
      setRol(usnap.data()?.rol || "");
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) {
      setEventos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, "eventos"));
    const unsub = onSnapshot(
      q,
      async (qs) => {
        const evs = await Promise.all(
          qs.docs.map(async (d) => {
            const data = d.data() as any;
            let nombre = "Equipo Desconocido";
            let dep: DeporteValues = DEPORTES.FUTBOL;
            if (data.equipo_id) {
              const es = await getDoc(doc(db, "equipos", data.equipo_id));
              if (es.exists()) {
                nombre = es.data().nombre || nombre;
                dep = (es.data().deporte as DeporteValues) || dep;
              }
            }
            return {
              id: d.id,
              tipo: data.tipo,
              fecha: data.fecha,
              horaInicio: data.horaInicio,
              horaFin: data.horaFin,
              equipo_id: data.equipo_id,
              localVisitante: data.localVisitante,
              ubicacion: data.ubicacion,
              rival: data.rival,
              categoria: data.categoria,
              equipoNombre: nombre,
              deporte: dep,
            } as EventoDb;
          })
        );
        setEventos(evs);
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setSnackbarInfo({ message: "Error de conexión", severity: "error" });
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  const eventosCalendario = useMemo<CalendarDisplayEvent[]>(() => {
    return eventos
      .map((e) => {
        const start = parsearFechaHora(e.fecha, e.horaInicio);
        if (!start) return null;
        let end: Date | null = null;
        if (e.horaFin) {
          end = parsearFechaHora(e.fecha, e.horaFin);
        }
        if (!end) {
          end = addHours(start, e.tipo === EVENTO_TIPO.PARTIDO ? 2 : 1);
        }
        return {
          id: e.id,
          title: formatearTitulo(e),
          start,
          end,
          tipo: e.tipo,
          deporte: e.deporte || DEPORTES.FUTBOL,
        };
      })
      .filter((x): x is CalendarDisplayEvent => x !== null);
  }, [eventos]);

  const handleSelectEvent = (ev: CalendarDisplayEvent) => {
    if (isBefore(ev.start, new Date()) && !isSameDay(ev.start, new Date())) {
      setSnackbarInfo({ message: "Este evento ya pasó.", severity: "info" });
    } else {
      router.push(`/resumen/${ev.id}`);
    }
  };

  const handleSelectSlot = (slot: any) => {
    const dia = slot.start;
    const evs = eventosCalendario.filter((e) => isSameDay(e.start, dia));
    const msg = evs.length
      ? `Hay ${evs.length} evento(s) este día.`
      : `No hay eventos este día.${rol === "entrenador" ? " Usa '+' para añadir." : ""}`;
    setMensajeDia(msg);
    setTimeout(() => setMensajeDia(""), 5000);
  };

  const dayPropGetter = (date: Date) => ({
    style: {
      backgroundColor:
        format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
          ? theme.palette.action.hover
          : undefined,
    },
  });

  if (loading) {
    return (
      <Container
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" gutterBottom>
        Eventos
      </Typography>

      <ToggleButtonGroup
        value={vista}
        exclusive
        onChange={(_, v) => v && setVista(v)}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="calendario">Calendario</ToggleButton>
        <ToggleButton value="lista">Lista</ToggleButton>
      </ToggleButtonGroup>

      {vista === "calendario" ? (
        <Box
          sx={{
            height: { xs: 500, md: 650 },
            bgcolor: "background.paper",
            borderRadius: 1,
            p: { xs: 1, md: 2 },
            boxShadow: 1,
          }}
        >
          <BigCalendar
            localizer={localizer}
            events={eventosCalendario}
            startAccessor="start"
            endAccessor="end"
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            dayPropGetter={dayPropGetter}
            eventPropGetter={({ event }: any) => {
              const color =
                event.tipo === EVENTO_TIPO.PARTIDO
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main;
              return {
                style: {
                  backgroundColor: color,
                  color: theme.palette.getContrastText(color),
                  borderRadius: 6,
                  padding: "2px 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "0.8rem",
                  fontWeight: 500,
                },
              };
            }}
            components={{
              event: ({ event }: any) => (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {event.tipo === EVENTO_TIPO.ENTRENAMIENTO
                    ? <SportsIcon fontSize="small" />
                    : DEPORTE_ICON_MAP[event.deporte]}
                  <Typography noWrap variant="body2">{event.title}</Typography>
                </Stack>
              ),
            }}
            culture="es"
          />
        </Box>
      ) : (
        <Stack spacing={2}>
          {eventosCalendario.map((e) => (
            <Card key={e.id} elevation={2}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {e.tipo === EVENTO_TIPO.ENTRENAMIENTO
                    ? <SportsIcon />
                    : DEPORTE_ICON_MAP[e.deporte]}
                  <Typography variant="h6">{e.title}</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {format(e.start, "dd 'de' MMMM 'de' yyyy", { locale: esES })} —{" "}
                  {format(e.start, "HH:mm")}–{format(e.end, "HH:mm")}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => router.push(`/resumen/${e.id}`)}>
                  Ver detalles
                </Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      {mensajeDia && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {mensajeDia}
        </Alert>
      )}

      {rol === "entrenador" && (
        <Fab
          color="primary"
          variant="extended"
          sx={{ position: "fixed", bottom: 24, right: 24 }}
          onClick={() => router.push("/crear-evento")}
        >
          <AddIcon sx={{ mr: 1 }} />
          Añadir evento
        </Fab>
      )}

      <Snackbar
        open={!!snackbarInfo}
        autoHideDuration={6000}
        onClose={() => setSnackbarInfo(null)}
      >
        {snackbarInfo && (
          <Alert severity={snackbarInfo.severity}>{snackbarInfo.message}</Alert>
        )}
      </Snackbar>
    </Container>
  );
}
