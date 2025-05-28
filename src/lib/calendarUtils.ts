import { format } from "date-fns";

export function generarEnlaceGoogleCalendar(evento: any) {
  const title = encodeURIComponent(evento.title);
  const location = encodeURIComponent(evento?.data?.ubicacion?.direccion ?? "");
  const start = format(evento.start, "yyyyMMdd'T'HHmmss");
  const end = format(evento.end, "yyyyMMdd'T'HHmmss");

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${location}`;
}
