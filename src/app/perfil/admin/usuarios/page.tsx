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
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
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
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";

type Rol = "padre" | "entrenador" | "admin";

interface Usuario {
  id: string;
  nombre?: string;
  apellidos?: string;
  email?: string;
  rol?: Rol;
  activo?: boolean;
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState<"todos" | Rol>("todos");
  const [error, setError] = useState("");
  const [confirmarId, setConfirmarId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const snap = await db.collection("usuarios").doc(user.uid).get();
      if (!snap.exists || snap.data()?.rol !== "admin") {
        router.push("/perfil");
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "usuarios"),
      (snapshot) => {
        const data: Usuario[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Usuario[];
        setUsuarios(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando usuarios:", err);
        setError("No se pudieron cargar los usuarios.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const copiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
  };

  const usuariosFiltrados =
    filtro === "todos" ? usuarios : usuarios.filter((u) => u.rol === filtro);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "usuarios", id));
      setConfirmarId(null);
    } catch (err: any) {
      console.error("Error eliminando usuario:", err.message);
      setError("No se pudo eliminar el usuario.");
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Usuarios registrados
        </Typography>

        <ToggleButtonGroup
          color="primary"
          value={filtro}
          exclusive
          onChange={(_, value) => value && setFiltro(value)}
          sx={{ mt: 2 }}
        >
          <ToggleButton value="todos">Todos</ToggleButton>
          <ToggleButton value="padre">Padres</ToggleButton>
          <ToggleButton value="entrenador">Entrenadores</ToggleButton>
          <ToggleButton value="admin">Admins</ToggleButton>
        </ToggleButtonGroup>

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
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Rol</strong></TableCell>
                <TableCell><strong>Activo</strong></TableCell>
                <TableCell><strong>UID</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usuariosFiltrados.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.nombre || "—"}</TableCell>
                  <TableCell>{u.email || "—"}</TableCell>
                  <TableCell>{u.rol || "—"}</TableCell>
                  <TableCell>{u.activo === false ? "No" : "Sí"}</TableCell>
                  <TableCell>
                    {u.id}
                    <Tooltip title="Copiar UID">
                      <IconButton size="small" onClick={() => copiar(u.id)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Editar usuario">
                      <IconButton
                        size="small"
                        onClick={() => router.push(`/admin/usuarios/${u.id}/editar`)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {u.rol !== "admin" && (
                      <Tooltip title="Eliminar usuario">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setConfirmarId(u.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={!!confirmarId} onClose={() => setConfirmarId(null)}>
        <DialogTitle>¿Eliminar usuario?</DialogTitle>
        <DialogContent>
          Esta acción es permanente. ¿Deseas eliminar este usuario?
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
