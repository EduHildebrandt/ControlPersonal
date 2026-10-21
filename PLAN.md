# Master Roadmap: Sistema de Control de Personal y Gestión de Turnos

## 1. Visión General del Proyecto
Sistema integral para la gestión de empleados, sucursales/locales, asignación de turnos (24/7 con turnos nocturnos y rotativos), prevención de solapamientos horarios y generación de reportes mensuales con cálculo automatizado y exportación a PDF y Excel.

## 2. Stack Tecnológico & Decisiones de Negocio
- **Frontend / Framework Fullstack**: Next.js 15 (App Router, Server Actions, TypeScript).
- **UI / Estilos**: Tailwind CSS, Lucide Icons, Shadcn/UI (Radix Primitives) con estética Glassmorphism limpia y moderna.
- **Base de Datos & ORM**: PostgreSQL en **Supabase** con **Prisma ORM**.
- **Modelo de Turnos**: Híbrido:
  - Turnos **Puntuales**: Asignados a una fecha de calendario específica (`fecha`).
  - Turnos **Recurrentes**: Asignados a un día de la semana (`dia_semana` 1-7) aplicables de forma sistemática o plantilla semanal.
- **Cálculo de Horas**: Totalización de horas brutas efectivas (soporta turnos que cruzan medianoche, sin recargo diferencial nocturno).
- **Exportación de Datos**: ExcelJS (XLSX/CSV) y jsPDF / AutoTable (PDF profesional para impresión).
- **Validaciones**: Zod + validación de solapamiento en servidor y feedback visual inmediato.

---

## 3. Fases de Ejecución

### Fase 1: Inicialización & Conexión Supabase
- [x] Inicializar proyecto Next.js 15 (App Router, TypeScript, Tailwind CSS, Lucide, componentes base).
- [x] Configurar Prisma ORM apuntando a PostgreSQL de Supabase.
- [x] Generar `.env` y `.env.example` con `DATABASE_URL` y `DIRECT_URL` para Supabase (con pooler de sesiones/transacciones).
- [x] Definir el esquema Prisma con soporte para turnos puntuales y recurrentes, locales y empleados.
- [x] Preparar seed de datos iniciales realistas (`prisma/seed.js`).

### Fase 2: Gestión de Locales y Empleados (CRUDs Completos)
- [x] CRUD de Locales / Sucursales (código, nombre, dirección, estado).
- [x] CRUD de Empleados con asignación múltiple (N:M) a locales autorizados.
- [x] Feedback con Toast notifications, estados de carga y empty states.

### Fase 3: Grilla Semanal 24/7 y Asignación de Turnos (Manual + Recurrente)
- [x] Grilla semanal interactiva 24h para asignación de turnos (7 columnas Lun-Dom).
- [x] Modal intuitivo con selector de tipo: Turno Puntual (Fecha específica) o Turno Recurrente (Día semanal).
- [x] Manejo de cruce de medianoche (ej. 22:00 a 06:00 = 8h) con badge identificador.
- [x] Algoritmo de validación contra solapamientos de horario para el mismo empleado (`validarConflictoRecurrente`).

### Fase 4: Motor de Cálculo y Módulo de Reportes Mensuales
- [x] Algoritmo de consolidación de horas del mes por empleado y por local (`consolidarHorasMensuales`).
- [x] Pantalla de Reportes con selector de Empleado, Mes y Año.
- [x] Tarjetas KPI (Total horas brutas, distribución por local con barras de progreso, turnos cumplidos).
- [x] Exportación descargable en Excel (`.xlsx`) con múltiples pestañas y estilos corporativos.
- [x] Exportación a PDF imprimible con membrete y tablas automáticas (`jspdf-autotable`).

### Fase 5: Auditoría, UX y Verificación
- [x] Verificación de estados UI (Loading, Empty, Error handling).
- [x] Validación de build en Next.js 15: `next build` superado con 0 errores de compilación y tipado.
- [x] Soporte de Impresión Profesional para la Grilla de Turnos 24/7 (botón "Imprimir Grilla" + vista apaisada y cabecera de informe).
- [x] Base de Datos sincronizada con los 5 locales oficiales: **MarMau**, **ModaShop**, **Punto 1**, **Punto 2**, **Punto 3**.
- [x] Flujo de Bajas de Sucursales en 2 pasos: Baja Lógica (inactivación con confirmación) y Baja Definitiva (borrado físico con advertencia modal).
- [x] Flujo de Bajas de Personal en 2 pasos: Baja Lógica (inactivación en nómina con confirmación) y Baja Definitiva (borrado permanente con advertencia modal).
