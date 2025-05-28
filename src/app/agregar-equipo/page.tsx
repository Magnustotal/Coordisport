"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
} from "firebase/firestore";
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
} from "@mui/material";
import UniformePreview from "@/components/UniformePreview";
import { useLoadScript } from "@react-google-maps/api";

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

export default function AgregarEquipoPage() {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [nombreEquipo, setNombreEquipo] = useState("");
  const [deporte, setDeporte] = useState("Fútbol");
  const [categoria, setCategoria] = useState("Infantil");
  const [campoLocal, setCampoLocal] = useState("");

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

  const campoRef = useRef<HTMLInputElement>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (isLoaded && campoRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(campoRef.current);
      autocomplete.setFields(["formatted_address"]);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) setCampoLocal(place.formatted_address);
      });
    }
  }, [isLoaded]);

  const handleColorChange = (
    tipo: "local" | "visitante",
    prenda: "camiseta" | "pantalon" | "medias",
    color: string
  ) => {
    const setter = tipo === "local" ? setLocalColors : setVisitanteColors;
    setter((prev) => ({ ...prev, [prenda]: color }));
  };

  const validar = (): boolean => {
    if (!nombreEquipo || !deporte || !categoria || !campoLocal) {
      setError("Todos los campos son obligatorios.");
      return false;
    }
    return true;
  };

  const handleGuardar = async () => {
    if (!validar()) return;

    const nuevoEquipo = {
      nombre: nombreEquipo,
      deporte,
      categoria,
      campo_local: campoLocal,
      equipacion_local: localColors,
      equipacion_visitante: visitanteColors,
    };

    try {
      const docRef = await addDoc(collection(db, "equipos"), nuevoEquipo);
      await updateDoc(doc(db, "usuarios", user!.uid), {
        equipos_asignados: arrayUnion(docRef.id),
      });
      setSuccess(true);
      setTimeout(() => router.push("/equipo"), 1500);
    } catch (err) {
      console.error(err);
      setError("Error al guardar el equipo.");
    }
  };

  const renderSelector = (
    tipo: "local" | "visitante",
    prenda: "camiseta" | "pantalon" | "medias",
    colorActual: string
  ) => (
    <Grid item xs={12} sm={4} key={`${tipo}-${prenda}`}>
      <FormControl fullWidth>
        <InputLabel>{prenda.charAt(0).toUpperCase() + prenda.slice(1)}</InputLabel>
        <Select
          value={colorActual}
          label={prenda}
          onChange={(e) => handleColorChange(tipo, prenda, e.target.value)}
          renderValue={(selected) => (
            <Box display="flex" alignItems="center">
              <Box
                sx={{
                  width: 18,
                  height: 18,
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
                    width: 18,
                    height: 18,
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
  );

  const renderBloqueEquipacion = (
    tipo: "local" | "visitante",
    coloresActuales: { camiseta: string; pantalon: string; medias: string }
  ) => (
    <Box sx={{ mt: 5 }}>
      <Divider textAlign="left" sx={{ mb: 2 }}>
        <Typography variant="h6">
          Equipación {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
        </Typography>
      </Divider>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            {["camiseta", "pantalon", "medias"].map((prenda) =>
              renderSelector(tipo, prenda as any, coloresActuales[prenda as keyof typeof coloresActuales])
            )}
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box display="flex" justifyContent="center">
            <Box width={160}>
              <UniformePreview
                camiseta={coloresActuales.camiseta}
                pantalon={coloresActuales.pantalon}
                medias={coloresActuales.medias}
              />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Container sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Agregar Equipo
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre del equipo"
              value={nombreEquipo}
              onChange={(e) => setNombreEquipo(e.target.value)}
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
            <TextField
              fullWidth
              inputRef={campoRef}
              label="Campo local"
              value={campoLocal}
              onChange={(e) => setCampoLocal(e.target.value)}
            />
          </Grid>
        </Grid>

        {renderBloqueEquipacion("local", localColors)}
        {renderBloqueEquipacion("visitante", visitanteColors)}

        <Box mt={4}>
          <Button variant="contained" fullWidth onClick={handleGuardar}>
            Guardar equipo
          </Button>
        </Box>
      </Paper>

      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError("")}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success">Equipo guardado correctamente</Alert>
      </Snackbar>
    </Container>
  );
}
