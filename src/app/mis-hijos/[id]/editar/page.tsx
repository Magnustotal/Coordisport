"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Snackbar,
  Alert,
  Avatar,
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material";
import {
  FamilyRestroom as FamilyIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

type Deporte = "Fútbol" | "Baloncesto" | "Voleibol";

const categoriasPorDeporte: Record<Deporte, { nombre: string; min: number }[]> = {
  Fútbol: [
    { nombre: "Prebenjamín", min: 2017 },
    { nombre: "Benjamín", min: 2015 },
    { nombre: "Alevín", min: 2013 },
    { nombre: "Infantil", min: 2011 },
    { nombre: "Cadete", min: 2009 },
    { nombre: "Juvenil", min: 2006 },
  ],
  Baloncesto: [
    { nombre: "Babybasket", min: 2017 },
    { nombre: "Minibasket", min: 2013 },
    { nombre: "Infantil", min: 2011 },
    { nombre: "Cadete", min: 2009 },
    { nombre: "Junior", min: 2007 },
  ],
  Voleibol: [
    { nombre: "Benjamín", min: 2015 },
    { nombre: "Alevín", min: 2013 },
    { nombre: "Infantil", min: 2011 },
    { nombre: "Cadete", min: 2009 },
    { nombre: "Juvenil", min: 2007 },
  ],
};

interface EquipoOption {
  id: string;
  nombre: string;
}

export default function EditarHijoPage() {
  const { id } = useParams();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fileRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [equipos, setEquipos] = useState<EquipoOption[]>([]);

  // Campos controlados
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [camiseta, setCamiseta] = useState("");
  const [dorsal, setDorsal] = useState<string>("");
  const [docTipo, setDocTipo] = useState("DNI");
  const [docValor, setDocValor] = useState("");
  const [deporte, setDeporte] = useState<Deporte>("Fútbol");
  const [fechaNac, setFechaNac] = useState("");
  const [categoria, setCategoria] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoURL, setFotoURL] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser(u);
      try {
        // Cargar datos hijo
        const refH = doc(db, "usuarios", u.uid, "hijos", id as string);
        const snap = await getDoc(refH);
        if (!snap.exists()) throw new Error("Ficha no existe");
        const data = snap.data();

        setNombre(data.nombre ?? "");
        setApellidos(data.apellidos ?? "");
        setCamiseta(data.camiseta ?? "");
        setDorsal(data.dorsal ?? "");
        setDocTipo(data.docTipo ?? "DNI");
        setDocValor(data.docValor ?? "");
        setDeporte((data.deporte as Deporte) ?? "Fútbol");
        setFechaNac(data.fechaNac ?? "");
        setCategoria(data.categoria ?? "");
        setEquipoId(data.equipoId ?? "");
        setFotoURL(data.fotoURL ?? "");

        // Lista de equipos (ID y nombre)
        const snapEq = await getDocs(collection(db, "equipos"));
        setEquipos(
          snapEq.docs
            .map((d) => ({
              id: d.id,
              nombre: d.data().nombre as string,
            }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre))
        );
      } catch (e: any) {
        setError("No se pudo cargar la ficha.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [id, router]);

  // Recalcular categoría sugerida al cambiar fecha o deporte
  useEffect(() => {
    if (!fechaNac) {
      setCategoria("");
      return;
    }
    const año = new Date(fechaNac).getFullYear();
    const lista = categoriasPorDeporte[deporte];
    const cat = lista.find((c) => año >= c.min);
    setCategoria(cat?.nombre ?? "");
  }, [deporte, fechaNac]);

  const validar = () => {
    if (!nombre || !apellidos || !docValor || !fechaNac || !categoria || !equipoId) {
      setError("Por favor completa todos los campos obligatorios.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validar()) return;
    setSaving(true);
    setError("");
    try {
      const currentUser = auth.currentUser!;
      // Subir foto si hay nueva
      let newFotoURL = fotoURL;
      if (fotoFile) {
        const storageRef = ref(
          storage,
          `usuarios/${currentUser.uid}/hijos/${nombre}_${apellidos}_foto`
        );
        await uploadBytes(storageRef, fotoFile);
        newFotoURL = await getDownloadURL(storageRef);
        setFotoURL(newFotoURL);
      }
      // Guardar datos
      await setDoc(
        doc(db, "usuarios", currentUser.uid, "hijos", id as string),
        {
          nombre,
          apellidos,
          camiseta,
          dorsal: dorsal ? parseInt(dorsal, 10) : null,
          docTipo,
          docValor,
          deporte,
          fechaNac,
          categoria,
          equipoId,
          fotoURL: newFotoURL,
        },
        { merge: true }
      );
      setSuccess(true);
      setTimeout(() => router.back(), 1500);
    } catch (e: any) {
      setError("Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 4, md: 6 }, mb: 6 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
          <Box textAlign="center" mb={3}>
            <Avatar sx={{ bgcolor: "primary.main", width: 64, height: 64, mx: "auto", mb: 1 }}>
              <FamilyIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" fontWeight={700} mb={2}>
              Editar ficha de {nombre}
            </Typography>
            {fotoURL && (
              <Avatar
                src={fotoURL}
                sx={{ width: 90, height: 90, mx: "auto", mb: 2, border: "2px solid #eee" }}
              />
            )}
          </Box>

          <Stack spacing={2}>
            <TextField label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} fullWidth required />
            <TextField label="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} fullWidth required />
            <TextField label="Nombre en camiseta (opcional)" value={camiseta} onChange={(e) => setCamiseta(e.target.value)} fullWidth />
            <TextField label="Dorsal (opcional)" type="number" inputProps={{ min: 1, max: 99 }} value={dorsal} onChange={(e) => setDorsal(e.target.value)} fullWidth />
            <TextField select label="Documento" value={docTipo} onChange={(e) => setDocTipo(e.target.value)} fullWidth required>
              {["DNI", "NIE", "Pasaporte"].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Número de documento" value={docValor} onChange={(e) => setDocValor(e.target.value)} fullWidth required />

            <Button variant="outlined" component="label" fullWidth>
              Subir foto (opcional)
              <input
                ref={fileRef}
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => setFotoFile(e.target.files?.[0] || null)}
              />
            </Button>
            <TextField select label="Deporte" value={deporte} onChange={(e) => setDeporte(e.target.value as Deporte)} fullWidth required>
              {Object.keys(categoriasPorDeporte).map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
            <TextField label="Fecha de nacimiento" type="date" InputLabelProps={{ shrink: true }} value={fechaNac} onChange={(e) => setFechaNac(e.target.value)} fullWidth required />
            <FormControl fullWidth required>
              <InputLabel>Categoría</InputLabel>
              <Select value={categoria} label="Categoría" onChange={(e) => setCategoria(e.target.value)}>
                {categoriasPorDeporte[deporte].map((c) => <MenuItem key={c.nombre} value={c.nombre}>{c.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Equipo</InputLabel>
              <Select value={equipoId} label="Equipo" onChange={(e) => setEquipoId(e.target.value)}>
                {equipos.map((eq) => <MenuItem key={eq.id} value={eq.id}>{eq.nombre}</MenuItem>)}
              </Select>
            </FormControl>
            {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
            <Box display="flex" justifyContent="space-between" mt={2}>
              <Button onClick={() => router.back()} disabled={saving}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                endIcon={saving ? <CircularProgress size={20} /> : undefined}
              >
                Guardar
              </Button>
            </Box>
          </Stack>
        </Paper>
      </motion.div>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success">Ficha actualizada</Alert>
      </Snackbar>
    </Container>
  );
}
