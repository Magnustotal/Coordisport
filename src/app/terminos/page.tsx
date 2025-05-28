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

export default function TerminosPage() {
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
            Términos de uso de CoordiSport
          </Typography>

          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            Lee detenidamente este documento antes de usar la plataforma.
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              ¿Qué es CoordiSport?
            </Typography>
            <Typography paragraph>
              CoordiSport es una herramienta sin ánimo de lucro diseñada para entrenadores y familias que gestionan equipos deportivos infantiles. Nuestro objetivo es simplificar la organización, comunicación y seguimiento de actividades. 
            </Typography>
            <Typography paragraph>
              El uso de la aplicación es gratuito y está restringido a personas mayores de 18 años.
            </Typography>
          </Box>

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              Registro y responsabilidad del usuario
            </Typography>
            <Typography paragraph>
              Al registrarte, garantizas que los datos proporcionados son reales y que cumples con la edad mínima requerida.
              Eres responsable de proteger tus credenciales de acceso y de toda actividad realizada desde tu cuenta.
            </Typography>
          </Box>

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              Derechos de autor y propiedad
            </Typography>
            <Typography paragraph>
              Todos los contenidos y elementos visuales de la aplicación son propiedad de CoordiSport, salvo los datos introducidos por los usuarios. 
              No está permitido copiar, modificar o distribuir dicho contenido sin autorización expresa.
            </Typography>
          </Box>

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              Uso adecuado del servicio
            </Typography>
            <Typography paragraph>
              Está estrictamente prohibido utilizar la plataforma con fines comerciales, fraudulentos o que atenten contra otros usuarios. 
              CoordiSport podrá suspender o eliminar cuentas que infrinjan estas normas.
            </Typography>
          </Box>

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom fontWeight={500}>
              Cambios en los términos
            </Typography>
            <Typography paragraph>
              Podremos actualizar estas condiciones en cualquier momento. Te avisaremos si se realizan cambios importantes, pero recomendamos revisar esta sección regularmente.
              El uso continuado de la plataforma implica la aceptación de los cambios realizados.
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
