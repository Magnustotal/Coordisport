"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import {
  doc,
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from "firebase/auth";
import { motion } from "framer-motion";
import {
  Container,
  Paper,
  Box,
  Typography,
  Avatar,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Tooltip,
  IconButton,
} from "@mui/material";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";

type DeporteValido = "Fútbol" | "Baloncesto" | "Voleibol";
interface EquipoOption { id: string; nombre: string; }

const DEPORTES: DeporteValido[] = ["Fútbol", "Baloncesto", "Voleibol"];

const CATEGORY_MAP: Record<DeporteValido, { nombre: string; min: number }[]> = {
  Fútbol: [
    { nombre: "Prebenjamín", min: 2017 },
    { nombre: "Benjamín", min: 2015 },
    { nombre: "Alevín", min: 2013 },
    { nombre: "Infantil", min: 2011 },
    { nombre: "Cadete", min: 2009 },
    { nombre: "Juvenil", min: 2006 },
  ],
  Baloncesto: [
    { nombre: "Preminibasket", min: 2015 },
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

const validaDocumento = (tipo: string, valor: string) => {
  const dni = /^[0-9]{8}[A-Za-z]$/;
  const nie = /^[XYZxyz][0-9]{7}[A-Za-z]$/;
  const pasaporte = /^[A-Za-z0-9]{5,9}$/;
  if (tipo === "DNI") return dni.test(valor);
  if (tipo === "NIE") return nie.test(valor);
  return pasaporte.test(valor);
};

export default function AgregarHijoPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const nombreRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [equipos, setEquipos] = useState<EquipoOption[]>([]);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [camiseta, setCamiseta] = useState("");
  const [dorsal, setDorsal] = useState("");
  const [docTipo, setDocTipo] = useState("DNI");
  const [docValor, setDocValor] = useState("");
  const [deporte, setDeporte] = useState<DeporteValido>("Fútbol");
  const [fechaNac, setFechaNac] = useState("");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoria, setCategoria] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.replace("/login");
      else {
        setUser(u);
        setTimeout(() => nombreRef.current?.focus(), 120);
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "equipos"));
        const list = snap.docs
          .map((d) => ({ id: d.id, nombre: d.data().nombre as string }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
        setEquipos(list);
      } catch (e: any) {
        setError("Error cargando equipos: " + e.message);
      }
    })();
  }, []);

  useEffect(() => {
    const cats = CATEGORY_MAP[deporte].map((c) => c.nombre);
    setCategorias(cats);
    setCategoria("");
  }, [deporte]);

  useEffect(() => {
    if (!fechaNac) return;
    const año = new Date(fechaNac).getFullYear();
    const found = CATEGORY_MAP[deporte].find((c) => año >= c.min);
    if (found) setCategoria(found.nombre);
  }, [fechaNac, deporte]);

  // Preview de foto
  useEffect(() => {
    if (foto) {
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(foto);
    } else {
      setFotoPreview(null);
    }
  }, [foto]);

  const handleFotoRemove = () => {
    setFoto(null);
    setFotoPreview(null);
  };

  const handleSubmit = async () => {
    if (!nombre || !apellidos || !docValor || !fechaNac || !categoria || !equipoId) {
      setError("Por favor completa todos los campos obligatorios.");
      return;
    }
    if (!validaDocumento(docTipo, docValor)) {
      setError(`Formato de ${docTipo} inválido.`);
      return;
    }
    if (foto && foto.size > 1024 * 1024) {
      setError("La foto no puede superar 1MB.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let fotoURL = "";
      if (foto) {
        const storageRef = ref(storage, `usuarios/${user!.uid}/hijos/${nombre}_${apellidos}_foto`);
        await uploadBytes(storageRef, foto);
        fotoURL = await getDownloadURL(storageRef);
      }

      // 1) Agregar hijo en “usuarios/{uid}/hijos”
      const hijosRef = collection(db, "usuarios", user!.uid, "hijos");
      const hijoDoc = await addDoc(hijosRef, {
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
        fotoURL,
      });

      // 2) Asociar en array del padre
      const parentRef = doc(db, "usuarios", user!.uid);
      await updateDoc(parentRef, {
        hijos: arrayUnion(hijoDoc.id),
      });

      setSuccess(true);
      setTimeout(() => router.push("/perfil/padre"), 1400);
    } catch (e: any) {
      setError("Error al guardar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: isMobile ? 4 : 8, mb: 6 }}>
      <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }}>
        <Paper elevation={5} sx={{ p: { xs: 2.5, sm: 5 }, borderRadius: 4 }}>
          <Box textAlign="center" mb={3}>
            <Avatar sx={{ bgcolor: "primary.main", width: 64, height: 64, mx: "auto", mb: 1 }}>
              <FamilyRestroomIcon fontSize="large" />
            </Avatar>
            <Typography variant="h5" fontWeight={800}>
              Agregar hijo/a
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ maxWidth: 330, mx: "auto" }}>
              Registra los datos de tu hijo/a para poder gestionarlo en el equipo
            </Typography>
          </Box>

          <Stack spacing={2.2}>
            <TextField
              label="Nombre"
              inputRef={nombreRef}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Nombre en camiseta (opcional)"
              value={camiseta}
              onChange={(e) => setCamiseta(e.target.value)}
              fullWidth
            />
            <TextField
              label="Dorsal (opcional)"
              type="number"
              inputProps={{ min: 1, max: 99 }}
              value={dorsal}
              onChange={(e) => setDorsal(e.target.value)}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Tipo de documento"
                value={docTipo}
                onChange={(e) => setDocTipo(e.target.value)}
                fullWidth
                required
              >
                {["DNI", "NIE", "Pasaporte"].map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Número de documento"
                value={docValor}
                onChange={(e) => setDocValor(e.target.value)}
                fullWidth
                required
              />
            </Stack>
            <Box>
              <InputLabel sx={{ mb: 0.5 }}>Foto (opcional, máx. 1MB)</InputLabel>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  sx={{ fontWeight: 600 }}
                >
                  Subir foto
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setFoto(e.target.files?.[0] || null)}
                  />
                </Button>
                {fotoPreview && (
                  <>
                    <Avatar
                      src={fotoPreview}
                      sx={{ width: 48, height: 48, ml: 1 }}
                      alt="Foto del hijo/a"
                    />
                    <Tooltip title="Eliminar foto">
                      <IconButton onClick={handleFotoRemove} color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Stack>
            </Box>

            <TextField
              select
              label="Deporte"
              value={deporte}
              onChange={(e) => setDeporte(e.target.value as DeporteValido)}
              fullWidth
              required
            >
              {DEPORTES.map((d) => (
                <MenuItem key={d} value={d}>{d}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Fecha de nacimiento"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={fechaNac}
              onChange={(e) => setFechaNac(e.target.value)}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Categoría</InputLabel>
              <Select value={categoria} label="Categoría" onChange={(e) => setCategoria(e.target.value)}>
                {categorias.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Equipo</InputLabel>
              <Select value={equipoId} label="Equipo" onChange={(e) => setEquipoId(e.target.value)}>
                {equipos.map((eq) => (
                  <MenuItem key={eq.id} value={eq.id}>{eq.nombre}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {error && (
              <Fade in={!!error}>
                <Alert severity="error" onClose={() => setError("")}>
                  {error}
                </Alert>
              </Fade>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={1}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => router.back()}
                disabled={loading}
                sx={{
                  minWidth: 120,
                  borderRadius: 2,
                  fontWeight: 500,
                  fontSize: "1rem",
                  bgcolor: "grey.50",
                }}
                aria-label="Cancelar"
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={loading}
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
                sx={{
                  minWidth: 170,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: "1rem",
                  boxShadow: 2,
                }}
              >
                {loading ? "Guardando..." : "Guardar hijo/a"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </motion.div>
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ fontWeight: 500 }}>
          Hijo/a registrado correctamente
        </Alert>
      </Snackbar>
    </Container>
  );
}
