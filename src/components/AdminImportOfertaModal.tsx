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
        const siglaKey = findKey(row, ['sigla', 'codigo', 'codmateria', 'siglamateria', 'clave']);
        const nombreKey = findKey(row, ['nombre', 'asignatura', 'materia', 'nombremateria', 'descripcion']);
        const grupoKey = findKey(row, ['grupo', 'paralelo', 'seccion', 'grp']);
        const semestreKey = findKey(row, ['semestre', 'sem', 'nivel']);
        const carreraKey = findKey(row, ['carrera', 'facultad', 'programa']);
        const modalidadKey = findKey(row, ['modalidad', 'dias', 'tipo']);
        const horaInicioKey = findKey(row, ['horainicio', 'inicio', 'desde']);
        const horaFinKey = findKey(row, ['horafin', 'fin', 'hasta']);
        const aulaKey = findKey(row, ['aula', 'ambiente', 'salon']);

        const sigla = siglaKey ? String(row[siglaKey] || '').trim().toUpperCase() : '';
        const nombre = nombreKey ? String(row[nombreKey] || '').trim() : '';

        if (!sigla && !nombre) return; // skip blank rows

        const grupo = grupoKey ? String(row[grupoKey] || '').trim().toUpperCase() : 'G1';
        let sem: SemestreAsignatura = 1;
        if (semestreKey) {
          const val = String(row[semestreKey]).trim();
          if (val === '2' || val.toLowerCase().includes('segundo') || val.toLowerCase().includes('ii')) {
            sem = 2;
          }
        }

        const carrera = carreraKey ? String(row[carreraKey] || '').trim() : 'Facultad de Ciencias Contables';
        let mod: ModalidadSemanal = 'LUN_MIE_VIE';
        if (modalidadKey) {
          const mStr = String(row[modalidadKey]).toUpperCase();
          if (mStr.includes('MAR') || mStr.includes('JUE')) mod = 'MAR_JUE';
          else if (mStr.includes('SAB') || mStr.includes('SÁB')) mod = 'SABADO';
        }

        const horaInicio = horaInicioKey && String(row[horaInicioKey]).trim() ? String(row[horaInicioKey]).trim() : '07:00';
        const horaFin = horaFinKey && String(row[horaFinKey]).trim() ? String(row[horaFinKey]).trim() : '08:30';
        const aula = aulaKey ? String(row[aulaKey] || '').trim() : undefined;

        items.push({
          id: `oferta-import-${Date.now()}-${idx}`,
          sigla: sigla || 'MAT-00',
          nombre: nombre || 'Materia Ofertada',
          grupo: grupo || 'G1',
          semestre: sem,
          año: 2026,
          carrera: carrera || 'Contaduría Pública',
          modalidad: mod,
          horaInicio,
          horaFin,
          aula,
          colorTag: '#174EAF',
        });
      });

      if (items.length === 0) {
        throw new Error('No se detectaron columnas válidas de Sigla o Asignatura en el archivo.');
      }

      setParsedPreview(items);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error procesando el archivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Sigla: 'CPA-100',
        Asignatura: 'Contabilidad Básica I',
        Grupo: 'G1',
        Semestre: 1,
        Carrera: 'Contaduría Pública',
        Modalidad: 'LUN_MIE_VIE',
        HoraInicio: '07:00',
        HoraFin: '08:30',
        Aula: 'Aula 236-01',
      },
      {
        Sigla: 'AUD-200',
        Asignatura: 'Auditoría Financiera I',
        Grupo: 'G1',
        Semestre: 2,
        Carrera: 'Auditoría Financiera',
        Modalidad: 'MAR_JUE',
        HoraInicio: '09:15',
        HoraFin: '11:30',
        Aula: 'Aula 236-04',
      },
      {
        Sigla: 'ADM-100',
        Asignatura: 'Administración General',
        Grupo: 'G2',
        Semestre: 1,
        Carrera: 'Administración de Empresas',
        Modalidad: 'LUN_MIE_VIE',
        HoraInicio: '10:00',
        HoraFin: '11:30',
        Aula: 'Aula 236-08',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
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
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#172033] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Importar Maestro de Oferta</h3>
              <p className="text-xs text-slate-400">Cargar catálogo de asignaturas desde Excel o CSV</p>
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
          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#174EAF] hover:bg-blue-50/40 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors space-y-3"
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
                Formatos soportados: Excel (.xlsx, .xls) o CSV (.csv)
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Columnas sugeridas: Sigla, Asignatura, Grupo, Semestre, Carrera, Modalidad, Horario, Aula</span>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#174EAF] hover:underline cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Plantilla Excel</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Preview */}
          {parsedPreview.length > 0 && (
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{parsedPreview.length} Asignaturas listas para importar:</span>
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                {parsedPreview.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#174EAF] font-bold text-[11px]">
                        {item.sigla}
                      </span>
                      <span className="font-semibold text-slate-800">{item.nombre}</span>
                      <span className="text-slate-500 text-[11px]">({item.carrera})</span>
                    </div>
                    <span className="text-slate-500 text-[11px] font-medium">
                      G: {item.grupo} • Sem: {item.semestre}
                    </span>
                  </div>
                ))}
                {parsedPreview.length > 10 && (
                  <div className="p-2 text-center text-slate-400 text-xs italic">
                    ... y {parsedPreview.length - 10} asignaturas más.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
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
  );
};
