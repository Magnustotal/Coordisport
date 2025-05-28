"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Stack,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { auth, db } from "@/lib/firebase";

dayjs.locale("es");

interface Hijo {
  id: string;
  nombre: string;
  equipo: string;
}

interface EventoConvo {
  id: string;
  tipo: string;
  fecha: string;
  horaInicio?: string;
  equipo_id: string;
  equipoNombre: string;
  localVisitante?: string;
  rival?: string;
  estadoConv?: string; // “pendiente” | “confirmado” | “rechazado” | “no convocado”
}

export default function MisEventosPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rol, setRol] = useState<"padre" | "entrenador" | null>(null);
  const [hijos, setHijos] = useState<Hijo[]>([]);
  const [activeHijo, setActiveHijo] = useState<Hijo | null>(null);
  const [eventos, setEventos] = useState<EventoConvo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // 1. Detectar usuario y rol, cargar hijos si es padre
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      const userSnap = await getDoc(doc(db, "usuarios", u.uid));
      const data = userSnap.data() as any;
      const r = data?.rol;
      setRol(r ?? null);

      if (r === "padre") {
        const hijosSnap = await getDocs(
          collection(db, "usuarios", u.uid, "hijos")
        );
        const arr = hijosSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })) as Hijo[];
        setHijos(arr);
        setActiveHijo(arr[0] || null);
      }
    });
    return () => unsub();
  }, [router]);

  // 2. Cargar eventos según rol y, si es padre, también el estado de convocatoria
  useEffect(() => {
    if (!user || (rol === "padre" && !activeHijo)) return;
    (async () => {
      setLoading(true);
      try {
        let evSnap;
        if (rol === "entrenador") {
          evSnap = await getDocs(collection(db, "eventos"));
        } else {
          evSnap = await getDocs(
            query(
              collection(db, "eventos"),
              where("equipo_id", "==", activeHijo!.equipo)
            )
          );
        }

        const evsBasic = evSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as any),
        })) as Omit<EventoConvo, "estadoConv">[];

        if (rol === "padre") {
          // Para cada evento, obtenemos el estado de convocatoria de este hijo
          const enriched: EventoConvo[] = await Promise.all(
            evsBasic.map(async (e) => {
              const convSnap = await getDoc(doc(db, "convocatorias", e.id));
              if (convSnap.exists()) {
                const c = convSnap.data() as any;
                const all = [...(c.titulares || []), ...(c.reservas || [])];
                const item = all.find(
                  (i: any) => i.jugador_id === activeHijo!.id
                );
                return {
                  ...e,
                  estadoConv: item?.estado || "no convocado",
                };
              }
              return { ...e, estadoConv: "no convocado" };
            })
          );
          setEventos(enriched);
        } else {
          setEventos(evsBasic as EventoConvo[]);
        }
      } catch (err: any) {
        setError("Error al cargar eventos: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, rol, activeHijo]);

  // 3. Borrar evento (solo entrenador)
  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas borrar este evento?")) return;
    try {
      await deleteDoc(doc(db, "eventos", id));
      await deleteDoc(doc(db, "convocatorias", id));
      setEventos((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      setError("Error al borrar evento: " + err.message);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 6 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" gutterBottom>
        Mis Eventos
        {rol === "padre" && activeHijo
          ? ` de ${activeHijo.nombre}`
          : ""}
      </Typography>

      {rol === "padre" && hijos.length > 1 && (
        <ToggleButtonGroup
          value={activeHijo?.id}
          exclusive
          onChange={(_, val) => {
            const sel = hijos.find((h) => h.id === val) ?? hijos[0];
            setActiveHijo(sel);
          }}
          sx={{ mb: 3 }}
        >
          {hijos.map((h) => (
            <ToggleButton key={h.id} value={h.id}>
              {h.nombre}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}

      {eventos.length === 0 ? (
        <Alert severity="info">No hay eventos disponibles.</Alert>
      ) : (
        <Stack spacing={2}>
          {eventos.map((e) => {
            const isPast = dayjs(e.fecha, "DD-MM-YYYY").isBefore(
              dayjs(),
              "day"
            );
            return (
              <Card key={e.id} variant="outlined">
                <CardContent>
                  <Typography variant="h6">
                    {e.tipo === "partido"
                      ? e.localVisitante === "local"
                        ? `${e.equipoNombre} vs ${e.rival}`
                        : `${e.rival} vs ${e.equipoNombre}`
                      : "Entrenamiento"}
                  </Typography>
                  <Typography color="text.secondary">
                    {dayjs(e.fecha, "DD-MM-YYYY").format("DD-MM-YYYY")}{" "}
                    {e.horaInicio || ""}
                  </Typography>
                  {rol === "padre" && (
                    <Typography sx={{ mt: 1 }}>
                      Estado:{" "}
                      <strong>
                        {e.estadoConv === "pendiente"
                          ? "Pendiente"
                          : e.estadoConv === "confirmado"
                          ? "Confirmado"
                          : e.estadoConv === "rechazado"
                          ? "Rechazado"
                          : "No convocado"}
                      </strong>
                    </Typography>
                  )}
                </CardContent>

                <CardActions>
                  {rol === "entrenador" && (
                    <>
                      <Button
                        size="small"
                        onClick={() => router.push(`/resumen/${e.id}`)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(e.id)}
                      >
                        Borrar
                      </Button>
                    </>
                  )}
                  {rol === "padre" && !isPast && activeHijo && (
                    <Button
                      size="small"
                      onClick={() => {
                        localStorage.setItem("activeHijo", activeHijo.id);
                        router.push(`/resumen/${e.id}`);
                      }}
                    >
                      Ver detalles
                    </Button>
                  )}
                </CardActions>
              </Card>
            );
          })}
        </Stack>
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
      >
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Container>
  );
}
