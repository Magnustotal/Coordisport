export interface DatosEquipo {
  id?: string;
  nombre: string;
  categoria: string;
  deporte: string;
  campo_local: string;
  equipacion_local: {
    camiseta: string;
    pantalon: string;
    medias: string;
  };
  equipacion_visitante: {
    camiseta: string;
    pantalon: string;
    medias: string;
  };
}

export interface PerfilUsuario {
  id: string;
  nombre: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  rol: "padre" | "entrenador" | "admin";
  deporte?: string;
  hijos?: string[];
  equipos_asignados?: string[];
}

export interface Convocatoria {
  jugador_id: string;
  evento_id: string;
  estado: "pendiente" | "confirmado" | "rechazado" | "cancelado";
  tipo: "titular" | "reserva";
  fecha_limite: any; // Timestamp de Firebase
}

export interface TransporteUsuario {
  id?: string;
  evento_id: string;
  usuario_id: string;
  tipo: "ofrece" | "necesita";
  plazas: number;
  punto_encuentro?: string;
}
