"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Snackbar,
  Alert,
  Grid,
  Box,
  InputLabel,
  Select,
  FormControl,
  SelectChangeEvent,
  Divider,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import UniformePreview from "@/components/UniformePreview";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReplayIcon from "@mui/icons-material/Replay";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import { useLoadScript, Autocomplete as GoogleAutocomplete } from "@react-google-maps/api";
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

export default function EditarEquipoPage() {
  const router = useRouter();
  const { id } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const formRef = useRef<HTMLDivElement>(null);

  // Google Places Autocomplete
  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onLoadAC = (ac: google.maps.places.Autocomplete) => (acRef.current = ac);
  const onPlaceChanged = () => {
    const place = acRef.current?.getPlace();
    if (place?.formatted_address) {
      setCampoLocal(place.formatted_address);
    }
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [nombreEquipo, setNombreEquipo] = useState("");
  const [deporte, setDeporte] = useState("Fútbol");
  const [categoria, setCategoria] = useState("Infantil");
  const [campoLocal, setCampoLocal] = useState("");
  const [notas, setNotas] = useState("");
  const [ultimaEdicion, setUltimaEdicion] = useState<string | null>(null);

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
    const fetchEquipo = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const docRef = doc(db, "equipos", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setNombreEquipo(data.nombre || "");
          setDeporte(data.deporte || "Fútbol");
          setCategoria(data.categoria || "Infantil");
          setCampoLocal(data.campo_local || "");
          setNotas(data.notas || "");
          setLocalColors(data.equipacion_local || localColors);
          setVisitanteColors(data.equipacion_visitante || visitanteColors);
          if (data.fecha_ultima_edicion?.toDate) {
            setUltimaEdicion(new Date(data.fecha_ultima_edicion.toDate()).toLocaleString("es-ES"));
          }
        } else {
          setError("Equipo no encontrado.");
        }
      } catch (err) {
        setError("Error al cargar el equipo.");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipo();
    // eslint-disable-next-line
  }, [id]);

  const handleColorChange = (
    tipo: "local" | "visitante",
    prenda: "camiseta" | "pantalon" | "medias",
    color: string
  ) => {
    const setter = tipo === "local" ? setLocalColors : setVisitanteColors;
    setter((prev) => ({ ...prev, [prenda]: color }));
  };

  const resetEquipaciones = () => {
    setLocalColors({ camiseta: "#FFFFFF", pantalon: "#FFFFFF", medias: "#FFFFFF" });
    setVisitanteColors({ camiseta: "#000000", pantalon: "#000000", medias: "#000000" });
  };

  const validar = (): boolean => {
    if (!nombreEquipo || !deporte || !categoria || !campoLocal) {
      setError("Todos los campos son obligatorios.");
      formRef.current?.scrollIntoView({ behavior: "smooth" });
      return false;
    }
    return true;
  };

  const handleGuardar = async () => {
    if (!validar()) return;
    try {
      await updateDoc(doc(db, "equipos", id as string), {
        nombre: nombreEquipo,
        deporte,
        categoria,
        campo_local: campoLocal,
        notas,
        equipacion_local: localColors,
        equipacion_visitante: visitanteColors,
        fecha_ultima_edicion: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => router.push("/equipo"), 1200);
    } catch (err) {
      setError("Error al guardar los cambios.");
    }
  };

  const renderBloqueEquipacion = (
    tipo: "local" | "visitante",
    coloresActuales: { camiseta: string; pantalon: string; medias: string }
  ) => (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight="bold">
          Equipación {tipo === "local" ? "Local" : "Visitante"}
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {["camiseta", "pantalon", "medias"].map((prenda) => (
            <Grid item xs={12} sm={4} key={`${tipo}-${prenda}`}>
              <FormControl fullWidth>
                <InputLabel>{prenda.charAt(0).toUpperCase() + prenda.slice(1)}</InputLabel>
                <Select
                  value={coloresActuales[prenda as keyof typeof coloresActuales]}
                  label={prenda}
                  onChange={(e) =>
                    handleColorChange(tipo, prenda as any, e.target.value)
                  }
                  renderValue={(selected) => (
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: selected,
                          marginRight: 1,
                          border: "1px solid #ccc",
                        }}
                      />
                      {colores.find((c) => c.valor === selected)?.nombre}
                    </Box>
                  )}
                >
                  {colores.map((color) => (
                    <MenuItem key={color.valor} value={color.valor}>
                      <Box display="flex" alignItems="center">
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            backgroundColor: color.valor,
                            marginRight: 1,
                            border: "1px solid #ccc",
                          }}
                        />
                        {color.nombre}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" mt={2}>
              <UniformePreview
                camiseta={coloresActuales.camiseta}
                pantalon={coloresActuales.pantalon}
                medias={coloresActuales.medias}
              />
            </Box>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  if (loading || !mapsLoaded) {
    return (
      <Container sx={{ mt: 4 }}>
        <CircularProgress sx={{ display: "block", mx: "auto", my: 6 }} />
        <Typography align="center" sx={{ mt: 2 }}>
          Cargando equipo...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.44 }}
      >
        <Paper
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            boxShadow: 5,
            background: theme.palette.background.paper,
            mb: 3,
          }}
          ref={formRef}
        >
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar
              sx={{
                bgcolor: "primary.main",
                width: 60,
                height: 60,
                boxShadow: 2,
                mr: 1.5,
              }}
            >
              <SportsSoccerIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Editar equipo
              </Typography>
              {ultimaEdicion && (
                <Typography variant="body2" color="text.secondary">
                  Última edición: {ultimaEdicion}
                </Typography>
              )}
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2} mb={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre del equipo"
                value={nombreEquipo}
                onChange={(e) => setNombreEquipo(e.target.value)}
                required
                error={!nombreEquipo}
                helperText={!nombreEquipo ? "Campo obligatorio" : ""}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Deporte</InputLabel>
                <Select
                  value={deporte}
                  label="Deporte"
                  onChange={(e: SelectChangeEvent) => {
                    const nuevoDeporte = e.target.value;
                    setDeporte(nuevoDeporte);
                    setCategoria(categoriasPorDeporte[nuevoDeporte][0] || "");
                  }}
                >
                  {deportes.map((dep) => (
                    <MenuItem key={dep} value={dep}>
                      {dep}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={categoria}
                  label="Categoría"
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  {(categoriasPorDeporte[deporte] || []).map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <GoogleAutocomplete
                onLoad={onLoadAC}
                onPlaceChanged={onPlaceChanged}
                restrictions={{ country: "es" }}
              >
                <TextField
                  label="Campo local"
                  value={campoLocal}
                  onChange={(e) => setCampoLocal(e.target.value)}
                  required
                  error={!campoLocal}
                  helperText={!campoLocal ? "Campo obligatorio" : ""}
                  fullWidth
                />
              </GoogleAutocomplete>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Notas del equipo (opcional)"
                multiline
                rows={3}
                fullWidth
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </Grid>
          </Grid>

          {renderBloqueEquipacion("local", localColors)}
          {renderBloqueEquipacion("visitante", visitanteColors)}

          <Box
            position={isMobile ? "fixed" : "static"}
            bottom={isMobile ? 0 : "auto"}
            left={0}
            width="100%"
            bgcolor={theme.palette.background.paper}
            boxShadow={isMobile ? 4 : 0}
            p={isMobile ? 2 : 0}
            zIndex={isMobile ? 1300 : "auto"}
            mt={isMobile ? 2 : 3}
          >
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ReplayIcon />}
                onClick={resetEquipaciones}
              >
                Restablecer equipaciones
              </Button>
              <Button variant="outlined" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={handleGuardar}>
                Guardar cambios
              </Button>
            </Stack>
          </Box>
        </Paper>
      </motion.div>

      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError("")}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
      <Snackbar open={success} autoHideDuration={2300} onClose={() => setSuccess(false)}>
        <Alert severity="success">Cambios guardados correctamente</Alert>
      </Snackbar>
    </Container>
  );
}
