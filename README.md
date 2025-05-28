# CoordiSport ⚽🏀🎾

<img src="./public/logo%20coordisport.png" alt="Logo CoordiSport" width="320" style="margin-bottom: 1.5rem;" />

**Estado actual del proyecto:**  
🚧 *En desarrollo - MVP funcional* 🚧

---

## Estado de las funcionalidades principales

| Funcionalidad                                        | Estado          | Detalles / Notas                                               |
|------------------------------------------------------|-----------------|----------------------------------------------------------------|
| Gestión de eventos (partidos, entrenamientos)        | ✔️ Implementada | Creación y edición de eventos; fechas, horas, ubicaciones      |
| Gestión de equipos y visualización de equipaciones   | ✔️ Implementada | Multi-equipo, datos básicos, equipaciones                      |
| Gestión de hijos y perfiles de usuario               | ✔️ Implementada | Padres pueden registrar y editar datos de sus hijos            |
| Gestión de transporte colaborativo                   | ✔️ Implementada | Oferta y asignación manual de plazas                           |
| Sistema de convocatorias y confirmaciones            | ✔️ Implementada | Selección de convocados y confirmación de asistencia           |
| Autocompletado de direcciones (Google Maps)          | ✔️ Implementada | Selección rápida de ubicaciones y botón "Cómo llegar"          |
| Integración visual de mapas                          | ✔️ Implementada | Ubicaciones con Google Maps                                    |
| Comunicación interna y notificaciones                | 🛠️ En desarrollo| Comunicación integrada y avisos por email (parcialmente)       |
| Previsión meteorológica                              | 🛠️ En desarrollo| Previsión 2h antes y 2h después de partidos (futuro/próximo)   |
| Paneles avanzados para entrenadores y admins         | 🛠️ En desarrollo| Mejoras visuales y de gestión para roles avanzados             |
| Notificaciones push                                  | ❌ Pendiente    | Previsto para futuras versiones                                |
| Accesibilidad y experiencia de usuario (UX/UI)       | 🛠️ En desarrollo| Mejoras continuas en interfaz y experiencia                    |

> **Leyenda:**  
> ✔️ Implementada — funcional en el MVP  
> 🛠️ En desarrollo — parcialmente disponible o en integración  
> ❌ Pendiente — planificada para el futuro

---

## Descripción del Proyecto

**CoordiSport** es una aplicación web desarrollada para simplificar la gestión de equipos deportivos infantiles, centrada en la **organización de eventos** (partidos y entrenamientos) y la **logística del transporte**. El objetivo es ofrecer una solución centralizada, intuitiva y fiable para familias y entrenadores, facilitando la comunicación, el control de asistencia y la organización del día a día.

### Problema identificado

La gestión de asistencia y transporte suele dispersarse en varios grupos de mensajería, generando confusión, olvidos, estrés y riesgo de descoordinación.

### Solución propuesta

CoordiSport digitaliza la experiencia:
- Centraliza **eventos y equipos** en una sola plataforma fácil de usar.
- Permite que los padres **ofrezcan y asignen plazas** de coche de forma manual y clara.
- Facilita a entrenadores la **gestión de convocatorias** y la comprobación de asistencia.
- Integra autocompletado de direcciones y la opción “Cómo llegar” gracias a **Google Maps**.
- Prepara el camino para sistemas de **comunicación interna y notificaciones** por email.
- Incorpora herramientas para el control de asistencia y confirmación de transporte.

---

## Características principales

- **Gestión de eventos:** Creación y administración de partidos y entrenamientos (fecha, hora, ubicación, equipos, condiciones...).
- **Gestión de equipos:** Multi-equipo por usuario, registro de datos clave y visualización de equipaciones.
- **Transporte colaborativo:** Padres pueden ofrecer plazas en su vehículo y asignar niños a cada plaza de manera organizada.
- **Convocatorias:** Entrenadores eligen convocados, padres confirman asistencia y transporte.
- **Autocompletado y mapas:** Selección rápida de ubicaciones gracias a Google Maps y enlace directo a “Cómo llegar”.
- **Perfiles diferenciados:** Funcionalidades específicas para entrenadores, padres y administradores.
- **Gestión de hijos:** Un padre puede gestionar varios hijos, con sus datos y equipos asociados.
- **Privacidad y seguridad:** Datos seguros y cumplimiento de buenas prácticas de protección de datos.

