import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { OfertaAcademicaItem, ModalidadSemanal, SemestreAsignatura } from '../types';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  BookOpen,
  Info,
} from 'lucide-react';

interface AdminImportOfertaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (items: OfertaAcademicaItem[]) => void;
}

function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function findKey(row: any, candidates: string[]): string | undefined {
  const normCandidates = candidates.map(normalizeHeader);
  for (const key of Object.keys(row)) {
    const norm = normalizeHeader(key);
    if (normCandidates.includes(norm)) return key;
  }
  for (const key of Object.keys(row)) {
    const norm = normalizeHeader(key);
    if (normCandidates.some((c) => norm.includes(c) || c.includes(norm))) return key;
  }
  return undefined;
}

function parseHorarioToTimes(horarioRaw?: string): { horaInicio: string; horaFin: string } {
  if (!horarioRaw) return { horaInicio: '07:00', horaFin: '08:30' };
  const cleaned = horarioRaw.trim();
  const parts = cleaned.split(/[-–—/aA]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      horaInicio: normalizeTime(parts[0]) || '07:00',
      horaFin: normalizeTime(parts[1]) || '08:30',
    };
  }
  if (parts.length === 1 && parts[0]) {
    return {
      horaInicio: normalizeTime(parts[0]) || '07:00',
      horaFin: '08:30',
    };
  }
  return { horaInicio: '07:00', horaFin: '08:30' };
}

function normalizeTime(val: string): string {
  const digitsOnly = val.replace(/[^0-9:]/g, '');
  if (!digitsOnly) return '';
  const timeParts = digitsOnly.split(':');
  if (timeParts.length === 2) {
    const hh = timeParts[0].padStart(2, '0');
    const mm = timeParts[1].padEnd(2, '0').slice(0, 2);
    return `${hh}:${mm}`;
  }
  return val;
}

function parseDiasToModalidad(diasRaw?: string): { mod: ModalidadSemanal; diasTexto: string } {
  if (!diasRaw) {
    return { mod: 'LUN_MIE_VIE', diasTexto: 'Lun' };
  }
  const clean = diasRaw.trim();
  const upper = clean.toUpperCase();

  if (upper.includes('SAB') || upper.includes('SÁB')) {
    return { mod: 'SABADO', diasTexto: clean };
  }
  if (upper.includes('MAR') || upper.includes('JUE')) {
    return { mod: 'MAR_JUE', diasTexto: clean };
  }
  return { mod: 'LUN_MIE_VIE', diasTexto: clean };
}

