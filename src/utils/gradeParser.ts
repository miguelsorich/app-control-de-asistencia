import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Estudiante, NotaEstudiante, ImportGradesSummary } from '../types';

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
  'nombre',
  'nombrecompleto',
  'nombres',
  'apellidosynombres',
  'nombresyapellidos',
  'estudiante',
  'alumno',
  'fullname',
];

const PRIMER_PARCIAL_CANDIDATES = [
  'primerparcial',
  '1erparcial',
  '1parcial',
  'parcial1',
  'p1',
  'primer_parcial',
  '1_parcial',
  'parcial_1',
];

const SEGUNDO_PARCIAL_CANDIDATES = [
  'segundoparcial',
  '2doparcial',
  '2parcial',
  'parcial2',
  'p2',
  'segundo_parcial',
  '2_parcial',
  'parcial_2',
];

const EXAMEN_FINAL_CANDIDATES = [
  'examenfinal',
  'exfinal',
  'final',
  'ef',
  'examen_final',
  'ex_final',
  'examen',
];

const NOTA_FINAL_CANDIDATES = [
  'notafinal',
  'nf',
  'nota_final',
  'calificacionfinal',
  'definitiva',
  'total',
  'promediofinal',
  'nota',
];

export function parseGradeValue(val: any): number | string {
  if (val === undefined || val === null) return '-';
  const str = String(val).trim();
  if (str === '' || str === '-') return '-';
  const cleanStr = str.replace(',', '.');
  const num = Number(cleanStr);
  if (!isNaN(num)) {
    return num;
  }
  return str;
}

export async function parseFileForGrades(
  file: File,
  asignaturaId: string,
  subjectStudents: Estudiante[],
  existingGradesInSubject: NotaEstudiante[]
): Promise<ImportGradesSummary> {
  // Map of RU to enrolled student in this subject (case insensitive)
  const enrolledStudentMap = new Map<string, Estudiante>();
  subjectStudents.forEach((student) => {
    enrolledStudentMap.set(student.registroUniversitario.trim().toLowerCase(), student);
  });

  // Map of RU to existing grade in this subject
  const existingGradeMap = new Map<string, NotaEstudiante>();
  existingGradesInSubject.forEach((g) => {
    existingGradeMap.set(g.registroUniversitario.trim().toLowerCase(), g);
  });

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

  if (rawRows.length === 0) {
    return {
      totalLeidos: 0,
      importadosCorrectamente: 0,
      actualizados: 0,
      noEncontradosCount: 0,
      noEncontrados: [],
      notasValidas: [],
      erroresDetalle: ['El archivo seleccionado está vacío o no contiene filas con datos válidos.'],
    };
  }

  // Detect 6 columns from the first row
  const firstRow = rawRows[0];
  const ruKey = findKey(firstRow, RU_CANDIDATES);
  const nombreKey = findKey(firstRow, NOMBRE_CANDIDATES);
  const p1Key = findKey(firstRow, PRIMER_PARCIAL_CANDIDATES);
  const p2Key = findKey(firstRow, SEGUNDO_PARCIAL_CANDIDATES);
  const efKey = findKey(firstRow, EXAMEN_FINAL_CANDIDATES);
  const nfKey = findKey(firstRow, NOTA_FINAL_CANDIDATES);

  const missingCols: string[] = [];
  if (!ruKey) missingCols.push('1. Registro Universitario');
  if (!nombreKey) missingCols.push('2. Nombre');
  if (!p1Key) missingCols.push('3. Primer Parcial');
  if (!p2Key) missingCols.push('4. Segundo Parcial');
  if (!efKey) missingCols.push('5. Examen Final');
  if (!nfKey) missingCols.push('6. Nota Final');

  if (missingCols.length > 0) {
    return {
      totalLeidos: rawRows.length,
      importadosCorrectamente: 0,
      actualizados: 0,
      noEncontradosCount: 0,
      noEncontrados: [],
      notasValidas: [],
      erroresDetalle: [
        `No se encontraron las siguientes columnas requeridas: ${missingCols.join(', ')}. El archivo Excel debe contener exactamente las 6 columnas: Registro Universitario, Nombre, Primer Parcial, Segundo Parcial, Examen Final y Nota Final.`,
      ],
    };
  }

  const notasValidas: NotaEstudiante[] = [];
  const noEncontrados: {
    registro: string;
    nombre: string;
    primerParcial?: string | number;
    segundoParcial?: string | number;
    examenFinal?: string | number;
    notaFinal?: string | number;
  }[] = [];

  let importadosCorrectamente = 0; // new
  let actualizados = 0; // updated
  const seenRUsInFile = new Set<string>();

  rawRows.forEach((row) => {
    const rawRU = ruKey ? String(row[ruKey] ?? '').trim() : '';
    const rawNombre = nombreKey ? String(row[nombreKey] ?? '').trim() : '';
    const rawP1 = p1Key ? row[p1Key] : '';
    const rawP2 = p2Key ? row[p2Key] : '';
    const rawEF = efKey ? row[efKey] : '';
    const rawNF = nfKey ? row[nfKey] : '';

    // Ignore completely empty rows
    if (!rawRU && !rawNombre && rawP1 === '' && rawP2 === '' && rawEF === '' && rawNF === '') {
      return;
    }

    if (!rawRU) {
      // Missing RU cannot be identified
      return;
    }

    const normalizedRU = rawRU.toLowerCase();

    // Parse each grade individually without calculating or averaging Nota Final
    const p1Parsed = parseGradeValue(rawP1);
    const p2Parsed = parseGradeValue(rawP2);
    const efParsed = parseGradeValue(rawEF);
    const nfParsed = parseGradeValue(rawNF); // Exact value imported from Nota Final column

    // Strictly identify student by Registro Universitario
    const enrolledStudent = enrolledStudentMap.get(normalizedRU);

    if (!enrolledStudent) {
      // RU NOT FOUND in the selected subject
      noEncontrados.push({
        registro: rawRU,
        nombre: rawNombre || '(Sin nombre en archivo)',
        primerParcial: p1Parsed,
        segundoParcial: p2Parsed,
        examenFinal: efParsed,
        notaFinal: nfParsed,
      });
      return;
    }

    // Use official name from enrolled student
    const finalNombre = enrolledStudent.nombreCompleto || rawNombre;

    // Check if updating existing grade or adding new
    const existingGrade = existingGradeMap.get(normalizedRU);
    const gradeId = existingGrade
      ? existingGrade.id
      : `nota-${asignaturaId}-${normalizedRU}`;

    if (existingGrade || seenRUsInFile.has(normalizedRU)) {
      actualizados++;
    } else {
      importadosCorrectamente++;
    }

    seenRUsInFile.add(normalizedRU);

    notasValidas.push({
      id: gradeId,
      asignaturaId,
      registroUniversitario: enrolledStudent.registroUniversitario,
      nombreCompleto: finalNombre,
      primerParcial: p1Parsed,
      segundoParcial: p2Parsed,
      examenFinal: efParsed,
      notaFinal: nfParsed, // Exact value imported
      nota: nfParsed, // For backward compatibility
      fechaActualizacion: Date.now(),
    });
  });

  return {
    totalLeidos: rawRows.length,
    importadosCorrectamente,
    actualizados,
    noEncontradosCount: noEncontrados.length,
    noEncontrados,
    notasValidas,
  };
}

