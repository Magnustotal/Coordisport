"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Stack,
  CircularProgress,
  Alert,
  Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import dayjs from "dayjs";
import "dayjs/locale/es";

import { useUser } from "@/hooks/useUser";
import { useChat } from "@/hooks/useChat";

interface MensajeChat {
  id: string;
  autor_id: string;
  autor_nombre: string;
  mensaje: string;
  timestamp: any;
}

export default function ChatEventoPage() {
  const { eventoId } = useParams();
  const router = useRouter();
  const { perfil, loading: loadingUser } = useUser();
  const { mensajes, enviarMensaje } = useChat(eventoId as string, perfil);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const chatRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    const mensajeTrim = texto.trim();
    if (!mensajeTrim) return;

    setEnviando(true);
    try {
      await enviarMensaje(mensajeTrim);
      setTexto("");
    } catch (err) {
      console.error(err);
      setError("Error al enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  if (loadingUser) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography mt={2}>Cargando chat...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxWidth: 600,
        margin: "0 auto",
        p: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton onClick={() => router.push(`/resumen/${eventoId}`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" ml={1}>
          Chat del evento
        </Typography>
      </Box>

      <Paper
        elevation={3}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 2,
          backgroundColor: "#f4f4f4",
          borderRadius: 2,
        }}
        ref={chatRef}
      >
        <Stack spacing={1}>
          {mensajes.map((m: MensajeChat) => {
            const esPropio = m.autor_id === perfil?.id;
            return (
              <Box
                key={m.id}
                sx={{
                  display: "flex",
                  justifyContent: esPropio ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  sx={{
                    maxWidth: "75%",
                    backgroundColor: esPropio ? "#dcf8c6" : "#fff",
                    p: 1.2,
                    borderRadius: 2,
                    boxShadow: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    {esPropio ? "Tú" : m.autor_nombre}
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                    {m.mensaje}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      display: "block",
                      textAlign: "right",
                    }}
                  >
                    {dayjs(m.timestamp?.toDate()).format("DD/MM HH:mm")}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Paper>

      <Box sx={{ display: "flex", mt: 2 }}>
        <TextField
          fullWidth
          placeholder="Escribe tu mensaje..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={enviando}
        />
        <IconButton
          onClick={handleSend}
          color="primary"
          disabled={enviando || !texto.trim()}
        >
          <SendIcon />
        </IconButton>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
