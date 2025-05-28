"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function RecuperarContraseñaPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Por favor, introduce tu correo electrónico.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
      setEmail("");
    } catch (error: any) {
      setError("Error al enviar correo de recuperación: " + (error.code === "auth/user-not-found"
        ? "No existe ningún usuario con ese correo."
        : error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Paper elevation={4} sx={{ width: "100%", p: 4, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <IconButton aria-label="Volver" onClick={() => router.back()}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={700} ml={1}>
            Recuperar contraseña
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" mb={2}>
          Escribe tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            autoFocus
            disabled={loading}
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? "Enviando..." : "Enviar instrucciones"}
          </Button>
        </form>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Paper>
    </Container>
  );
}
