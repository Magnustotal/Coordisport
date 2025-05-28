"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const roles = ["padre", "entrenador", "admin"];

export default function EditarUsuarioAdminPage() {
  const { id } = useParams();
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");

      const snap = await getDoc(doc(db, "usuarios", user.uid));
      if (!snap.exists() || snap.data()?.rol !== "admin") {
        router.push("/perfil");
        return;
      }

      try {
        const usuarioSnap = await getDoc(doc(db, "usuarios", id as string));
        if (!usuarioSnap.exists()) throw new Error("Usuario no encontrado.");
        setUserData({ id: usuarioSnap.id, ...usuarioSnap.data() });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => authUnsub();
  }, [id, router]);

  const handleChange = (field: string, value: any) => {
    setUserData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!userData.nombre?.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      await setDoc(doc(db, "usuarios", userData.id), {
        nombre: userData.nombre || "",
        apellidos: userData.apellidos || "",
        telefono: userData.telefono || "",
        rol: userData.rol,
        activo: userData.activo !== false,
      }, { merge: true });

      setSuccess("✅ Cambios guardados");
    } catch (err: any) {
      setError("Error al guardar: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userData?.email) {
      setError("Este usuario no tiene correo registrado.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, userData.email);
      setSuccess("Correo de restablecimiento enviado.");
    } catch (err: any) {
      setError("Error al enviar correo: " + err.message);
    }
  };

  const handleDeactivate = async () => {
    try {
      await setDoc(doc(db, "usuarios", userData.id), {
        activo: false,
      }, { merge: true });

      setSuccess("Cuenta desactivada.");
      setUserData((prev: any) => ({ ...prev, activo: false }));
    } catch (err: any) {
      setError("Error al desactivar cuenta: " + err.message);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!userData) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">No se pudo cargar el usuario.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          Editar usuario
        </Typography>

        <Stack spacing={2} mt={2}>
          <TextField
            label="Nombre"
            value={userData.nombre || ""}
            onChange={(e) => handleChange("nombre", e.target.value)}
            fullWidth
          />

          <TextField
            label="Apellidos"
            value={userData.apellidos || ""}
            onChange={(e) => handleChange("apellidos", e.target.value)}
            fullWidth
          />

          <TextField
            label="Teléfono"
            value={userData.telefono || ""}
            onChange={(e) => handleChange("telefono", e.target.value)}
            fullWidth
          />

          <TextField
            label="Email"
            value={userData.email || ""}
            fullWidth
            InputProps={{ readOnly: true }}
          />

          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select
              value={userData.rol || ""}
              label="Rol"
              onChange={(e) => handleChange("rol", e.target.value)}
            >
              {roles.map((r) => (
                <MenuItem key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
            <Button variant="outlined" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={guardando}>
              Guardar cambios
            </Button>
          </Stack>

          <Stack direction="row" spacing={2} mt={4}>
            <Button
              variant="outlined"
              color="info"
              onClick={handleResetPassword}
              disabled={!userData.email}
            >
              Resetear contraseña
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeactivate}
              disabled={userData.activo === false}
            >
              Desactivar cuenta
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError("")}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess("")}>
        <Alert severity="success">{success}</Alert>
      </Snackbar>
    </Container>
  );
}
