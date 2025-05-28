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
import {
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

interface Equipo {
  id: string;
  nombre: string;
  deporte?: string;
  categoria?: string;
  campo_local?: string;
  entrenador_id?: string;
}

export default function AdminEquiposPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [entrenadores, setEntrenadores] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [confirmarId, setConfirmarId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const userRef = doc(db, "usuarios", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists() || snap.data()?.rol !== "admin") {
        router.push("/perfil");
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "equipos"), async (snapshot) => {
      const data: Equipo[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Equipo[];

      setEquipos(data);
      setLoading(false);

      const entrenadorIds = new Set<string>();
      data.forEach((eq) => {
        if (eq.entrenador_id) entrenadorIds.add(eq.entrenador_id);
      });

      const entrenadoresMap: Record<string, string> = {};
      await Promise.all(
        Array.from(entrenadorIds).map(async (id) => {
          const snap = await getDoc(doc(db, "usuarios", id));
          if (snap.exists()) {
            entrenadoresMap[id] = snap.data()?.nombre || "(sin nombre)";
          }
        })
      );

      setEntrenadores(entrenadoresMap);
    }, (err) => {
      console.error("Error al cargar equipos:", err);
      setError("No se pudieron cargar los equipos.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const copiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "equipos", id));
      setConfirmarId(null);
    } catch (err: any) {
      console.error("Error eliminando equipo:", err.message);
      setError("No se pudo eliminar el equipo.");
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Equipos registrados
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
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Deporte</strong></TableCell>
                <TableCell><strong>Categoría</strong></TableCell>
                <TableCell><strong>Campo local</strong></TableCell>
                <TableCell><strong>Entrenador</strong></TableCell>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipos.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell>{eq.nombre}</TableCell>
                  <TableCell>{eq.deporte || "—"}</TableCell>
                  <TableCell>{eq.categoria || "—"}</TableCell>
                  <TableCell>{eq.campo_local || "—"}</TableCell>
                  <TableCell>
                    {eq.entrenador_id
                      ? entrenadores[eq.entrenador_id] || eq.entrenador_id
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {eq.id}
                    <Tooltip title="Copiar ID">
                      <IconButton size="small" onClick={() => copiar(eq.id)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Editar equipo">
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/admin/equipos/${eq.id}/editar`)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar equipo">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setConfirmarId(eq.id)}
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
        <DialogTitle>¿Eliminar equipo?</DialogTitle>
        <DialogContent>
          Esta acción es permanente. ¿Deseas eliminar este equipo?
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
