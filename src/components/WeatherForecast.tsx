// src/components/WeatherForecast.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Avatar,
} from "@mui/material";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

interface WeatherPoint {
  dt: number;
  temp: number;
  weather: {
    description: string;
    icon: string;
  }[];
}

interface WeatherForecastProps {
  lat: string;
  lon: string;
  partidoFecha: string; // "DD-MM-YYYY"
  partidoHora: string;  // "HH:mm"
}

export default function WeatherForecast({
  lat,
  lon,
  partidoFecha,
  partidoHora,
}: WeatherForecastProps) {
  const [hourly, setHourly] = useState<WeatherPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_OPENWEATHER_KEY;
    if (!key) {
      setError("Falta API key de OpenWeather.");
      return;
    }
    fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}` +
        `&exclude=current,minutely,daily,alerts&units=metric&lang=es&appid=${key}`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener datos meteorológicos");
        return res.json();
      })
      .then((data) => {
        setHourly(data.hourly);
      })
      .catch((e) => {
        console.error(e);
        setError("No se pudo cargar la previsión meteorológica.");
      });
  }, [lat, lon]);

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }
  if (!hourly) {
    return <CircularProgress size={24} />;
  }

  // Parse partido datetime
  const partido = dayjs(
    `${partidoFecha} ${partidoHora}`,
    "DD-MM-YYYY HH:mm"
  );
  // Build five target times: -2h, -1h, 0, +1h, +2h
  const targets = [-2, -1, 0, 1, 2].map((h) =>
    partido.add(h, "hour").startOf("hour")
  );

  // For each target, find a matching forecast point
  const points = targets.map((t) => {
    const found = hourly.find((p) =>
      dayjs.unix(p.dt).startOf("hour").isSame(t)
    );
    return { time: t, data: found || null };
  });

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Previsión meteorológica
      </Typography>
      <Stack direction="row" spacing={2} overflow="auto">
        {points.map(({ time, data }) => (
          <Box
            key={time.toString()}
            sx={{
              minWidth: 72,
              textAlign: "center",
              p: 1,
              borderRadius: 1,
              bgcolor: "background.paper",
              boxShadow: 1,
            }}
          >
            <Typography variant="caption">
              {time.format("HH:mm")}
            </Typography>
            {data ? (
              <>
                <Avatar
                  src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`}
                  alt={data.weather[0].description}
                  sx={{ width: 48, height: 48, mx: "auto", my: 0.5 }}
                />
                <Typography variant="body2">
                  {Math.round(data.temp)}°C
                </Typography>
                <Typography variant="caption" noWrap>
                  {data.weather[0].description}
                </Typography>
              </>
            ) : (
              <Typography variant="body2">—</Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
