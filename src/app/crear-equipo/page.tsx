"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  Grid,
  Box,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme,
  Avatar,
  CircularProgress,
  Chip,
  Tooltip,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import UniformePreview from "@/components/UniformePreview";
import {
  useLoadScript,
  Autocomplete as GoogleAutocomplete,
} from "@react-google-maps/api";
import { motion } from "framer-motion";

const colores = [
  { nombre: "Blanco", valor: "#FFFFFF" },
  { nombre: "Gris", valor: "#808080" },
  { nombre: "Negro", valor: "#000000" },
  { nombre: "Amarillo", valor: "#FFFF00" },
  { nombre: "Naranja", valor: "#FFA500" },
  { nombre: "Rojo", valor: "#FF0000" },
  { nombre: "Granate", valor: "#800000" },
  { nombre: "Morado", valor: "#800080" },
  { nombre: "Lavanda", valor: "#E6E6FA" },
  { nombre: "Rosa", valor: "#FFC0CB" },
  { nombre: "Salmón", valor: "#FA8072" },
  { nombre: "Verde Lima", valor: "#BFFF00" },
  { nombre: "Verde", valor: "#008000" },
  { nombre: "Verde Oscuro", valor: "#006400" },
  { nombre: "Turquesa", valor: "#40E0D0" },
  { nombre: "Azul Claro", valor: "#ADD8E6" },
  { nombre: "Celeste", valor: "#87CEEB" },
  { nombre: "Azul Marino", valor: "#000080" },
  { nombre: "Azul Petróleo", valor: "#008080" },
  { nombre: "Azul Rey", valor: "#4169E1" },
  { nombre: "Plateado", valor: "#C0C0C0" },
  { nombre: "Dorado", valor: "#FFD700" },
  { nombre: "Crema", valor: "#F5F5DC" },
];

const deportes = ["Fútbol", "Baloncesto", "Voleibol"];
const categoriasPorDeporte: Record<string, string[]> = {
  Fútbol: ["Prebenjamín", "Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil"],
  Baloncesto: ["Premini", "Mini", "Infantil", "Cadete", "Junior", "Sub-22"],
  Voleibol: ["Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil", "Junior"],
};

