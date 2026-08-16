import { Asignatura, ModalidadSemanal, MODALIDADES, SesionHabilitacion } from '../types';

export const DIAS_SEMANA_NOMBRES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export const DIAS_PERMITIDOS_POR_MODALIDAD: Record<ModalidadSemanal, number[]> = {
  LUN_MIE_VIE: [1, 3, 5], // Lunes (1), Miércoles (3), Viernes (5)
  MAR_JUE: [2, 4], // Martes (2), Jueves (4)
  SABADO: [6], // Sábado (6)
};

export interface ValidationScheduleResult {
  puedeHabilitar: boolean;
  diaValido: boolean;
  horarioValido: boolean;
  diaActualNombre: string;
  horaActualStr: string;
  diasPermitidos: string[];
  horarioPermitido: string;
  motivoInvalidez?: string;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

export function formatCurrentTime(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatCurrentTimeWithSeconds(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates if the current date and time correspond to the defined class days and schedule for the subject.
 */
export function validarHorarioHabilitacion(
  asignatura: Asignatura,
  currentDate: Date = new Date()
): ValidationScheduleResult {
  const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const diaActualNombre = DIAS_SEMANA_NOMBRES[dayOfWeek];
  const horaActualStr = formatCurrentTime(currentDate);
  const currentMinutes = parseTimeToMinutes(horaActualStr);

  const modConfig = MODALIDADES[asignatura.modalidad] || MODALIDADES.LUN_MIE_VIE;
  const allowedDaysNumbers = DIAS_PERMITIDOS_POR_MODALIDAD[asignatura.modalidad] || [1, 3, 5];
  const diaValido = allowedDaysNumbers.includes(dayOfWeek);

  const startMinutes = parseTimeToMinutes(asignatura.horaInicio);
  const endMinutes = parseTimeToMinutes(asignatura.horaFin);
  const horarioValido = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  const horarioPermitido = `${asignatura.horaInicio} a ${asignatura.horaFin}`;

  let motivoInvalidez: string | undefined = undefined;

  if (!diaValido && !horarioValido) {
    motivoInvalidez = `Hoy es ${diaActualNombre} y la hora actual (${horaActualStr}) está fuera del horario. Esta materia solo tiene clases los ${modConfig.dias.join(', ')} de ${horarioPermitido}.`;
  } else if (!diaValido) {
    motivoInvalidez = `Hoy es ${diaActualNombre}. La materia ${asignatura.sigla} solo tiene clases los días ${modConfig.dias.join(', ')}.`;
  } else if (!horarioValido) {
    motivoInvalidez = `La hora actual (${horaActualStr}) no corresponde al horario de la clase establecido (${horarioPermitido}).`;
  }

  return {
    puedeHabilitar: diaValido && horarioValido,
    diaValido,
    horarioValido,
    diaActualNombre,
    horaActualStr,
    diasPermitidos: modConfig.dias,
    horarioPermitido,
    motivoInvalidez,
  };
}

/**
 * Checks if a session is currently active and unexpired.
 */
export function isSesionVigente(
  sesion: SesionHabilitacion | undefined | null,
  nowTimestamp: number = Date.now(),
  todayDateStr: string = getTodayDateString()
): boolean {
  if (!sesion) return false;
  if (!sesion.activa) return false;
  if (sesion.cerradoManualmente) return false;
  if (sesion.fecha !== todayDateStr) return false;
  if (nowTimestamp >= sesion.expiraTimestamp) return false;
  return true;
}

/**
 * Formats milliseconds remaining into MM:SS format.
 */
export function formatRemainingTime(remainingMs: number): string {
  if (remainingMs <= 0) return '00:00';
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
