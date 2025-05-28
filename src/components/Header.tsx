"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Box,
} from "@mui/material";
import SportsHandballIcon from "@mui/icons-material/SportsHandball";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { motion } from "framer-motion";

export default function Header() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { toggleSidebar } = useSidebar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserEmail(user.email ?? null);
        const res = await fetch("/api/usuario");
        const data = await res.json();
        setUserRole(data?.rol ?? null);
      } else {
        setUserEmail(null);
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/sessionlogout", { method: "POST" });
    await signOut(auth);
    router.push("/login");
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getInitials = (email: string | null) =>
    email ? email.charAt(0).toUpperCase() : "";

  const appTitle =
    userRole === "entrenador"
      ? "CoordiSport Entrenador"
      : userRole === "padre"
      ? "CoordiSport Familias"
      : "CoordiSport";

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {isMobile && (
          <Tooltip title="Abrir menú">
            <IconButton edge="start" color="inherit" onClick={toggleSidebar}>
              <MenuIcon />
            </IconButton>
          </Tooltip>
        )}

        <SportsHandballIcon sx={{ mx: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {appTitle}
        </Typography>

        {userEmail && (
          <Box>
            <Tooltip title={userEmail}>
              <IconButton onClick={handleMenuOpen} color="inherit">
                <Avatar sx={{ bgcolor: "#fff", color: "#000" }}>
                  {getInitials(userEmail)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  router.push("/perfil");
                }}
              >
                <AccountCircleIcon sx={{ mr: 1 }} />
                Mi perfil
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  router.push("/eventos");
                }}
              >
                <CalendarMonthIcon sx={{ mr: 1 }} />
                Mis eventos
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  handleLogout();
                }}
              >
                <LogoutIcon sx={{ mr: 1 }} />
                Cerrar sesión
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
