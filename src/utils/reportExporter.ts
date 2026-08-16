import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Asignatura, Estudiante, RegistroAsistencia } from '../types';

export interface ReportRow {
  registroUniversitario: string;
  nombreCompleto: string;
  attendanceByDate: Record<string, number>; // dateString -> 1 or 0
  total: number;
}

export interface ReportData {
  fechas: string[]; // sorted chronological YYYY-MM-DD
  fechasFormatted: Record<string, string>; // YYYY-MM-DD -> DD/MM (or DD/MM/YYYY)
  filas: ReportRow[];
  totalEstudiantes: number;
}

/**
 * Formats a YYYY-MM-DD date string to DD/MM
 */
export function formatDateToDDMM(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parts[2];
    const month = parts[1];
    return `${day}/${month}`;
  }
  return dateStr;
}

/**
 * Builds report data for a specific subject
 */
export function buildAttendanceReportData(
  asignatura: Asignatura,
  estudiantes: Estudiante[],
  registros: RegistroAsistencia[]
): ReportData {
  // 1. Filter students of this subject
  const subjectStudents = estudiantes
    .filter((e) => e.asignaturaId === asignatura.id)
    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));

  // 2. Filter attendance records of this subject
  const subjectRecords = registros.filter((r) => r.asignaturaId === asignatura.id);

  // 3. Extract unique dates that have attendance records and sort them chronologically
  const uniqueDatesSet = new Set<string>();
  subjectRecords.forEach((r) => {
    if (r.fecha) {
      uniqueDatesSet.add(r.fecha);
    }
  });

  const fechas = Array.from(uniqueDatesSet).sort((a, b) => a.localeCompare(b));

  const fechasFormatted: Record<string, string> = {};
  fechas.forEach((f) => {
    fechasFormatted[f] = formatDateToDDMM(f);
  });

  // Map of (student RU lowercase + date) -> boolean (is present)
  const presenceMap = new Set<string>();
  subjectRecords.forEach((r) => {
    if (r.estado === 'PRESENTE') {
      const key = `${r.registroUniversitario.trim().toLowerCase()}_${r.fecha}`;
      presenceMap.add(key);
    }
  });

  // 4. Build rows for each student
  const filas: ReportRow[] = subjectStudents.map((student) => {
    const attendanceByDate: Record<string, number> = {};
    let total = 0;

    fechas.forEach((f) => {
      const key = `${student.registroUniversitario.trim().toLowerCase()}_${f}`;
      const isPresent = presenceMap.has(key);
      const val = isPresent ? 1 : 0;
      attendanceByDate[f] = val;
      total += val;
    });

    return {
      registroUniversitario: student.registroUniversitario,
      nombreCompleto: student.nombreCompleto,
      attendanceByDate,
      total,
    };
  });

  return {
    fechas,
    fechasFormatted,
    filas,
    totalEstudiantes: subjectStudents.length,
  };
}

/**
 * Exports report to Excel (.xlsx)
 */
export function exportReportToExcel(
  asignatura: Asignatura,
  reportData: ReportData
) {
  const { fechas, fechasFormatted, filas } = reportData;

  // Build rows array matching exact requested columns:
  // Registro Universitario | Nombre | [Fechas de clase] | Total
  const exportRows = filas.map((fila) => {
    const rowObj: Record<string, string | number> = {
      'Registro Universitario': fila.registroUniversitario,
      'Nombre': fila.nombreCompleto,
    };

    fechas.forEach((f) => {
      const colHeader = fechasFormatted[f] || f;
      rowObj[colHeader] = fila.attendanceByDate[f] ?? 0;
    });

    rowObj['Total'] = fila.total;
    return rowObj;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportRows);

  // Auto-fit column widths
  const colWidths = [
    { wch: 22 }, // Registro Universitario
    { wch: 35 }, // Nombre
    ...fechas.map(() => ({ wch: 10 })), // Dates
    { wch: 10 }, // Total
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia');

  const safeSigla = asignatura.sigla.replace(/[^a-zA-Z0-9]/g, '_');
  const safeGrupo = asignatura.grupo.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Reporte_Asistencia_${safeSigla}_G${safeGrupo}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Exports report to CSV (.csv)
 */
export function exportReportToCSV(
  asignatura: Asignatura,
  reportData: ReportData
) {
  const { fechas, fechasFormatted, filas } = reportData;

  // Build rows array matching exact requested columns:
  // Registro Universitario | Nombre | [Fechas de clase] | Total
  const exportRows = filas.map((fila) => {
    const rowObj: Record<string, string | number> = {
      'Registro Universitario': fila.registroUniversitario,
      'Nombre': fila.nombreCompleto,
    };

    fechas.forEach((f) => {
      const colHeader = fechasFormatted[f] || f;
      rowObj[colHeader] = fila.attendanceByDate[f] ?? 0;
    });

    rowObj['Total'] = fila.total;
    return rowObj;
  });

  const csv = Papa.unparse(exportRows, {
    quotes: true,
    delimiter: ',',
  });

  // UTF-8 BOM for Excel compatibility in Spanish locale
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeSigla = asignatura.sigla.replace(/[^a-zA-Z0-9]/g, '_');
  const safeGrupo = asignatura.grupo.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `Reporte_Asistencia_${safeSigla}_G${safeGrupo}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