export default function CrearEquipoPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Google Maps Autocomplete
  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onLoadAC = (ac: google.maps.places.Autocomplete) =>
    (acRef.current = ac);
  const onPlaceChanged = () => {
    const place = acRef.current?.getPlace();
    if (place?.formatted_address) {
      setCampoLocal(place.formatted_address);
    }
  };

  const formRef = useRef<HTMLDivElement>(null);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Form state
  const [nombreEquipo, setNombreEquipo] = useState("");
  const [deporte, setDeporte] = useState(deportes[0]);
  const [categoria, setCategoria] = useState(
    categoriasPorDeporte[deportes[0]][0]
  );
  const [campoLocal, setCampoLocal] = useState("");
  const [notas, setNotas] = useState("");
  const [localColors, setLocalColors] = useState({
    camiseta: "#FFFFFF",
    pantalon: "#FFFFFF",
    medias: "#FFFFFF",
  });
  const [visitanteColors, setVisitanteColors] = useState({
    camiseta: "#000000",
    pantalon: "#000000",
    medias: "#000000",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login");
      else setUserUid(u.uid);
      setLoadingUser(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    setCategoria(categoriasPorDeporte[deporte][0] || "");
  }, [deporte]);

  const handleColorChange = (
    tipo: "local" | "visitante",
    prenda: "camiseta" | "pantalon" | "medias",
    color: string
  ) => {
    if (tipo === "local") {
      setLocalColors((prev) => ({ ...prev, [prenda]: color }));
    } else {
      setVisitanteColors((prev) => ({ ...prev, [prenda]: color }));
    }
  };

  const renderColorSelect = (
    tipo: "local" | "visitante",
    prenda: "camiseta" | "pantalon" | "medias",
    value: string
  ) => (
    <FormControl fullWidth>
      <InputLabel>
        {prenda.charAt(0).toUpperCase() + prenda.slice(1)}
      </InputLabel>
      <Select
        value={value}
        label={prenda}
        onChange={(e) => handleColorChange(tipo, prenda, e.target.value as string)}
        renderValue={(sel) => (
          <Tooltip title={colores.find((c) => c.valor === sel)?.nombre || sel}>
            <Chip
              label={colores.find((c) => c.valor === sel)?.nombre || sel}
              size="small"
              sx={{
                bgcolor: sel,
                color: theme.palette.getContrastText(sel),
                borderRadius: 2,
                fontWeight: 600,
                px: 1.3,
                minWidth: 70,
                justifyContent: "flex-start",
              }}
            />
          </Tooltip>
        )}
        MenuProps={{ PaperProps: { style: { maxHeight: 320 } } }}
      >
        {colores.map((c) => (
          <MenuItem key={c.valor} value={c.valor}>
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: c.valor,
                mr: 1.3,
                border: "1.5px solid #bbb",
              }}
            />
            {c.nombre}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const renderEquipacion = (
    tipo: "local" | "visitante",
    coloresActuales: { camiseta: string; pantalon: string; medias: string }
  ) => (
    <Accordion defaultExpanded key={tipo} sx={{ bgcolor: tipo === "local" ? "rgba(240,249,255,0.89)" : "rgba(255,245,250,0.94)", boxShadow: 1, borderRadius: 2, my: 1.5 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight="bold" color={tipo === "local" ? "primary" : "secondary"}>
          Equipación {tipo === "local" ? "Local" : "Visitante"}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {(["camiseta", "pantalon", "medias"] as const).map((prenda) => (
            <Grid item xs={12} sm={4} key={prenda}>
              {renderColorSelect(tipo, prenda, coloresActuales[prenda])}
            </Grid>
          ))}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" mt={2}>
              <UniformePreview
                camiseta={coloresActuales.camiseta}
                pantalon={coloresActuales.pantalon}
                medias={coloresActuales.medias}
                deporte={deporte}
              />
            </Box>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const validar = () => {
    if (!nombreEquipo.trim() || !campoLocal.trim()) {
      setError("El nombre y el campo local son obligatorios.");
      formRef.current?.scrollIntoView({ behavior: "smooth" });
      return false;
    }
    return true;
  };

  const handleCrear = async () => {
    if (!validar() || !userUid) return;
    try {
      const eqRef = await addDoc(collection(db, "equipos"), {
        nombre: nombreEquipo,
        deporte,
        categoria,
        campo_local: campoLocal,
        notas,
        equipacion_local: localColors,
        equipacion_visitante: visitanteColors,
        fecha_creacion: serverTimestamp(),
      });

      await updateDoc(doc(db, "usuarios", userUid), {
        equipos_asignados: arrayUnion(eqRef.id),
      });

      setSuccess(true);
      setTimeout(() => router.push("/equipo"), 1500);
    } catch (e: any) {
      setError("Error al crear equipo: " + e.message);
    }
  };

  if (loadingUser || !mapsLoaded) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="sm"
      sx={{ mt: isMobile ? 4 : 8, mb: 6 }}
      ref={formRef}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, boxShadow: 3 }}>
          <Box textAlign="center" mb={3}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 70,
                height: 70,
                mx: "auto",
                mb: 1.2,
                boxShadow: 2,
                animation: "pulse 1.7s infinite alternate",
                "@keyframes pulse": {
                  from: { filter: "brightness(0.96)" },
                  to: { filter: "brightness(1.1)" },
                },
              }}
            >
              <EmojiEventsIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" fontWeight={800} letterSpacing={0.4}>
              Crear Equipo
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
              Registra tu nuevo equipo con todos los detalles
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Stack spacing={2.2}>
            <TextField
              label="Nombre del equipo"
              value={nombreEquipo}
              onChange={(e) => setNombreEquipo(e.target.value)}
              fullWidth
              required
              variant="outlined"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Deporte</InputLabel>
                  <Select
                    value={deporte}
                    label="Deporte"
                    onChange={(e) => setDeporte(e.target.value)}
                  >
                    {deportes.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={categoria}
                    label="Categoría"
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    {categoriasPorDeporte[deporte].map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Campo local con Autocomplete */}
            <GoogleAutocomplete onLoad={onLoadAC} onPlaceChanged={onPlaceChanged}>
              <TextField
                label="Campo local"
                value={campoLocal}
                onChange={(e) => setCampoLocal(e.target.value)}
                fullWidth
                required
                variant="outlined"
                helperText="Introduce el campo y selecciónalo de la lista para mejor localización"
              />
            </GoogleAutocomplete>

            <TextField
              label="Notas (opcional)"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
            />

            {renderEquipacion("local", localColors)}
            {renderEquipacion("visitante", visitanteColors)}

            <Box
              position={isMobile ? "fixed" : "static"}
              bottom={isMobile ? 0 : "auto"}
              left={0}
              width="100%"
              bgcolor={theme.palette.background.paper}
              boxShadow={isMobile ? 3 : 0}
              p={isMobile ? 2 : 0}
              zIndex={isMobile ? 1300 : "auto"}
              sx={{
                borderRadius: isMobile ? "20px 20px 0 0" : 0,
                borderTop: isMobile ? `1.5px solid ${theme.palette.divider}` : 0,
                transition: "box-shadow 0.18s",
                mt: 3,
              }}
            >
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => router.back()}
                  sx={{
                    fontWeight: 700,
                    px: 2,
                    borderRadius: 2.5,
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCrear}
                  sx={{
                    fontWeight: 700,
                    px: 2.5,
                    borderRadius: 2.5,
                    boxShadow: 2,
                  }}
                >
                  Crear equipo
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </motion.div>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>
      <Snackbar
        open={success}
        autoHideDuration={2500}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">
          ✅ Equipo creado correctamente
        </Alert>
      </Snackbar>
    </Container>
  );
}
