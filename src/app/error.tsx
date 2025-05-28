"use client";

import { useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  useTheme,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

interface GlobalErrorProps {
  error: Error;
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const theme = useTheme();

  useEffect(() => {
    console.error("Error capturado:", error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, sm: 5 },
            textAlign: "center",
            borderRadius: 4,
          }}
        >
          <Box sx={{ mb: 2, color: "error.main" }}>
            <ErrorOutlineIcon sx={{ fontSize: 64 }} />
          </Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            ¡Algo ha fallado!
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            {error.message ||
              "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo."}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={reset}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Reintentar
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}
