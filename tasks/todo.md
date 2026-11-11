# Control de Tareas (Squad Status)

| ID | Tarea | Estado | Responsable | Notas |
|---|---|---|---|---|
| TASK-001 | Setup Next.js 15 + Tailwind CSS + Lucide + Prisma | `COMPLETADO` | Frontend/Backend | Configuración e instalación lista |
| TASK-002 | Esquema Prisma Supabase (Turnos Puntuales + Recurrentes) | `COMPLETADO` | Backend Lead | Modelado en `prisma/schema.prisma` |
| TASK-003 | Configuración de conexión y migración Supabase | `COMPLETADO` | Backend Lead | Conectado a ca-central-1 y sincronizado con seed |
| TASK-004 | CRUD de Locales (UI + Server Actions) | `COMPLETADO` | Full Stack | Listado, modal, validación |
| TASK-005 | CRUD de Empleados y asignación N:M a Locales | `COMPLETADO` | Full Stack | Ficha, DNI único, locales habilitados |
| TASK-006 | Grilla Semanal 24/7 y Asignación de Turnos (Manual/Recurrente) | `COMPLETADO` | Full Stack | Matriz interactiva + Cruce medianoche |
| TASK-007 | Validador de Solapamiento Horario | `COMPLETADO` | Backend Lead | Previene superposición por empleado |
| TASK-008 | Motor de Cálculo Mensual de Horas Brutas | `COMPLETADO` | Backend Lead | Consolidación por mes, año y local |
| TASK-009 | Generador y Exportador de Reportes (Excel + PDF) | `COMPLETADO` | Full Stack | Descargas nativas formateadas (.xlsx y .pdf) |
| TASK-010 | Auditoría de UI, Accesibilidad y Build | `COMPLETADO` | QA Lead | Build exitoso con `next build` en 0 errores |
| TASK-011 | Impresión / Exportación Imprimible de Grilla de Turnos | `COMPLETADO` | Frontend Lead | Botón imprimir + cabecera formal + estilos @media print |
| TASK-012 | Actualización de Locales Maestros (5 locales solicitados) | `COMPLETADO` | Backend Lead | MarMau, ModaShop, Punto 1, Punto 2, Punto 3 |
| TASK-013 | Sistema de Eliminación de Locales (Baja Lógica + Baja Definitiva) | `COMPLETADO` | Full Stack | Flujo con doble confirmación modal |
| TASK-014 | Sistema de Eliminación de Empleados (Baja Lógica + Baja Definitiva) | `COMPLETADO` | Full Stack | Flujo con doble confirmación modal para personal |
| TASK-015 | Sistema de Autenticación y Control de Roles (Supervisor y Superusuario) | `COMPLETADO` | Full Stack | Login, JWT middleware, permisos granulares y gestión de supervisores |
| TASK-016 | Adaptación Responsiva para Celulares, Tablets y PCs | `COMPLETADO` | Frontend Lead | AppShell drawer, tarjetas móviles y vistas adaptables |
| TASK-017 | Modificación de Turnos, Correo y Dirección de Personal, y Roles | `COMPLETADO` | Full Stack | Edición de turnos, roles Vendedor/Limpieza |
| TASK-018 | Blindaje de Seguridad Supabase (Row Level Security en todas las tablas) | `COMPLETADO` | SecOps / Backend | RLS activo y acceso anónimo revocado |
| TASK-019 | Modelo de Datos y Migración de Vacaciones (`diasVacacionesTotales`, `Vacacion`) | `COMPLETADO` | Backend Lead | `prisma/schema.prisma` y `db push` sincronizados |
| TASK-020 | Server Actions de Vacaciones (Control de Saldo, Registro, Eliminación) | `COMPLETADO` | Backend Lead | `src/actions/vacaciones.ts` implementado |
| TASK-021 | Módulo de Vacaciones (Calendario Mensual + Tabla de Saldos) | `COMPLETADO` | Frontend Lead | `src/app/vacaciones/page.tsx` + `VacacionesClient.tsx` |
| TASK-022 | Integración de Vacaciones en AppShell y Ficha de Empleados | `COMPLETADO` | Frontend Lead | Navbar y modal/tarjeta de colaboradores |
| TASK-023 | Selector de Semanas / Períodos en Grilla de Turnos | `COMPLETADO` | Frontend Lead | Visualización de turnos puntuales 1/11 - 11/11 |
| TASK-024 | Script de Seed Masivo (5 Locales, 25 Empleados, Turnos 1/11-11/11) | `COMPLETADO` | Data Lead | 154 turnos generados según franjas por local |
| TASK-025 | Verificación Integral, Build y Despliegue en Netlify / GitHub | `COMPLETADO` | QA Lead | Build exitoso con `next build` en 0 errores |