export const AdminImportOfertaModal: React.FC<AdminImportOfertaModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<OfertaAcademicaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setErrorMessage(null);
    setParsedPreview([]);

    try {
      const fileName = selectedFile.name.toLowerCase();
      let rawData: any[] = [];

      if (fileName.endsWith('.csv')) {
        const text = await selectedFile.text();
        const res = Papa.parse(text, { header: true, skipEmptyLines: true });
        rawData = res.data;
      } else {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      }

      if (!rawData || rawData.length === 0) {
        throw new Error('El archivo no contiene filas o datos legibles.');
      }

      const items: OfertaAcademicaItem[] = [];

      rawData.forEach((row, idx) => {
        // Exact matching based on user template:
        // Sigla | Grp | C_Of | Insc | Nombre de la Materia | NSA | Carreras | Cod.Doc. | NombreDoc | Días | Horario | Aula
        const siglaKey = findKey(row, ['sigla', 'sig', 'codigo', 'cod', 'codmateria']);
        const grpKey = findKey(row, ['grp', 'grupo', 'paralelo', 'seccion', 'sec']);
        const cOfKey = findKey(row, ['c_of', 'cof', 'cupo', 'cupoofertado', 'ofertado', 'capacidad']);
        const inscKey = findKey(row, ['insc', 'inscritos', 'alumnos', 'totalinscritos']);
        const nombreKey = findKey(row, [
          'nombredelamateria',
          'nombremateria',
          'asignatura',
          'materia',
          'nombre',
          'descripcion',
        ]);
        const nsaKey = findKey(row, ['nsa', 'semestre', 'seme', 'sem', 'nivel']);
        const carrerasKey = findKey(row, ['carreras', 'carrera', 'programa', 'facultad']);
        const codDocKey = findKey(row, [
          'coddoc',
          'cod.doc.',
          'cod.doc',
          'coddocente',
          'codigodocente',
          'docenteid',
        ]);
        const nombreDocKey = findKey(row, [
          'nombredoc',
          'nombredocente',
          'docente',
          'profesor',
          'nombreprofesor',
        ]);
        const diasKey = findKey(row, ['dias', 'dia', 'diasemana', 'modalidad']);
        const horarioKey = findKey(row, ['horario', 'hora', 'horas', 'horainicio']);
        const aulaKey = findKey(row, ['aula', 'ambiente', 'salon', 'edificio']);

        const sigla = siglaKey ? String(row[siglaKey] || '').trim().toUpperCase() : '';
        const nombre = nombreKey ? String(row[nombreKey] || '').trim() : '';

        // Saltar filas vacías
        if (!sigla && !nombre) return;

        const grupo = grpKey ? String(row[grpKey] || '').trim().toUpperCase() : 'A';
        const cOfRaw = cOfKey ? String(row[cOfKey] || '').trim() : '';
        const inscRaw = inscKey ? String(row[inscKey] || '').trim() : '';
        const cupoOfertado = cOfRaw ? parseInt(cOfRaw, 10) || undefined : undefined;
        const inscritos = inscRaw ? parseInt(inscRaw, 10) || undefined : undefined;

        const nsaRaw = nsaKey ? String(row[nsaKey] || '').trim() : '1';
        let sem: SemestreAsignatura = 1;
        const nsaNum = parseInt(nsaRaw, 10);
        if (!isNaN(nsaNum)) {
          // Semestre 2 si es par, semestre 1 si es impar o 1
          sem = nsaNum % 2 === 0 ? 2 : 1;
        } else if (
          nsaRaw.includes('2') ||
          nsaRaw.toLowerCase().includes('segundo') ||
          nsaRaw.toLowerCase().includes('ii')
        ) {
          sem = 2;
        }

        const carreras = carrerasKey
          ? String(row[carrerasKey] || '').trim()
          : 'Facultad de Ciencias Contables';

        const codDoc = codDocKey ? String(row[codDocKey] || '').trim() : undefined;
        const nombreDoc = nombreDocKey ? String(row[nombreDocKey] || '').trim() : undefined;

        const diasRaw = diasKey ? String(row[diasKey] || '').trim() : 'Lun';
        const { mod, diasTexto } = parseDiasToModalidad(diasRaw);

        const horarioRaw = horarioKey ? String(row[horarioKey] || '').trim() : '07:00-08:30';
        const { horaInicio, horaFin } = parseHorarioToTimes(horarioRaw);

        const aula = aulaKey ? String(row[aulaKey] || '').trim() : undefined;

        items.push({
          id: `oferta-import-${Date.now()}-${idx}`,
          sigla: sigla || 'MAT00',
          nombre: nombre || 'Materia Ofertada',
          grupo: grupo || 'A',
          semestre: sem,
          año: 2026,
          carrera: carreras || 'Facultad de Ciencias Contables',
          modalidad: mod,
          horaInicio,
          horaFin,
          aula: aula || undefined,
          colorTag: '#174EAF',
          cupoOfertado,
          inscritos,
          nsa: !isNaN(nsaNum) ? nsaNum : nsaRaw || 1,
          diasTexto,
          horarioTexto: horarioRaw || `${horaInicio}-${horaFin}`,
          docenteAsignadoId: codDoc || undefined,
          docenteAsignadoNombre: nombreDoc || undefined,
          cupo: cupoOfertado,
        });
      });

      if (items.length === 0) {
        throw new Error('No se detectaron columnas válidas de Sigla o Nombre de la Materia en el archivo.');
      }

      setParsedPreview(items);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error procesando el archivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Exact 12 columns requested by user matching the official UAGRM model image:
    // Sigla | Grp | C_Of | Insc | Nombre de la Materia | NSA | Carreras | Cod.Doc. | NombreDoc | Días | Horario | Aula
    const templateData = [
      {
        Sigla: 'ADM100',
        Grp: 'A',
        C_Of: 40,
        Insc: 21,
        'Nombre de la Materia': 'ADMINISTRACION GENERAL',
        NSA: 1,
        Carreras: '105-5 109-1',
        'Cod.Doc.': '3000',
        NombreDoc: 'AZOGUE ROMERO OSCAR',
        Días: 'Lun',
        Horario: '19:45-21:15',
        Aula: '21318',
      },
      {
        Sigla: 'CPA100',
        Grp: 'B',
        C_Of: 45,
        Insc: 38,
        'Nombre de la Materia': 'CONTABILIDAD BASICA I',
        NSA: 1,
        Carreras: '105-5 109-1',
        'Cod.Doc.': '6379',
        NombreDoc: 'SORICH ROJAS MIGUEL ANTONIO',
        Días: 'Lun, Mie, Vie',
        Horario: '07:00-08:30',
        Aula: '236-01',
      },
      {
        Sigla: 'MAT101',
        Grp: 'SC',
        C_Of: 50,
        Insc: 42,
        'Nombre de la Materia': 'CALCULO I',
        NSA: 1,
        Carreras: '105-5 109-1',
        'Cod.Doc.': '6379',
        NombreDoc: 'SORICH ROJAS MIGUEL ANTONIO',
        Días: 'Mar, Jue',
        Horario: '09:15-11:30',
        Aula: '236-04',
      },
      {
        Sigla: 'FIN200',
        Grp: 'C',
        C_Of: 40,
        Insc: 30,
        'Nombre de la Materia': 'MATEMATICA FINANCIERA',
        NSA: 2,
        Carreras: '105-5',
        'Cod.Doc.': '3015',
        NombreDoc: 'RODRIGUEZ PAZ CARLOS',
        Días: 'Lun, Mie, Vie',
        Horario: '10:00-11:30',
        Aula: '21320',
      },
      {
        Sigla: 'AUD300',
        Grp: 'Z1',
        C_Of: 35,
        Insc: 28,
        'Nombre de la Materia': 'AUDITORIA FINANCIERA I',
        NSA: 3,
        Carreras: '109-1',
        'Cod.Doc.': '3022',
        NombreDoc: 'MENDOZA VARGAS LAURA',
        Días: 'Sab',
        Horario: '07:00-11:30',
        Aula: 'Edif 224',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    // Ajustar anchos de columnas
    ws['!cols'] = [
      { wch: 10 }, // Sigla
      { wch: 6 },  // Grp
      { wch: 8 },  // C_Of
      { wch: 8 },  // Insc
      { wch: 32 }, // Nombre de la Materia
      { wch: 6 },  // NSA
      { wch: 18 }, // Carreras
      { wch: 10 }, // Cod.Doc.
      { wch: 30 }, // NombreDoc
      { wch: 14 }, // Días
      { wch: 16 }, // Horario
      { wch: 12 }, // Aula
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OfertaAcademica');
    XLSX.writeFile(wb, 'plantilla_maestro_oferta_uagrm.xlsx');
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length > 0) {
      onImportComplete(parsedPreview);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#172033] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Importar Maestro de Oferta Académica</h3>
              <p className="text-xs text-slate-400">
                Formato oficial UAGRM (Excel .xlsx o CSV)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Banner de Especificación de Columnas Oficiales (Modelo Solicitado) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#174EAF]" />
                <span className="text-xs font-bold text-slate-800">
                  Estructura de la Plantilla Oficial (12 columnas):
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#174EAF] hover:text-[#103B88] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Plantilla Excel (.xlsx)</span>
              </button>
            </div>

            {/* Visual Header Grid replicating the user's uploaded image */}
            <div className="overflow-x-auto border-2 border-dashed border-emerald-600/70 rounded-lg bg-white shadow-2xs">
              <table className="w-full text-left text-[11px] font-mono border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-emerald-50/60 text-emerald-950 font-bold border-b border-emerald-200">
                    <th className="py-2 px-2.5 border-r border-emerald-200">Sigla</th>
                    <th className="py-2 px-2.5 border-r border-emerald-200">Grp</th>
                    <th className="py-2 px-2.5 border-r border-emerald-200">C_Of</th>
                    <th className="py-2 px-2.5 border-r border-emerald-200">Insc</th>
                    <th className="py-2 px-2.5 border-r border-emerald-200">Nombre de la Materia</th>
                    <th className="py-2 px-2.5 border-r border-emerald-200">NSA</th>
                    <th className="py-2 px-2.5 border-r border-emerald-200">Carreras</th>
                    <th className="py-2 px-2.5 border-r border-emerald-200">Cod.Doc.</th>
                    <th className="py-2 px-2.5 border-r border-emerald-200">NombreDoc</th>
                    <th className="py-2 px-2.5 border-r border-emerald-200">Días</th>
                    <th className="py-2 px-2.5 border-r border-emerald-200">Horario</th>
                    <th className="py-2 px-2.5">Aula</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-slate-700 bg-white">
                    <td className="py-1.5 px-2.5 font-bold text-blue-700 border-r border-slate-200">ADM100</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 font-bold">A</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 text-center">40</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 text-center">21</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                      ADMINISTRACION GENERAL
                    </td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 text-center font-bold">1</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200">105-5 109-1</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200 text-center">3000</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200">AZOGUE ROMERO OSCAR</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200">Lun</td>
                    <td className="py-1.5 px-2.5 border-r border-slate-200">19:45-21:15</td>
                    <td className="py-1.5 px-2.5 font-bold text-slate-800">21318</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-500">
              El importador reconoce automáticamente mayúsculas, minúsculas, espacios y caracteres especiales de estas 12 columnas.
            </p>
          </div>

          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#174EAF] hover:bg-blue-50/40 rounded-2xl p-6 sm:p-7 text-center cursor-pointer transition-colors space-y-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#174EAF] mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {file ? file.name : 'Haz clic para seleccionar el archivo de Oferta Académica'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Formatos soportados: Excel (.xlsx, .xls) o CSV (.csv) con la plantilla de 12 columnas
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview Table with the 12 columns */}
          {parsedPreview.length > 0 && (
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{parsedPreview.length} Asignaturas listas para incorporar a la Oferta:</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Previsualizando primeros registros
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
                      <th className="py-2.5 px-3">Sigla</th>
                      <th className="py-2.5 px-2 text-center">Grp</th>
                      <th className="py-2.5 px-3">Nombre de la Materia</th>
                      <th className="py-2.5 px-2 text-center">C_Of / Insc</th>
                      <th className="py-2.5 px-2 text-center">NSA</th>
                      <th className="py-2.5 px-3">Carreras</th>
                      <th className="py-2.5 px-3">Docente</th>
                      <th className="py-2.5 px-3">Días & Horario</th>
                      <th className="py-2.5 px-2.5">Aula</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedPreview.slice(0, 15).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-[#174EAF]">
                          <span className="bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[11px]">
                            {item.sigla}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-800">
                          {item.grupo}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 max-w-[200px] truncate" title={item.nombre}>
                          {item.nombre}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-600">
                          {item.cupoOfertado !== undefined ? (
                            <span>
                              <strong>{item.cupoOfertado}</strong> / {item.inscritos ?? 0}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-slate-700">
                          {item.nsa ?? item.semestre}
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px] max-w-[140px] truncate" title={item.carrera}>
                          {item.carrera}
                        </td>
                        <td className="py-2 px-3 text-slate-700 text-[11px]">
                          {item.docenteAsignadoNombre ? (
                            <div>
                              <p className="font-semibold">{item.docenteAsignadoNombre}</p>
                              {item.docenteAsignadoId && (
                                <p className="text-[10px] text-slate-400 font-mono">Cod: {item.docenteAsignadoId}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Por asignar</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600 text-[11px]">
                          <span className="font-semibold text-slate-800">{item.diasTexto || 'Lun'}</span>
                          <span className="text-slate-400 mx-1">•</span>
                          <span className="font-mono">{item.horarioTexto || `${item.horaInicio}-${item.horaFin}`}</span>
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-800 font-mono text-[11px]">
                          {item.aula || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedPreview.length > 15 && (
                <p className="text-center text-slate-400 text-xs italic pt-1">
                  ... y {parsedPreview.length - 15} asignaturas más.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#174EAF] hover:underline cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Plantilla (.xlsx)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={parsedPreview.length === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-bold text-white bg-[#174EAF] hover:bg-[#103B88] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar e Importar {parsedPreview.length > 0 ? `(${parsedPreview.length})` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
