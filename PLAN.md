# Master Roadmap: Sistema Integral de Personal, Turnos y Liquidación (Puntos y Moda)

## 1. Objetivos del Release
1. **Autenticación por Nombre de Usuario y Contraseña**:
   - Soporte para inicio de sesión con `username` o `email`.
   - Creación de supervisores: **Andrea**, **Mauricio** y **Demian** (contraseña `Puntos2026!`).
   - Restricción estricta de gestión de supervisores únicamente para el **Superusuario**.
2. **Carnet de Manipulación de Alimentos**:
   - Atributos `tieneCarnetManipulacion` y `vencimientoCarnetManipulacion` en `Empleado`.
   - Alerta visual a 30 días (vigente, por vencer <= 30 días, vencido) en ficha de empleado y grilla de turnos.
3. **Bloqueo de Turnos por Vacaciones Gozadas**:
   - Validación backend y frontend que impide asignar turnos a colaboradores durante sus vacaciones activas.
4. **Liquidación de Vacaciones No Gozadas (Compensación de Horas)**:
   - Registro de vacaciones tipo `LIQUIDADA` solicitando al supervisor la cantidad de horas equivalentes.
   - Descuento de días del saldo disponible y acumulación de horas para liquidación.
5. **Rediseño del Reporte: "Reporte (liquidacion de horas)"**:
   - Selector por rango de fechas (`Desde` y `Hasta`).
   - Desglose: Horas Trabajadas + Horas Vacaciones Liquidadas = Total a Liquidar.
   - Exportación profesional en PDF y Excel adaptada.
6. **Calendario Semanal de Lunes a Domingo (Semanas 1 a 52)**:
   - Navegación semana a semana de Lunes a Domingo con indicador claro del rango de fechas.
   - Visualización destacada y legible del nombre completo del empleado en cada turno.
   - Badge de alerta de carnet y resumen de horas semanales.
7. **Sincronización en Producción (DonWeb VPS)**:
   - Despliegue en `https://puntosymoda.site` con PostgreSQL y reinicio de servicio.

---

## 2. Arquitectura de Datos (`prisma/schema.prisma`)
- `model Usuario`:
  - `username String? @unique`
- `model Empleado`:
  - `tieneCarnetManipulacion Boolean @default(false) @map("tiene_carnet_manipulacion")`
  - `vencimientoCarnetManipulacion DateTime? @map("vencimiento_carnet_manipulacion")`
- `model Vacacion`:
  - `tipoVacacion String @default("GOZADA") @map("tipo_vacacion")` // GOZADA | LIQUIDADA
  - `horasLiquidadas Float? @map("horas_liquidadas")`

---

## 3. Plan de Ejecución
- **Fase 1**: Actualizar esquema Prisma, tipos y migraciones.
- **Fase 2**: Actualizar autenticación (username) y crear usuarios Andrea, Mauricio y Demian.
- **Fase 3**: Implementar Carnet de Manipulación con alertas de vencimiento en `/empleados` y `/turnos`.
- **Fase 4**: Validar bloqueo de turnos durante vacaciones gozadas.
- **Fase 5**: Implementar liquidación de vacaciones no gozadas (horas) y saldo en `/vacaciones`.
- **Fase 6**: Rediseñar "Reporte (liquidacion de horas)" con rango de fechas y exportación PDF/Excel.
- **Fase 7**: Implementar Calendario Semanal de Lunes a Domingo (1 a 52 semanas) con nombres legibles.
- **Fase 8**: Compilación, testing local y despliegue en VPS DonWeb (`puntosymoda.site`).

---

## 4. Revisión y Verificación
- **[AUTO-HEALED]**: Se ajustó la validación de solapamiento en `guardarVacacion` para ignorar registros de tipo `LIQUIDADA` al validar conflictos de fechas con vacaciones `GOZADA`, y se verificó la compilación limpia de producción en Next.js 15 (`output: standalone`).