/**
 * Generates and downloads a sample Excel (.xlsx) file with the exact 6 columns:
 * Registro Universitario | Nombre | Primer Parcial | Segundo Parcial | Examen Final | Nota Final
 * Pre-filled with the students enrolled in the subject if available
 */
export function generateSampleGradesExcel(
  subjectSigla: string,
  subjectGrupo: string,
  students: Estudiante[]
) {
  let data: any[] = [];

  if (students.length > 0) {
    data = students.map((s, index) => {
      const p1 = index === 0 ? 85 : index === 1 ? 90 : index === 2 ? 70 : index === 3 ? 80 : 75;
      const p2 = index === 0 ? 90 : index === 1 ? 95 : index === 2 ? 75 : index === 3 ? 84 : 80;
      const ef = index === 0 ? 88 : index === 1 ? 92 : index === 2 ? 80 : index === 3 ? 82 : 78;
      const nf = index === 0 ? 88 : index === 1 ? 95 : index === 2 ? 76 : index === 3 ? 82 : 78;
      return {
        'Registro Universitario': s.registroUniversitario,
        'Nombre': s.nombreCompleto,
        'Primer Parcial': p1,
        'Segundo Parcial': p2,
        'Examen Final': ef,
        'Nota Final': nf,
      };
    });
  } else {
    data = [
      {
        'Registro Universitario': '220014521',
        'Nombre': 'Alvarez Gomez Carlos Daniel',
        'Primer Parcial': 85,
        'Segundo Parcial': 90,
        'Examen Final': 88,
        'Nota Final': 88,
      },
      {
        'Registro Universitario': '219087654',
        'Nombre': 'Fernandez Mendoza Sofia Laura',
        'Primer Parcial': 95,
        'Segundo Parcial': 92,
        'Examen Final': 98,
        'Nota Final': 95,
      },
      {
        'Registro Universitario': '221045123',
        'Nombre': 'Justiniano Suarez Jorge Luis',
        'Primer Parcial': 70,
        'Segundo Parcial': 75,
        'Examen Final': 80,
        'Nota Final': 76,
      },
    ];
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 22 }, // Registro Universitario
    { wch: 35 }, // Nombre
    { wch: 15 }, // Primer Parcial
    { wch: 15 }, // Segundo Parcial
    { wch: 15 }, // Examen Final
    { wch: 15 }, // Nota Final
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Notas');

  const safeSigla = subjectSigla.replace(/[^a-zA-Z0-9]/g, '_');
  const safeGrupo = subjectGrupo.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(workbook, `Plantilla_Notas_6_Columnas_${safeSigla}_G${safeGrupo}.xlsx`);
}
