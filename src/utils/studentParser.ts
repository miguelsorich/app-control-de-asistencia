import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Estudiante, ImportSummaryResult } from '../types';

interface RawRow {
  [key: string]: any;
}

function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, ''); // alphanumeric only
}

function findKey(row: RawRow, candidates: string[]): string | undefined {
  const normalizedCandidateKeys = candidates.map(normalizeHeader);
  for (const key of Object.keys(row)) {
    const normKey = normalizeHeader(key);
    if (normalizedCandidateKeys.includes(normKey)) {
      return key;
    }
  }
  // Substring match fallback
  for (const key of Object.keys(row)) {
    const normKey = normalizeHeader(key);
    if (normalizedCandidateKeys.some((cand) => normKey.includes(cand) || cand.includes(normKey))) {
      return key;
    }
  }
  return undefined;
}

const RU_CANDIDATES = [
  'registrouniversitario',
  'registro',
  'ru',
  'reguniv',
  'nroregistro',
  'numeroderegistro',
  'codigo',
  'carnet',
  'matricula',
];

const NOMBRE_CANDIDATES = [
  'nombrecompleto',
  'nombre',
  'nombres',
  'apellidosynombres',
  'nombresyapellidos',
  'estudiante',
  'alumno',
  'fullname',
];

const CORREO_CANDIDATES = [
  'correoelectronico',
  'correo',
  'email',
  'correoinstitucional',
  'mail',
  'e-mail',
];

export async function parseFileForStudents(
  file: File,
  asignaturaId: string,
  existingStudentsInSubject: Estudiante[]
): Promise<ImportSummaryResult> {
  const existingRUMap = new Set(
    existingStudentsInSubject.map((s) => s.registroUniversitario.toLowerCase().trim())
  );

  let rawRows: RawRow[] = [];

  const fileExt = file.name.split('.').pop()?.toLowerCase();

  if (fileExt === 'csv') {
    const text = await file.text();
    const parsed = Papa.parse<RawRow>(text, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
    });
    rawRows = parsed.data;
  } else {
    // Excel file (.xlsx, .xls)
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rawRows = XLSX.utils.sheet_to_json<RawRow>(worksheet, {
      defval: '',
      raw: false,
    });
  }

  const seenInThisFile = new Set<string>();
  const nuevosEstudiantes: Estudiante[] = [];
  const duplicados: { registro: string; nombre: string }[] = [];
  let invalidosOmitidos = 0;
  let yaExistentesOmitidos = 0;

  for (const row of rawRows) {
    if (!row || typeof row !== 'object') continue;

    // Detect keys
    const ruKey = findKey(row, RU_CANDIDATES);
    const nombreKey = findKey(row, NOMBRE_CANDIDATES);
    const correoKey = findKey(row, CORREO_CANDIDATES);

    let registro = '';
    let nombre = '';
    let correo = '';

    if (ruKey && row[ruKey] !== undefined) {
      registro = String(row[ruKey]).trim();
    }
    if (nombreKey && row[nombreKey] !== undefined) {
      nombre = String(row[nombreKey]).trim();
    }
    if (correoKey && row[correoKey] !== undefined) {
      correo = String(row[correoKey]).trim();
    }

    // Fallback if headers were missing: positional column values
    if (!registro || !nombre) {
      const values = Object.values(row)
        .map((v) => (v !== null && v !== undefined ? String(v).trim() : ''))
        .filter((v) => v !== '');

      if (values.length >= 2) {
        // Look for email (contains @)
        const emailIndex = values.findIndex((v) => v.includes('@'));
        if (emailIndex !== -1) {
          correo = values[emailIndex];
          values.splice(emailIndex, 1);
        }

        // The numeric/code value is likely the RU
        const ruIndex = values.findIndex((v) => /^\d{5,12}$/.test(v.replace(/\s+/g, '')));
        if (ruIndex !== -1) {
          registro = values[ruIndex];
          values.splice(ruIndex, 1);
          nombre = values.join(' ');
        } else if (values.length >= 2) {
          registro = values[0];
          nombre = values.slice(1).join(' ');
        }
      }
    }

    // Validation: Registro and Nombre are strictly required; Email can have default fallback if empty
    if (!registro || !nombre) {
      invalidosOmitidos++;
      continue;
    }

    const normRU = registro.toLowerCase().trim();

    // Check if already in this subject or duplicated in this batch
    if (existingRUMap.has(normRU) || seenInThisFile.has(normRU)) {
      yaExistentesOmitidos++;
      duplicados.push({
        registro,
        nombre,
      });
      continue;
    }

    seenInThisFile.add(normRU);

    // Auto-generate standard institutional email if empty
    if (!correo) {
      const sanitizedName = nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '.');
      correo = `${sanitizedName}@uagrm.edu.bo`;
    }

    const nuevoEstudiante: Estudiante = {
      id: `est-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
      asignaturaId,
      registroUniversitario: registro,
      nombreCompleto: nombre,
      correoElectronico: correo,
      fechaImportacion: Date.now(),
    };

    nuevosEstudiantes.push(nuevoEstudiante);
  }

  return {
    totalLeidos: rawRows.length,
    nuevosAgregados: nuevosEstudiantes.length,
    yaExistentesOmitidos,
    invalidosOmitidos,
    estudiantesNuevos: nuevosEstudiantes,
    duplicadosEncontrados: duplicados,
  };
}

export function generateSampleStudentsFile(format: 'xlsx' | 'csv' = 'xlsx') {
  const sampleData = [
    {
      'Registro Universitario': '220014521',
      'Nombre completo': 'Alvarez Torrico Carlos Daniel',
      'Correo electrónico': 'carlos.alvarez@uagrm.edu.bo',
    },
    {
      'Registro Universitario': '219087654',
      'Nombre completo': 'Balcazar Mendez Maria Elena',
      'Correo electrónico': 'maria.balcazar@uagrm.edu.bo',
    },
    {
      'Registro Universitario': '221045123',
      'Nombre completo': 'Cabrera Justiniano Jorge Luis',
      'Correo electrónico': 'jorge.cabrera@uagrm.edu.bo',
    },
    {
      'Registro Universitario': '220198765',
      'Nombre completo': 'Daza Hurtado Valeria Sofia',
      'Correo electrónico': 'valeria.daza@uagrm.edu.bo',
    },
    {
      'Registro Universitario': '218054321',
      'Nombre completo': 'Eguez Sandoval Fernando Andres',
      'Correo electrónico': 'fernando.eguez@uagrm.edu.bo',
    },
    {
      'Registro Universitario': '221098342',
      'Nombre completo': 'Flores Gutierrez Gabriel Alejandro',
      'Correo electrónico': 'gabriel.flores@uagrm.edu.bo',
    },
    {
      'Registro Universitario': '220034129',
      'Nombre completo': 'Guzman Vaca Laura Patricia',
      'Correo electrónico': 'laura.guzman@uagrm.edu.bo',
    },
    {
      'Registro Universitario': '219045678',
      'Nombre completo': 'Heredia Pinto Sebastian',
      'Correo electrónico': 'sebastian.heredia@uagrm.edu.bo',
    },
  ];

  if (format === 'csv') {
    const csvContent = Papa.unparse(sampleData);
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Estudiantes_UAGRM.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');
    XLSX.writeFile(wb, 'Plantilla_Estudiantes_UAGRM.xlsx');
  }
}
