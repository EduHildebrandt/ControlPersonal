# Lecciones Aprendidas y Reglas del Proyecto

Este archivo documenta patrones, correcciones y mejores prácticas identificadas durante el ciclo de vida del proyecto.

## Reglas Técnicas
1. **Entorno de Ejecución (Windows PowerShell)**:
   - Utilizar siempre `npm.cmd` y `npx.cmd` en lugar de `npm`/`npx` planos para evitar restricciones de `ExecutionPolicy` sobre scripts `.ps1`.
2. **Conectividad con Supabase**:
   - `db.[REF].supabase.co` solo resuelve a direcciones IPv6. En redes locales/residenciales que no enrutan IPv6 saliente hacia AWS, usar siempre el **Supabase Connection Pooler** (`aws-1-[region].pooler.supabase.com:5432` o `:6543`), el cual soporta IPv4 nativo.
   - En contraseñas con caracteres especiales (ej: `+`), codificarlos en la URL (ej: `%2B`) para evitar fallos de autenticación.
3. **Manejo de Turnos Nocturnos**:
   - Cuando un turno comienza a las 22:00 y termina a las 06:00, la hora de fin es numéricamente menor a la hora de inicio. Debe calcularse la duración sumando 24 horas (`(24 - inicio) + fin` o tratando fechas normalizadas con timestamps UTC/locales).
   - En solapamientos, considerar el segmento del día actual (22:00-24:00) y el segmento del día siguiente (00:00-06:00).
3. **Next.js App Router & Server Actions**:
   - Siempre revalidar rutas (`revalidatePath`) tras mutaciones.
   - Manejo explícito de estados de carga (`useTransition`, skeleton loaders) y retorno estandarizado `{ success: boolean, data?: any, error?: string }`.
4. **Cálculo de Horas Mensuales**:
   - Calcular la ocurrencia real de cada día de la semana dentro del mes calendario específico (ej. cuántos lunes, martes, etc. tiene dicho mes) multiplicando por las horas asignadas en los turnos recurrentes activos, o acumulando sobre registros de turnos fechados.
