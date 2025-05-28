"use client";

import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Divider,
  useTheme,
} from "@mui/material";

export default function PrivacidadPage() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 6,
        background: theme.palette.mode === "dark"
          ? "linear-gradient(to bottom right, #1a1a1a, #2c2c2c)"
          : "linear-gradient(to bottom right, #fafafa, #f0f0f0)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            boxShadow: theme.shadows[4],
          }}
        >
          <Typography variant="h4" align="center" gutterBottom fontWeight={600}>
            Política de Privacidad
          </Typography>

          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            Tu privacidad es importante para nosotros. Aquí te explicamos cómo tratamos tus datos personales.
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              ¿Quién es el responsable del tratamiento?
            </Typography>
            <Typography paragraph>
              CoordiSport es una plataforma sin ánimo de lucro, gestionada de forma independiente. Aunque no constituimos una entidad legal, nos comprometemos a cumplir con el Reglamento General de Protección de Datos (RGPD) y con la legislación vigente en España.
            </Typography>
          </Box>

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              ¿Qué datos recopilamos?
            </Typography>
            <Typography paragraph>
              Recogemos únicamente los datos que tú nos proporcionas al registrarte: nombre, apellidos, correo electrónico y número de teléfono. En ningún caso solicitamos ni almacenamos datos personales de menores de edad.
            </Typography>
          </Box>

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              ¿Para qué usamos tus datos?
            </Typography>
            <Typography paragraph>
              Utilizamos tus datos exclusivamente para ofrecerte acceso a la plataforma, facilitar la comunicación con otros usuarios (como entrenadores o padres/madres) y permitir la gestión segura de los equipos deportivos.
            </Typography>
          </Box>

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              ¿Qué servicios de terceros utilizamos?
            </Typography>
            <Typography paragraph>
              CoordiSport utiliza Firebase de Google para la autenticación de usuarios y almacenamiento de datos. Google es responsable del tratamiento dentro de sus servicios y cumple con las normativas de protección de datos aplicables. Puedes consultar sus políticas en el sitio web oficial de Google.
            </Typography>
          </Box>

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              ¿Qué derechos tienes sobre tus datos?
            </Typography>
            <Typography paragraph>
              En cualquier momento puedes acceder, modificar o eliminar tus datos desde la propia aplicación. También puedes solicitarnos la baja definitiva escribiéndonos desde los canales habilitados.
            </Typography>
          </Box>

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              ¿Durante cuánto tiempo conservamos tu información?
            </Typography>
            <Typography paragraph>
              Conservamos tus datos mientras mantengas una cuenta activa. Si decides abandonar la plataforma, puedes solicitarnos que eliminemos todos tus datos de forma permanente.
            </Typography>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            align="right"
            sx={{ mt: 4 }}
          >
            Última actualización: Mayo de 2025
          </Typography>

          <Box mt={5} textAlign="center">
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push("/")}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                px: 4,
              }}
            >
              Volver al inicio
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
