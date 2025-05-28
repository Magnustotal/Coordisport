"use client";

import React, { useEffect, useState, useCallback } from "react";
import { doc, getDoc, updateDoc, DocumentData } from "firebase/firestore";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Snackbar,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { PerfilUsuario } from "@/hooks/useUser";
import { db, auth } from "@/lib/firebase";

interface TransporteEntryFirestore {
  jugador_id: string;
  nombre_padre: string;
  nombre_hijo: string;
  plazas: number;
  telefono: string | null;
  tipo: "oferta" | "solicitud";
}

interface HijoData {
  nombre: string;
  apellidos: string;
}

interface TransportePadreProps {
  eventoId: string;
  currentUserProfile: PerfilUsuario | null;
  hijoConvocado: HijoData | null;
  eventoEquipoId: string;
}

function cleanUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : v])
  ) as T;
}

export default function TransportePadre({
  eventoId,
  currentUserProfile,
  hijoConvocado,
}: TransportePadreProps) {
  // UID del usuario autenticado
  const userUid =
    currentUserProfile?.id ||
    (typeof window !== "undefined" && auth.currentUser?.uid) ||
    null;

  const [currentUserTransporte, setCurrentUserTransporte] =
    useState<TransporteEntryFirestore | null>(null);
  const [plazas, setPlazas] = useState<number>(1);
  const [tipoTransporte, setTipoTransporte] = useState<"oferta" | "solicitud">("oferta");
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [ofertas, setOfertas] = useState<TransporteEntryFirestore[]>([]);
  const [solicitudes, setSolicitudes] = useState<TransporteEntryFirestore[]>([]);

  // Nombres de los hijos (puedes adaptar si tienes más de uno)
  const nombreHijos =
    hijoConvocado?.nombre && hijoConvocado?.apellidos
      ? `${hijoConvocado.nombre} ${hijoConvocado.apellidos}`.trim()
      : "hijo/a convocado";

  // Fetch transporte global y el del usuario actual (filtrado por el uid del padre)
  const fetchTransporteData = useCallback(async () => {
    if (!eventoId || !userUid) return;
    setLoading(true);
    setError("");
    try {
      const ref = doc(db, "convocatorias", eventoId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as DocumentData;
        const currentOfertas = Array.isArray(data.transporte?.ofertas)
          ? data.transporte?.ofertas
          : [];
        const currentSolicitudes = Array.isArray(data.transporte?.solicitudes)
          ? data.transporte?.solicitudes
          : [];
        setOfertas(currentOfertas);
        setSolicitudes(currentSolicitudes);

        // Busca solo tu propia entrada por jugador_id = uid del padre
        const userOffer = currentOfertas.find(
          (o: TransporteEntryFirestore) => o.jugador_id === userUid
        );
        const userRequest = currentSolicitudes.find(
          (s: TransporteEntryFirestore) => s.jugador_id === userUid
        );
        setCurrentUserTransporte(userOffer || userRequest || null);
        setIsEditing(!!(userOffer || userRequest));
        if (userOffer) {
          setTipoTransporte("oferta");
          setPlazas(userOffer.plazas);
        } else if (userRequest) {
          setTipoTransporte("solicitud");
          setPlazas(userRequest.plazas);
        }
      } else {
        setCurrentUserTransporte(null);
        setIsEditing(false);
        setOfertas([]);
        setSolicitudes([]);
        setTipoTransporte("oferta");
        setPlazas(1);
      }
    } catch (err) {
      setError("No se pudo cargar el estado del transporte.");
      setCurrentUserTransporte(null);
      setIsEditing(false);
      setOfertas([]);
      setSolicitudes([]);
      setTipoTransporte("oferta");
      setPlazas(1);
    } finally {
      setLoading(false);
    }
  }, [eventoId, userUid]);

  useEffect(() => {
    fetchTransporteData();
  }, [fetchTransporteData]);

  const handleOpenDialog = (editMode = false) => {
    setIsEditing(editMode);
    setOpenDialog(true);
    setError("");
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    if (!currentUserTransporte) {
      setTipoTransporte("oferta");
      setPlazas(1);
    }
  };

  const handleSubmitTransporte = async () => {
    if (!currentUserProfile || !userUid) {
      setError("Faltan datos para registrar el transporte.");
      return;
    }
    if (plazas < 1 || plazas > 7) {
      setError("Elige un número de plazas válido (1-7).");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");

    const newEntry: TransporteEntryFirestore = cleanUndefined({
      jugador_id: userUid,
      nombre_padre:
        `${currentUserProfile.nombre || ""} ${currentUserProfile.apellidos || ""}`.trim() ||
        "Padre/Madre",
      nombre_hijo: nombreHijos,
      plazas: plazas,
      telefono: currentUserProfile.telefono ?? null,
      tipo: tipoTransporte,
    });

    const ref = doc(db, "convocatorias", eventoId);
    try {
      const convSnap = await getDoc(ref);
      if (!convSnap.exists())
        throw new Error("Documento de convocatoria no encontrado.");

      let currentTransportData = convSnap.data()?.transporte || {
        ofertas: [],
        solicitudes: [],
      };

      // Elimina cualquier entrada anterior del usuario en ambos arrays
      let updatedOfertas = (Array.isArray(currentTransportData.ofertas)
        ? currentTransportData.ofertas
        : []
      ).filter(
        (o: TransporteEntryFirestore) => o.jugador_id !== userUid
      );

      let updatedSolicitudes = (Array.isArray(currentTransportData.solicitudes)
        ? currentTransportData.solicitudes
        : []
      ).filter(
        (s: TransporteEntryFirestore) => s.jugador_id !== userUid
      );

      if (tipoTransporte === "oferta") {
        updatedOfertas.push(newEntry);
      } else {
        updatedSolicitudes.push(newEntry);
      }

      await updateDoc(ref, {
        "transporte.ofertas": updatedOfertas,
        "transporte.solicitudes": updatedSolicitudes,
      });

      await fetchTransporteData();
      setSuccessMsg(
        isEditing
          ? "Transporte actualizado correctamente."
          : tipoTransporte === "oferta"
          ? "Oferta registrada correctamente."
          : "Solicitud registrada correctamente."
      );
      handleCloseDialog();
    } catch (error: any) {
      setError(
        error?.message ||
          "No se pudo guardar la información de transporte. Revisa que todos los campos estén completos."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTransporte = async () => {
    if (!userUid || !currentUserTransporte) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");
    const ref = doc(db, "convocatorias", eventoId);
    try {
      const convSnap = await getDoc(ref);
      if (!convSnap.exists())
        throw new Error("Documento de convocatoria no encontrado.");

      let currentTransportData = convSnap.data()?.transporte || {
        ofertas: [],
        solicitudes: [],
      };

      let updatedOfertas = (Array.isArray(currentTransportData.ofertas)
        ? currentTransportData.ofertas
        : []
      ).filter(
        (o: TransporteEntryFirestore) => o.jugador_id !== userUid
      );

      let updatedSolicitudes = (Array.isArray(currentTransportData.solicitudes)
        ? currentTransportData.solicitudes
        : []
      ).filter(
        (s: TransporteEntryFirestore) => s.jugador_id !== userUid
      );

      await updateDoc(ref, {
        "transporte.ofertas": updatedOfertas,
        "transporte.solicitudes": updatedSolicitudes,
      });
      await fetchTransporteData();
      setSuccessMsg("Transporte cancelado correctamente.");
    } catch (error: any) {
      setError(
        error?.message ||
          "No se pudo cancelar el transporte. Intenta de nuevo o contacta con soporte."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!userUid) {
    return (
      <Alert severity="error">
        No se ha podido identificar el usuario autenticado. Por favor, vuelve a iniciar sesión.
      </Alert>
    );
  }

  if (loading && !currentUserTransporte) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (!currentUserProfile) {
    return (
      <Alert severity="warning">
        Faltan datos del perfil para gestionar el transporte.
      </Alert>
    );
  }

  const nombrePadreMadre =
    `${currentUserProfile.nombre || ""} ${currentUserProfile.apellidos || ""}`.trim() || "Tú";

  return (
    <Stack
      spacing={1.5}
      sx={{
        mt: 2,
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        backgroundColor: "#fafafa",
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <DirectionsCarIcon color="primary" />
        <Typography variant="subtitle1" fontWeight="bold" flexGrow={1}>
          Tu gestión de transporte para este evento
        </Typography>
        <Tooltip title="Puedes compartir coche con otros padres o solicitar plazas si lo necesitas.">
          <InfoOutlinedIcon color="action" fontSize="small" />
        </Tooltip>
      </Box>

      {!currentUserProfile.telefono && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          No tienes un teléfono guardado en tu perfil. Es recomendable añadirlo para que otros padres o el entrenador puedan contactar contigo si es necesario para la organización del transporte.
        </Alert>
      )}

      <Divider />

      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Snackbar
          open={!!successMsg}
          autoHideDuration={3000}
          onClose={() => setSuccessMsg("")}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity="success" sx={{ width: "100%" }}>
            {successMsg}
          </Alert>
        </Snackbar>
      )}

      {!currentUserTransporte ? (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => handleOpenDialog(false)}
            disabled={loading}
          >
            Ofrecer o solicitar plazas
          </Button>
        </Stack>
      ) : (
        <Box>
          <Alert
            severity="info"
            sx={{ mb: 1.5, display: "flex", alignItems: "center" }}
            action={
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Modificar o cambiar tipo">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(true)}
                    disabled={loading}
                    aria-label="Modificar transporte"
                  >
                    <EditIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancelar">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={handleCancelTransporte}
                    disabled={loading}
                    aria-label="Cancelar transporte"
                  >
                    <DeleteIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>
            }
          >
            {currentUserTransporte.tipo === "oferta"
              ? `${nombrePadreMadre}, has ofrecido ${currentUserTransporte.plazas} plaza(s) para tus hijos convocados.`
              : `${nombrePadreMadre}, has solicitado ${currentUserTransporte.plazas} plaza(s) para tus hijos convocados.`}
          </Alert>
        </Box>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {isEditing ? "Modificar o cambiar tipo" : "Indicar"} oferta o solicitud de transporte
        </DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <RadioGroup
              row
              value={tipoTransporte}
              onChange={(e) => setTipoTransporte(e.target.value as "oferta" | "solicitud")}
            >
              <FormControlLabel
                value="oferta"
                control={<Radio />}
                label="Ofrecer plazas"
                disabled={loading}
              />
              <FormControlLabel
                value="solicitud"
                control={<Radio />}
                label="Solicitar plazas"
                disabled={loading}
              />
            </RadioGroup>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="plazas-select-label">Número de plazas</InputLabel>
            <Select
              labelId="plazas-select-label"
              value={plazas}
              onChange={(e) => setPlazas(Number(e.target.value))}
              label="Número de plazas"
              disabled={loading}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <MenuItem key={num} value={num}>
                  {num}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitTransporte}
            variant="contained"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={20} />
            ) : isEditing ? (
              "Actualizar"
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Listado de ofertas/solicitudes activas del equipo */}
      <Divider sx={{ my: 1 }} />
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
        Ofertas de plazas disponibles:
      </Typography>
      <List dense>
        {ofertas.length === 0 && (
          <ListItem>
            <ListItemText
              primary="Nadie ha ofrecido plazas todavía."
              primaryTypographyProps={{ color: "text.disabled" }}
            />
          </ListItem>
        )}
        {ofertas.map((oferta, idx) => (
          <ListItem key={oferta.jugador_id + idx}>
            <ListItemText
              primary={
                <>
                  <b>{oferta.nombre_padre}</b>
                  {" ha ofrecido "}
                  <b>{oferta.plazas}</b>
                  {" plaza(s) para sus hijos convocados"}
                  {oferta.nombre_hijo && ` (${oferta.nombre_hijo})`}
                  {"."}
                </>
              }
              secondary={
                oferta.telefono
                  ? `Contacto: ${oferta.telefono}`
                  : "Sin teléfono disponible"
              }
            />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
        Solicitudes de plazas:
      </Typography>
      <List dense>
        {solicitudes.length === 0 && (
          <ListItem>
            <ListItemText
              primary="No hay solicitudes de plazas."
              primaryTypographyProps={{ color: "text.disabled" }}
            />
          </ListItem>
        )}
        {solicitudes.map((solicitud, idx) => (
          <ListItem key={solicitud.jugador_id + idx}>
            <ListItemText
              primary={
                <>
                  <b>{solicitud.nombre_padre}</b>
                  {" ha solicitado "}
                  <b>{solicitud.plazas}</b>
                  {" plaza(s) para sus hijos convocados"}
                  {solicitud.nombre_hijo && ` (${solicitud.nombre_hijo})`}
                  {"."}
                </>
              }
              secondary={
                solicitud.telefono
                  ? `Contacto: ${solicitud.telefono}`
                  : "Sin teléfono disponible"
              }
            />
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
