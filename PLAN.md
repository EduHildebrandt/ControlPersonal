# Plan de Implementación: Sistema de Vacaciones y Generación de Datos de Producción (25 Empleados, 5 Locales, Turnos 1/11 - 11/11)

## 1. Contexto y Objetivos
El usuario solicita:
1. **Módulo Integral de Vacaciones**:
   - Capacidad de asignar a cada empleado la cantidad de días de vacaciones que le corresponden (`diasVacacionesTotales`).
   - Contabilización y registro de vacaciones tomadas por cada empleado con control de saldo (Total Asignados, Días Tomados, Días Restantes).
   - Vista en **Calendario Interactivo** para visualizar las vacaciones de todo el personal por mes y día.
2. **Estructura de Base de Datos y Seed de Producción**:
   - 5 locales oficiales: `MarMau`, `Punto 1`, `Punto 2`, `Punto 3` y `ModaShop`.
   - 25 empleados aleatorios con datos realistas (DNI, teléfono, dirección, correo, rol: Vendedor o Limpieza, días de vacaciones).
   - Asignación de turnos del **1/11 al 11/11**:
     - Bloques de mínimo 2 horas y máximo 8 horas.
     - Horarios por local:
       - **Punto 1, Punto 2, Punto 3**: de 08:00 a 24:00.
       - **MarMau**: de 06:00 a 03:00 (soporte cruce de medianoche).
       - **ModaShop**: de 09:00 a 12:00 y de 16:00 a 21:00.
     - Sin solapamientos horarios para el mismo empleado.

---

## 2. Arquitectura de Datos y Seguridad
- **Prisma Schema**:
  - `Empleado`: agregar `diasVacacionesTotales Int @default(14) @map("dias_vacaciones_totales")`.
  - Nuevo modelo `Vacacion`:
    - `id`, `empleadoId`, `fechaInicio`, `fechaFin`, `diasTomados`, `observaciones`, timestamps.
    - Relación `Empleado -> Vacacion[]` con `onDelete: Cascade`.
- **Row Level Security (RLS)**:
  - Ejecutar `ALTER TABLE public.vacaciones ENABLE ROW LEVEL SECURITY;` y revocar accesos a `anon, authenticated` para mantener la base de datos de Supabase blindada.

---

## 3. Server Actions & Backend Logic
- `src/actions/vacaciones.ts`:
  - `getResumenVacaciones()`: calcula para cada empleado días totales, días tomados y saldo disponible.
  - `getVacacionesCalendario(mes, anio)`: retorna períodos vacacionales activos para renderizar en el calendario mensual.
  - `guardarVacacion({ empleadoId, fechaInicio, fechaFin, observaciones })`: valida rango de fechas, calcula días, valida saldo y registra.
  - `eliminarVacacion(id)`: cancela período de vacación y revalida vistas.
- `src/actions/empleados.ts`:
  - Permitir leer y editar `diasVacacionesTotales` en `guardarEmpleado`.
- `src/actions/turnos.ts`:
  - Asegurar que para turnos puntuales se guarde `fecha` y `diaSemana` correspondiente.

---

## 4. Frontend y Experiencia de Usuario (UI/UX)
- **Nuevo Módulo de Navegación**:
  - Agregar enlace `/vacaciones` en `AppShell.tsx` (desktop y drawer móvil) con ícono de vacaciones (`CalendarRange` / `Palmtree`).
- **Página `/vacaciones` (`VacacionesClient.tsx`)**:
  - KPIs de cabecera: Colaboradores totales, Colaboradores de vacaciones este mes, Días asignados y tomados.
  - Pestaña 1: **Calendario Mensual**:
    - Navegación mes a mes con selector de año.
    - Casilleros por día con badges visuales de empleados en vacaciones.
    - Filtro por colaborador para ver el cronograma personal.
  - Pestaña 2: **Control de Saldos**:
    - Tabla responsiva y tarjetas móviles con barra de progreso de días consumidos vs. disponibles.
    - Botón para registrar o cancelar vacaciones.
- **Actualización en `/empleados`**:
  - Formulario de alta/edición incluye campo "Días de Vacaciones Asignados".
  - Muestra saldo de vacaciones en la tarjeta/fila del empleado.
- **Actualización en `/turnos`**:
  - Selector de semana / período (permitir ver la semana del 01/11 al 07/11 y del 08/11 al 14/11) para que los turnos puntuales de noviembre se visualicen claramente en la grilla 24/7.

---

## 5. Seed Script y Ejecución
- Crear script `scripts/seed-produccion-25emp.js` que:
  - Crea o actualiza los 5 locales.
  - Crea 25 empleados con datos realistas argentinos, roles (Vendedor/Limpieza) y días de vacaciones.
  - Genera turnos de trabajo válidos desde el 1/11/2026 hasta el 11/11/2026 respetando los horarios de cada local y sin colisiones de horario.
  - Registra algunas vacaciones de muestra para que el calendario y control de saldos tengan datos reales inmediatos.
  - Sincroniza RLS en Supabase.
