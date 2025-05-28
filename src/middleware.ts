import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Usamos matcher para proteger rutas, no hace falta el array

  // Comprobar sesión
  const cookieHeader = request.headers.get("cookie") || "";
  const hasSession = cookieHeader.includes("__session=");

  if (!hasSession) {
    // Redirección con parámetro de retorno
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Si quieres añadir lógica de rol, aquí podrías parsear el JWT y decidir
  // Por simplicidad, aquí solo protegemos por sesión

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/crear-evento",
    "/perfil/:path*",
    "/equipo/:path*",
    "/eventos/:path*",
    "/convocatorias/:path*",
    // Añade cualquier ruta sensible aquí
  ],
};
