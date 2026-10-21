/**
 * Utilidades para cálculo de duración de turnos, cruce de medianoche y detección de solapamientos.
 */

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export interface ShiftCalculation {
  duracionHoras: number;
  cruzaMedianoche: boolean;
}

export function calcularDuracionHoras(horaInicio: string, horaFin: string): ShiftCalculation {
  const startMins = timeToMinutes(horaInicio);
  const endMins = timeToMinutes(horaFin);

  if (startMins === endMins) {
    // 24 horas completas de cobertura
    return { duracionHoras: 24, cruzaMedianoche: true };
  }

  if (endMins > startMins) {
    const diff = endMins - startMins;
    return {
      duracionHoras: Number((diff / 60).toFixed(2)),
      cruzaMedianoche: false,
    };
  } else {
    // Cruza la medianoche (ej: 22:00 a 06:00)
    const diff = 1440 - startMins + endMins;
    return {
      duracionHoras: Number((diff / 60).toFixed(2)),
      cruzaMedianoche: true,
    };
  }
}

export interface IntervaloDia {
  diaSemana: number; // 1 = Lun ... 7 = Dom
  inicioMinutos: number; // 0..1440
  finMinutos: number; // 0..1440
}

/**
 * Descompone un turno recurrente en intervalos continuos por día de la semana.
 * Si cruza la medianoche, genera dos intervalos:
 * Uno para el día D (de inicio hasta 1440) y otro para el día D+1 (de 0 a fin).
 */
export function descomponerTurnoRecurrente(
  diaSemana: number,
  horaInicio: string,
  horaFin: string
): IntervaloDia[] {
  const start = timeToMinutes(horaInicio);
  const end = timeToMinutes(horaFin);
  const intervalos: IntervaloDia[] = [];

  if (start === end) {
    // Turno 24 horas
    intervalos.push({ diaSemana, inicioMinutos: 0, finMinutos: 1440 });
    return intervalos;
  }

  if (end > start) {
    intervalos.push({
      diaSemana,
      inicioMinutos: start,
      finMinutos: end,
    });
  } else {
    // Tramo 1: Día actual
    intervalos.push({
      diaSemana,
      inicioMinutos: start,
      finMinutos: 1440,
    });
    // Tramo 2: Día siguiente
    const siguienteDia = diaSemana === 7 ? 1 : diaSemana + 1;
    intervalos.push({
      diaSemana: siguienteDia,
      inicioMinutos: 0,
      finMinutos: end,
    });
  }

  return intervalos;
}

/**
 * Comprueba si dos intervalos en el mismo día de la semana se solapan.
 * Dos intervalos [A1, A2) y [B1, B2) colisionan si max(A1, B1) < min(A2, B2).
 */
export function colisionanIntervalos(intA: IntervaloDia, intB: IntervaloDia): boolean {
  if (intA.diaSemana !== intB.diaSemana) return false;
  return Math.max(intA.inicioMinutos, intB.inicioMinutos) < Math.min(intA.finMinutos, intB.finMinutos);
}

/**
 * Valida si un nuevo turno recurrente entra en conflicto con turnos recurrentes existentes.
 */
export function validarConflictoRecurrente(
  nuevoTurno: { diaSemana: number; horaInicio: string; horaFin: string },
  turnosExistentes: Array<{ id?: string; diaSemana: number | null; horaInicio: string; horaFin: string; localNombre?: string }>
): { hayConflicto: boolean; mensaje?: string } {
  const nuevosIntervalos = descomponerTurnoRecurrente(
    nuevoTurno.diaSemana,
    nuevoTurno.horaInicio,
    nuevoTurno.horaFin
  );

  for (const existente of turnosExistentes) {
    if (!existente.diaSemana) continue;

    const intervalosExistentes = descomponerTurnoRecurrente(
      existente.diaSemana,
      existente.horaInicio,
      existente.horaFin
    );

    for (const nInt of nuevosIntervalos) {
      for (const eInt of intervalosExistentes) {
        if (colisionanIntervalos(nInt, eInt)) {
          const loc = existente.localNombre ? ` en "${existente.localNombre}"` : "";
          return {
            hayConflicto: true,
            mensaje: `Conflicto de horario: Se solapa con un turno existente (${existente.horaInicio} - ${existente.horaFin})${loc}.`,
          };
        }
      }
    }
  }

  return { hayConflicto: false };
}
