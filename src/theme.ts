// src/theme.ts
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light", // puedes cambiar a "dark" para probar el modo oscuro
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#ff4081",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

export default theme;
