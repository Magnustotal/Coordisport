"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CssBaseline, Box, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Sidebar from "../components/Sidebar";
import theme from "../theme";
import { SidebarProvider } from "../context/SidebarContext";

interface RootLayoutProps {
  children: ReactNode;
}

// Páginas que no muestran sidebar ni padding
const FULLSCREEN_ROUTES = [
  "/login",
  "/register",
  "/404",
  "/recuperar-password"
];

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname();
  // Considera variantes de rutas dinámicas si lo necesitas
  const isFullScreen = FULLSCREEN_ROUTES.some(route => pathname.startsWith(route));

  return (
    <html lang="es">
      <head>
        <title>CoordiSport</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="CoordiSport: Plataforma de gestión deportiva para equipos, entrenadores y familias. Organiza eventos, equipos y convocatorias fácilmente." />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
          <ThemeProvider theme={theme}>
            <SidebarProvider>
              <CssBaseline />
              {isFullScreen ? (
                <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {children}
                </main>
              ) : (
                <Box sx={{ display: "flex", minHeight: "100vh" }}>
                  <Sidebar />
                  <Box
                    component="main"
                    sx={{
                      flexGrow: 1,
                      p: { xs: 2, sm: 3 },
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: "background.default",
                    }}
                  >
                    {children}
                  </Box>
                </Box>
              )}
            </SidebarProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}
