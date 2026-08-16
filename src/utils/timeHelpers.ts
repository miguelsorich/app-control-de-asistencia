import { ModalidadSemanal, MODALIDADES } from '../types';

export function calculateEndTime(startTime: string, modalidad: ModalidadSemanal): string {
  if (!startTime || !startTime.includes(':')) return '';
  const [hStr, mStr] = startTime.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return '';

  const durationMin = MODALIDADES[modalidad].duracionClaseMinutos;
  const totalMinutes = h * 60 + m + durationMin;

  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;

  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export function formatTimeRange(horaInicio: string, horaFin: string): string {
  if (!horaInicio) return 'Sin horario establecido';
  if (!horaFin) return `${horaInicio}`;
  return `${horaInicio} - ${horaFin}`;
}

// Common time slots for UAGRM classes
export const COMMON_TIME_SLOTS_LUN_MIE_VIE = [
  { start: '07:00', end: '08:30', label: '07:00 - 08:30' },
  { start: '08:30', end: '10:00', label: '08:30 - 10:00' },
  { start: '10:00', end: '11:30', label: '10:00 - 11:30' },
  { start: '11:30', end: '13:00', label: '11:30 - 13:00' },
  { start: '14:00', end: '15:30', label: '14:00 - 15:30' },
  { start: '15:30', end: '17:00', label: '15:30 - 17:00' },
  { start: '17:00', end: '18:30', label: '17:00 - 18:30' },
  { start: '18:30', end: '20:00', label: '18:30 - 20:00' },
  { start: '20:00', end: '21:30', label: '20:00 - 21:30' },
];

export const COMMON_TIME_SLOTS_MAR_JUE = [
  { start: '07:00', end: '09:15', label: '07:00 - 09:15' },
  { start: '09:15', end: '11:30', label: '09:15 - 11:30' },
  { start: '11:30', end: '13:45', label: '11:30 - 13:45' },
  { start: '14:00', end: '16:15', label: '14:00 - 16:15' },
  { start: '16:15', end: '18:30', label: '16:15 - 18:30' },
  { start: '18:30', end: '20:45', label: '18:30 - 20:45' },
  { start: '20:45', end: '23:00', label: '20:45 - 23:00' },
];

export const COMMON_TIME_SLOTS_SABADO = [
  { start: '07:00', end: '11:30', label: '07:00 - 11:30' },
];
