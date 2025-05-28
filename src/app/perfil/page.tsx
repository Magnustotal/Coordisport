"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PerfilRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirigirSegunRol = async () => {
      try {
        const res = await fetch("/api/usuario");
        const data = await res.json();
        const rol = data?.rol;

        if (rol === "entrenador") {
          router.push("/perfil/entrenador");
        } else if (rol === "padre") {
          router.push("/perfil/padre");
        } else if (rol === "admin") {
          router.push("/perfil/admin");
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error al obtener rol:", error);
        router.push("/login");
      }
    };

    redirigirSegunRol();
  }, [router]);

  return null;
}
