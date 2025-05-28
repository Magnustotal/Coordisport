"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Box,
  FormControlLabel,
  Checkbox,
  IconButton,
  InputAdornment,
  Link,
  Fade,
  Collapse,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Visibility, VisibilityOff, CheckCircle } from "@mui/icons-material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// Email input
function EmailInput({ value, onChange, error, inputRef }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <TextField
      inputRef={inputRef}
      label="Correo electrónico"
      type="email"
      value={value}
      onChange={onChange}
      fullWidth
      required
      sx={{ mb: 2 }}
      error={error}
      helperText={error ? "Correo inválido" : " "}
      inputProps={{
        "aria-label": "Correo electrónico",
        "aria-describedby": "email-helper-text",
      }}
      FormHelperTextProps={{ id: "email-helper-text" }}
      autoComplete="email"
    />
  );
}

// Password input
function PasswordInput({
  label,
  value,
  onChange,
  show,
  toggleShow,
  error,
  helper,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  toggleShow: () => void;
  error: boolean;
  helper: string;
}) {
  return (
    <TextField
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      fullWidth
      required
      sx={{ mb: 2 }}
      error={error}
      helperText={helper}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="Mostrar u ocultar contraseña"
              onClick={toggleShow}
              edge="end"
            >
              {show ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      autoComplete={label === "Contraseña" ? "new-password" : "off"}
    />
  );
}

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const {
    login,
    register,
    googleLogin,
    resetPassword,
    loading,
    error,
    setError,
  } = useAuth();

  const [showWelcome, setShowWelcome] = useState(true);
  const [tab, setTab] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Recuperación de contraseña
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Validaciones
  const isEmailValid = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  const isPasswordValid = password.length >= 6;
  const doPasswordsMatch = password === confirmPassword;
  const isLoginDisabled = !isEmailValid || !isPasswordValid;
  const isRegisterDisabled =
    !isEmailValid || !isPasswordValid || !doPasswordsMatch || !acceptedTerms;

  // Gestiona los tabs y reseteo de errores/estado
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setAcceptedTerms(false);
    setSuccessMessage("");
    setTimeout(() => emailRef.current?.focus(), 150);
  };

  // Login/Register controlado por retorno del hook
  const handleSubmit = async () => {
    setError("");
    setSuccessMessage("");
    if (tab === 0) {
      // Login
      const ok = await login(email, password);
      if (ok) {
        setSuccessMessage("Sesión iniciada correctamente.");
        setSnackbarOpen(true);
        setTimeout(() => router.push("/completar-perfil"), 800);
      }
    } else {
      // Registro: validación previa al hook
      if (!acceptedTerms) {
        setError("Debes aceptar los Términos y la Política de Privacidad.");
        return;
      }
      if (!doPasswordsMatch) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      const ok = await register(email, password);
      if (ok) {
        setSuccessMessage("Cuenta creada con éxito.");
        setSnackbarOpen(true);
        setTimeout(() => router.push("/completar-perfil"), 800);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setSuccessMessage("");
  };

  useEffect(() => {
    setSnackbarOpen(false);
    setSuccessMessage("");
  }, [tab]);

  // Manejo del envío de recuperación de contraseña
  const handleForgotSubmit = async () => {
    setForgotError("");
    setForgotSuccess("");
    if (!forgotEmail.trim() || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(forgotEmail)) {
      setForgotError("Introduce un correo electrónico válido.");
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail.trim());
      setForgotSuccess("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
    } catch (error: any) {
      setForgotError(
        error?.code === "auth/user-not-found"
          ? "No existe ningún usuario con ese correo."
          : error?.message || "Error al enviar el correo."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  if (showWelcome) {
    return (
      <Box
        role="main"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(to bottom right, #121212, #1f1f1f)"
              : "linear-gradient(to bottom right, #f5f5f5, #ffffff)",
          p: 2,
        }}
      >
        <Image
          src="/logo_coordisport.png"
          alt="Logo CoordiSport"
          width={400}
          height={400}
          priority
          style={{ width: "100%", height: "auto", maxWidth: 240, marginBottom: 24 }}
        />
        <Typography variant="h6" align="center" sx={{ mb: 3 }}>
          Simplifica la gestión de transporte y convocatorias para equipos infantiles.
        </Typography>
        <Container maxWidth="xs">
          <Button
            variant="contained"
            fullWidth
            sx={{ mb: 2 }}
            onClick={() => {
              setTab(0);
              setShowWelcome(false);
            }}
          >
            Iniciar Sesión
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setTab(1);
              setShowWelcome(false);
            }}
          >
            Registrarse
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      role="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(to bottom right, #121212, #1f1f1f)"
            : "linear-gradient(to bottom right, #f5f5f5, #ffffff)",
        p: 2,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
        <Image
          src="/logo_coordisport.png"
          alt="Logo CoordiSport"
          width={400}
          height={400}
          priority
          style={{ width: "100%", height: "auto", maxWidth: 240 }}
        />
      </Box>

      <Container maxWidth="sm">
        <Fade in>
          <Paper elevation={5} sx={{ px: { xs: 3, sm: 6 }, py: 4, borderRadius: 4 }}>
            <Typography variant="h4" align="center" gutterBottom fontWeight={800}>
              {tab === 0 ? "Iniciar Sesión" : "Crear Cuenta"}
            </Typography>

            <Tabs value={tab} onChange={handleTabChange} centered sx={{ mb: 3 }}>
              <Tab label="Login" />
              <Tab label="Registro" />
            </Tabs>

            <EmailInput
              inputRef={emailRef}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!email && !isEmailValid}
            />

            <PasswordInput
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              show={showPassword}
              toggleShow={() => setShowPassword((prev) => !prev)}
              error={!!password && !isPasswordValid}
              helper={!!password && !isPasswordValid ? "Mínimo 6 caracteres" : " "}
            />

            <Collapse in={tab === 1}>
              <PasswordInput
                label="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                show={showPassword}
                toggleShow={() => setShowPassword((prev) => !prev)}
                error={!!confirmPassword && !doPasswordsMatch}
                helper={
                  !!confirmPassword && !doPasswordsMatch
                    ? "Las contraseñas no coinciden"
                    : " "
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    inputProps={{
                      "aria-label": "Aceptar términos y condiciones",
                    }}
                  />
                }
                label={
                  <Typography variant="body2">
                    Acepto los{" "}
                    <Link href="/terminos" target="_blank" rel="noopener">
                      términos y condiciones
                    </Link>{" "}
                    y la{" "}
                    <Link href="/privacidad" target="_blank" rel="noopener">
                      política de privacidad
                    </Link>
                    .
                  </Typography>
                }
                sx={{ mb: 2 }}
              />
            </Collapse>

            {tab === 0 && (
              <Box textAlign="right" mb={2}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotError("");
                    setForgotSuccess("");
                    setForgotOpen(true);
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </Box>
            )}

            {error && (
              <Alert severity="error" role="alert" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {successMessage && (
              <Alert
                severity="success"
                sx={{ mb: 2 }}
                icon={<CheckCircle />}
                role="alert"
              >
                {successMessage}
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              disabled={
                loading || (tab === 0 ? isLoginDisabled : isRegisterDisabled)
              }
              onClick={handleSubmit}
              endIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{ mb: 2, fontWeight: 600, letterSpacing: 0.3 }}
              aria-label={tab === 0 ? "Iniciar sesión" : "Registrarse"}
            >
              {tab === 0 ? "Entrar" : "Registrarse"}
            </Button>

            <Divider sx={{ my: 2, fontWeight: 500 }}>O</Divider>

            <Button
              onClick={async () => {
                const ok = await googleLogin();
                if (ok) {
                  setSuccessMessage("Sesión iniciada con Google.");
                  setSnackbarOpen(true);
                  setTimeout(() => router.push("/completar-perfil"), 800);
                }
              }}
              fullWidth
              disabled={loading}
              sx={{
                backgroundColor: "#fff",
                border: "1px solid #dadce0",
                textTransform: "none",
                fontWeight: 500,
                fontSize: 16,
                color: "#3c4043",
                gap: 1.5,
                py: 1.2,
                transition: "transform 0.2s",
                "&:hover": {
                  backgroundColor: "#f7f8f8",
                  transform: "scale(1.02)",
                },
              }}
              aria-label={
                tab === 0 ? "Acceder con cuenta de Google" : "Registrarse con Google"
              }
            >
              <Image
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google"
                width={20}
                height={20}
              />
              {tab === 0 ? "Entrar con Google" : "Registrarse con Google"}
            </Button>
          </Paper>
        </Fade>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={successMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />

      {/* Diálogo de recuperación de contraseña */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)}>
        <DialogTitle>Recuperar contraseña</DialogTitle>
        <DialogContent>
          <Typography mb={2} variant="body2">
            Escribe tu correo electrónico y te enviaremos instrucciones para restablecer la contraseña.
          </Typography>
          <TextField
            label="Correo electrónico"
            type="email"
            value={forgotEmail}
            onChange={e => setForgotEmail(e.target.value)}
            fullWidth
            required
            autoFocus
            margin="dense"
            error={!!forgotError && !forgotSuccess}
            helperText={forgotError && !forgotSuccess ? forgotError : " "}
            disabled={forgotLoading || !!forgotSuccess}
          />
          {forgotSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {forgotSuccess}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForgotOpen(false)} disabled={forgotLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleForgotSubmit}
            disabled={forgotLoading || !!forgotSuccess}
          >
            {forgotLoading ? <CircularProgress size={20} /> : "Enviar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
