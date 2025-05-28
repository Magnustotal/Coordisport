"use client";
import React, { useEffect, useRef } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";

interface UniformePreviewProps {
  camiseta: string;
  pantalon: string;
  medias: string;
  showLabel?: boolean;
  deporte?: string; // Opcional, por si quieres icono según deporte
}

export default function UniformePreview({
  camiseta,
  pantalon,
  medias,
  showLabel = false,
  deporte = "Fútbol",
}: UniformePreviewProps) {
  const objectRef = useRef<HTMLObjectElement | null>(null);
  const theme = useTheme();

  const recolorSVG = () => {
    const svgDoc = objectRef.current?.contentDocument;
    if (!svgDoc) return;
    const svg = svgDoc.querySelector("svg");
    if (!svg) return;

    const applyColor = (id: string, color: string) => {
      svg.querySelectorAll(`[id="${id}"]`).forEach((el) => {
        el.setAttribute("fill", color);
        (el as SVGElement).style.transition = "fill 0.3s cubic-bezier(.4,2,.6,1) 0.2s";
      });
    };

    applyColor("camiseta", camiseta);
    applyColor("pantalon", pantalon);
    applyColor("medias", medias);
  };

  useEffect(() => {
    const handleLoad = () => recolorSVG();
    const obj = objectRef.current;
    obj?.addEventListener("load", handleLoad);
    return () => obj?.removeEventListener("load", handleLoad);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    // Si ya está cargado, recolorea al cambiar props
    const tryRecolor = () => {
      try {
        recolorSVG();
      } catch {}
    };
    requestAnimationFrame(tryRecolor);
    // eslint-disable-next-line
  }, [camiseta, pantalon, medias]);

  // Selección de icono de deporte (opcional, puedes ampliar si tienes más deportes)
  const deporteIcon =
    deporte === "Fútbol" ? <SportsSoccerIcon sx={{ color: "#1976d2", fontSize: 30, mb: 1 }} /> : null;

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        bgcolor: theme.palette.mode === "dark" ? "#222" : "#fafbfc",
        boxShadow: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: { xs: "100%", sm: 180, md: 220 },
        mx: "auto",
        minHeight: 250,
        border: `2px solid ${theme.palette.divider}`,
        transition: "box-shadow 0.3s",
        "&:hover": { boxShadow: 10, bgcolor: "#f5f7fa" },
      }}
    >
      {showLabel && (
        <Typography
          variant="subtitle1"
          color="primary"
          fontWeight={700}
          textAlign="center"
          sx={{ mb: 1, letterSpacing: 0.5 }}
        >
          Previsualización de uniforme
        </Typography>
      )}

      {deporteIcon}

      <Box
        sx={{
          width: { xs: "88%", sm: 140, md: 160 },
          minHeight: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
        }}
      >
        <object
          ref={objectRef}
          type="image/svg+xml"
          data="/maniqui_final_con_id.svg"
          aria-label="Previsualización del uniforme"
          style={{
            width: "100%",
            height: "auto",
            transition: "filter 0.3s",
            filter: "drop-shadow(0 2px 8px rgba(60,60,60,0.12))",
          }}
        />
      </Box>
    </Box>
  );
}
