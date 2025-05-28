import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/es'

dayjs.locale('es')
dayjs.extend(customParseFormat)

// Formatos de entrada compatibles
const INPUT_DATE_FORMATS = ['DD-MM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY']
const INPUT_DATETIME_FORMATS = ['DD-MM-YYYY HH:mm', 'YYYY-MM-DD HH:mm', 'DD/MM/YYYY HH:mm']

/**
 * Parsea fechas y horas en cualquiera de los formatos compatibles.
 * @param fecha — cadena de fecha en DD-MM-YYYY, YYYY-MM-DD o DD/MM/YYYY
 * @param hora — (opcional) cadena de hora en HH:mm
 * @returns instancia dayjs válida o null si no pudo parsear
 */
export function parseDateFlexible(fecha: string, hora?: string): dayjs.Dayjs | null {
  const target = hora ? `${fecha} ${hora}` : fecha
  const formats = hora ? INPUT_DATETIME_FORMATS : INPUT_DATE_FORMATS
  for (const fmt of formats) {
    const d = dayjs(target, fmt, 'es', true)
    if (d.isValid()) return d
  }
  return null
}

/**
 * Formatea una fecha en estilo corto dd-MM-YYYY
 */
export function formatShort(date: string | Date | dayjs.Dayjs): string {
  return dayjs(date).format('DD-MM-YYYY')
}

/**
 * Formatea una fecha en estilo largo “D de MMMM de YYYY”
 */
export function formatLong(date: string | Date | dayjs.Dayjs): string {
  return dayjs(date).format('D [de] MMMM [de] YYYY')
}