> **Funcionalidades previstas / en desarrollo:**
> - **Previsión meteorológica:** Mostrar la previsión del tiempo 2 horas antes y 2 horas después del comienzo del partido (en integración).
> - **Comunicación interna y notificaciones:** Sistema de avisos por email y notificaciones integradas (parcialmente implementado).
> - **Paneles avanzados y administración:** Mejoras de usabilidad y más opciones para administradores y entrenadores.
> - **Otras integraciones y mejoras UX/UI.**

---

## Tecnologías utilizadas

- **Frontend:** [React](https://react.dev), [Next.js (App Router)](https://nextjs.org), [Material UI](https://mui.com)
- **Backend/API:** Next.js API Routes
- **Base de datos:** Firebase Firestore (NoSQL)
- **Autenticación:** Firebase Authentication
- **Almacenamiento:** Firebase Storage (fotos de perfil)
- **Mapas y autocompletado:** Google Maps API
- **Despliegue:** Vercel
- **Control de versiones:** Git y GitHub

---

## Instalación y uso local

> **Requisitos previos:**  
> [Node.js](https://nodejs.org), [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/), cuenta y proyecto en Firebase y API Key de Google Maps.

1. **Clona este repositorio:**
    ```bash
    git clone https://github.com/Magnustotal/coordisport.git
    cd coordisport
    ```

2. **Instala las dependencias:**
    ```bash
    npm install
    # o
    yarn install
    ```

3. **Configura tus variables de entorno:**  
   Crea un archivo `.env.local` con las claves de Firebase y Google Maps:
NEXT_PUBLIC_FIREBASE_API_KEY=xxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxx
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxx
FIREBASE_CLIENT_EMAIL=xxxx
FIREBASE_PRIVATE_KEY=xxxx
FIREBASE_PROJECT_ID=xxxx

*(Consulta la documentación de Firebase y Google Maps para obtener estos valores)*

4. **Inicia el servidor de desarrollo:**
 ```bash
 npm run dev
 # o
 yarn dev
 ```
 Ve a [http://localhost:3000](http://localhost:3000) para acceder a la aplicación.

---

## Despliegue

- Listo para desplegar en [Vercel](https://vercel.com/): conecta el repositorio y configura las variables de entorno.
- Cada push a `main` o `develop` genera un despliegue automático.

---

## Estado actual y hoja de ruta

El MVP ya incluye:
- Autenticación y perfiles de usuario.
- Gestión de equipos, hijos y eventos.
- Gestión manual del transporte para partidos y entrenamientos.
- Integración con Google Maps (autocompletado y cómo llegar).
- Sistema de convocatorias y confirmaciones.

**Próximos pasos y funciones en desarrollo:**
- Previsión meteorológica antes y después de los eventos.
- Comunicación interna (email, notificaciones).
- Paneles avanzados para administración y entrenadores.
- Mejoras de UX/UI y accesibilidad.
- Notificaciones push en futuras versiones.

Algunas de estas funcionalidades ya se han empezado a integrar, pero aún no están finalizadas o disponibles en la versión actual.

---

## Cómo contribuir

¿Quieres colaborar?  
Las pull requests y sugerencias serán bienvenidas pronto.  
Mientras tanto, abre un [issue](https://github.com/Magnustotal/coordisport/issues) para cualquier duda o mejora.

---

## Licencia

Licencia pendiente de definir tras completar el MVP.  
Uso actualmente restringido a desarrollo y revisión académica.

---

## Créditos

Desarrollado por Javier Barrero Vázquez como Proyecto Integrado del CFGS DAM - CESUR Sevilla 2024/2025.

---

## Contacto

Para consultas, sugerencias o colaboración, abre un [issue](https://github.com/Magnustotal/coordisport/issues).

---
