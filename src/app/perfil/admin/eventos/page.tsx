"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

interface Evento {
  id: string;
  tipo: "partido" | "entrenamiento";
  fecha: string;
  hora?: string;
  hora_inicio?: string;
  equipo_id: string;
  rival?: string;
  deporte?: string;
}

export default function AdminEventosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [equipos, setEquipos] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [confirmarId, setConfirmarId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const userSnap = await getDoc(doc(db, "usuarios", user.uid));
      if (!userSnap.exists() || userSnap.data()?.rol !== "admin") {
        router.push("/perfil");
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "eventos"), async (snapshot) => {
      const data: Evento[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Evento[];

      setEventos(data);

      const equipoIds = Array.from(new Set(data.map((e) => e.equipo_id)));
      const equiposMap: Record<string, string> = {};

      await Promise.all(
        equipoIds.map(async (id) => {
          const snap = await getDoc(doc(db, "equipos", id));
          if (snap.exists()) {
            equiposMap[id] = snap.data()?.nombre || "(sin nombre)";
          }
        })
      );

      setEquipos(equiposMap);
      setLoading(false);
    }, (err) => {
      console.error("Error cargando eventos:", err);
      setError("No se pudieron cargar los eventos.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const copiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "eventos", id));
      setConfirmarId(null);
    } catch (err: any) {
      console.error("Error eliminando evento:", err.message);
      setError("No se pudo eliminar el evento.");
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Eventos registrados
        </Typography>

        {loading ? (
          <Box textAlign="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        ) : (
          <Table sx={{ mt: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Hora</strong></TableCell>
                <TableCell><strong>Equipo</strong></TableCell>
                <TableCell><strong>Deporte</strong></TableCell>
                <TableCell><strong>Rival</strong></TableCell>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {eventos.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.tipo}</TableCell>
                  <TableCell>{e.fecha}</TableCell>
                  <TableCell>{e.hora || e.hora_inicio || "—"}</TableCell>
                  <TableCell>{equipos[e.equipo_id] || e.equipo_id}</TableCell>
                  <TableCell>{e.deporte || "—"}</TableCell>
                  <TableCell>{e.rival || "—"}</TableCell>
                  <TableCell>
                    {e.id}
                    <Tooltip title="Copiar ID">
                      <IconButton size="small" onClick={() => copiar(e.id)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Editar evento">
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/admin/eventos/${e.id}/editar`)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar evento">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setConfirmarId(e.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={!!confirmarId} onClose={() => setConfirmarId(null)}>
        <DialogTitle>¿Eliminar evento?</DialogTitle>
        <DialogContent>
          Esta acción es permanente. ¿Deseas eliminar este evento?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmarId(null)}>Cancelar</Button>
          <Button color="error" onClick={() => confirmarId && handleDelete(confirmarId)}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
