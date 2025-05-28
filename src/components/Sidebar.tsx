"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  useMediaQuery,
  useTheme,
  Box,
  Divider,
  Typography,
  Avatar,
  Tooltip,
  CircularProgress,
  Fade,
} from "@mui/material";
import {
  Event as EventIcon,
  Group as GroupIcon,
  FamilyRestroom as FamilyRestroomIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
} from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useSidebar } from "@/context/SidebarContext";

const DRAWER_WIDTH = 240;

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { open, toggleSidebar } = useSidebar();

  const [rol, setRol] = useState<"entrenador" | "padre" | null>(null);
  const [email, setEmail] = useState<string>("");
  const [nombre, setNombre] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRol(null);
        setEmail("");
        setNombre("");
        setLoading(false);
        return;
      }
      setEmail(user.email || "");
      try {
        const snap = await getDoc(doc(db, "usuarios", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setRol(data.rol || null);
          setNombre(data.nombre || "");
        } else {
          setRol(null);
          setNombre("");
        }
      } catch (error) {
        console.error("Error obteniendo usuario:", error);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const getInitials = (name: string, mail: string) => {
    const source = name || mail;
    return source.trim().charAt(0).toUpperCase() || "?";
  };

  const entrenadorItems: MenuItem[] = [
    { text: "Mi perfil", icon: <AccountCircleIcon />, path: "/perfil/entrenador" },
    { text: "Mis eventos", icon: <EventIcon />, path: "/eventos" },
    { text: "Mis equipos", icon: <GroupIcon />, path: "/equipo" },
  ];

  const padreItems: MenuItem[] = [
    { text: "Mi perfil", icon: <AccountCircleIcon />, path: "/perfil/padre" },
    { text: "Mis hijos", icon: <FamilyRestroomIcon />, path: "/mis-hijos" },
    { text: "Mis eventos", icon: <EventIcon />, path: "/eventos" },
  ];

  const anonimoItems: MenuItem[] = [
    { text: "Iniciar sesión", icon: <LoginIcon />, path: "/login" },
  ];

  const menuItems = useMemo<MenuItem[]>(() => {
    if (rol === "entrenador") return entrenadorItems;
    if (rol === "padre") return padreItems;
    return anonimoItems;
  }, [rol]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  }, [router]);

  if (loading) {
    return (
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? open : true}
        onClose={toggleSidebar}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            backgroundColor: theme.palette.background.paper,
          },
        }}
        ModalProps={{ keepMounted: true }}
        aria-label="Menú de navegación"
      >
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      </Drawer>
    );
  }

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? open : true}
      onClose={toggleSidebar}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          backgroundColor: theme.palette.background.paper,
          borderRight: `1.5px solid ${theme.palette.divider}`,
        },
      }}
      ModalProps={{ keepMounted: true }}
      aria-label="Menú lateral de navegación"
    >
      <Toolbar sx={{ justifyContent: "center", py: 2 }}>
        <Link href="/" passHref>
          <Box
            sx={{
              cursor: "pointer",
              width: 172,
              height: 46,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              my: 1,
            }}
          >
            <Image
              src="/logo_coordisport.png"
              alt="CoordiSport"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </Box>
        </Link>
      </Toolbar>
      <Fade in>
        <Box sx={{ px: 2, py: 1.5, mb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40,
                fontWeight: 700,
                fontSize: "1.25rem",
                boxShadow: 2,
              }}
              aria-label="Avatar usuario"
            >
              {getInitials(nombre, email)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} noWrap>
                {nombre || "Usuario"}
              </Typography>
              <Tooltip title={email || "Invitado"}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ maxWidth: 140, display: "block", letterSpacing: 0.1 }}
                >
                  {email || "Invitado"}
                </Typography>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Fade>
      <Divider sx={{ my: 1 }} />

      <List>
        {menuItems.map(({ text, icon, path }) => (
          <ListItem key={text} disablePadding>
            <ListItemButton
              component={Link}
              href={path}
              selected={pathname === path || pathname.startsWith(path + "/")}
              onClick={() => isMobile && toggleSidebar()}
              aria-label={text}
              sx={{
                transition: "background 0.2s, box-shadow 0.2s",
                borderRadius: 1.5,
                mx: 1,
                my: 0.5,
                "&.Mui-selected, &.Mui-selected:hover": {
                  background: theme.palette.action.selected,
                  boxShadow: "0 2px 10px -8px rgba(0,0,0,0.08)",
                },
                "&:hover": {
                  background: theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
              <ListItemText
                primary={text}
                primaryTypographyProps={{
                  fontWeight: 500,
                  fontSize: "1.06rem",
                  color: "text.primary",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {rol && (
        <>
          <Divider sx={{ mb: 1, mt: 3 }} />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                sx={{
                  borderRadius: 1.5,
                  mx: 1,
                  mb: 1,
                  color: theme.palette.error.main,
                  fontWeight: 600,
                  "&:hover": {
                    background: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: theme.palette.error.main }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Cerrar sesión"
                  primaryTypographyProps={{
                    fontWeight: 600,
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
    </Drawer>
  );
}
