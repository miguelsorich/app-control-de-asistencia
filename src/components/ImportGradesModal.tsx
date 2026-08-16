import React, { useState, useRef } from 'react';
import { Asignatura, Estudiante, NotaEstudiante, ImportGradesSummary } from '../types';
import { parseFileForGrades, generateSampleGradesExcel } from '../utils/gradeParser';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  HelpCircle,
  RefreshCw,
  UserX,
} from 'lucide-react';

interface ImportGradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  asignatura: Asignatura | null;
  subjectStudents: Estudiante[];
  existingGrades: NotaEstudiante[];
  onImportComplete: (importedGrades: NotaEstudiante[], summary: ImportGradesSummary) => void;
}

export const ImportGradesModal: React.FC<ImportGradesModalProps> = ({
  isOpen,
  onClose,
  asignatura,
  subjectStudents,
  existingGrades,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<ImportGradesSummary | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !asignatura) return null;

  const handleReset = () => {
    setFile(null);
    setIsProcessing(false);
    setErrorMessage(null);
    setImportSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setErrorMessage(
        'Formato no compatible. Por favor suba un archivo en formato Excel (.xlsx, .xls) o CSV (.csv).'
      );
      setFile(null);
      return;
    }

    setErrorMessage(null);
    setFile(selectedFile);
    setImportSummary(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessImport = async () => {
    if (!file || !asignatura) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await parseFileForGrades(
        file,
        asignatura.id,
        subjectStudents,
        existingGrades
      );

      if (result.erroresDetalle && result.erroresDetalle.length > 0) {
        setErrorMessage(result.erroresDetalle.join(' '));
        setIsProcessing(false);
        return;
      }

      setImportSummary(result);
      onImportComplete(result.notasValidas, result);
    } catch (err: any) {
      console.error('Error importing grades:', err);
      setErrorMessage(
        `Error al procesar el archivo: ${err?.message || 'Verifique el formato del archivo'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!asignatura) return;
    generateSampleGradesExcel(asignatura.sigla, asignatura.grupo, subjectStudents);
  };

  return (
    <div
      id="modal-importar-notas"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#172033]/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-[#DCE3EC] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#174EAF] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Importar Notas desde Excel (6 Columnas)</h2>
              <p className="text-xs text-[#E8F0FC]/80">
                {asignatura.sigla} - {asignatura.nombre} (Grupo {asignatura.grupo} · Semestre {asignatura.semestre || 1}/{asignatura.año || 2026})
              </p>
            </div>
          </div>
          <button
            id="btn-close-import-grades-modal"
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {!importSummary ? (
            <>
              {/* Instructions Banner */}
              <div className="bg-[#F5F7FA] border border-[#DCE3EC] rounded-2xl p-4 text-xs text-[#667085] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="font-bold text-[#172033] flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#174EAF]" />
                    Estructura requerida de 6 columnas en el archivo Excel:
                  </span>
                  <button
                    id="btn-descargar-plantilla-notas"
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1 text-[#174EAF] hover:text-[#103B88] font-bold underline cursor-pointer self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar plantilla con alumnos</span>
                  </button>
                </div>
                <p className="text-[#172033]">
                  El archivo Excel debe contener exactamente estas 6 columnas en la primera fila:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 text-center font-mono font-bold bg-white p-2 rounded-xl border border-[#DCE3EC] text-[#172033] text-[11px]">
                  <div className="bg-[#E8F0FC] py-1.5 px-1 rounded-lg text-[#174EAF] truncate" title="Registro Universitario">
                    1. Reg. Univ.
                  </div>
                  <div className="bg-[#E8F0FC] py-1.5 px-1 rounded-lg text-[#174EAF] truncate" title="Nombre">
                    2. Nombre
                  </div>
                  <div className="bg-[#F5F7FA] py-1.5 px-1 rounded-lg text-[#172033] border border-[#DCE3EC] truncate" title="Primer Parcial">
                    3. 1er Parcial
                  </div>
                  <div className="bg-[#F5F7FA] py-1.5 px-1 rounded-lg text-[#172033] border border-[#DCE3EC] truncate" title="Segundo Parcial">
                    4. 2do Parcial
                  </div>
                  <div className="bg-[#F5F7FA] py-1.5 px-1 rounded-lg text-[#172033] border border-[#DCE3EC] truncate" title="Examen Final">
                    5. Ex. Final
                  </div>
                  <div className="bg-[#E8F0FC] py-1.5 px-1 rounded-lg text-[#174EAF] border border-[#DCE3EC] truncate" title="Nota Final (viene calculada en el Excel)">
                    6. Nota Final
                  </div>
                </div>
                <div className="text-[11px] text-[#667085] space-y-1">
                  <p>
                    • <strong>Identificación:</strong> Se utiliza el <strong>Registro Universitario</strong> para asociar las notas al estudiante correcto de la asignatura.
                  </p>
                  <p>
                    • <strong>Nota Final:</strong> La aplicación <strong>no calcula ni promedia</strong> la nota final; utiliza exactamente el valor importado en la columna <strong>Nota Final</strong>.
                  </p>
                  <p>
                    • <strong>Actualizaciones:</strong> Si un estudiante ya tiene notas previas en esta asignatura, sus notas se actualizarán sin duplicarlo.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-3 text-red-800 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Error de importación</strong>
                    <span className="text-red-700">{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Upload Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#174EAF] bg-[#E8F0FC]/50 scale-[0.99]'
                    : file
                    ? 'border-[#174EAF] bg-[#E8F0FC]/30'
                    : 'border-[#DCE3EC] hover:border-[#174EAF] bg-[#F5F7FA]/50 hover:bg-[#F5F7FA]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="input-file-grades-excel"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-[#E8F0FC] text-[#174EAF] mx-auto flex items-center justify-center">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-[#172033] text-sm">{file.name}</p>
                      <p className="text-xs text-[#667085]">
                        {(file.size / 1024).toFixed(1)} KB • Archivo listo para importar
                      </p>
                    </div>
                    <p className="text-xs text-[#174EAF] font-semibold underline pt-1">
                      Haga clic para seleccionar otro archivo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-[#E8F0FC] text-[#174EAF] mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-[#172033] text-sm">
                        Arrastre y suelte su archivo Excel con las 6 columnas aquí
                      </p>
                      <p className="text-xs text-[#667085]">
                        o haga clic para explorar en su equipo (.xlsx, .xls, .csv)
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] text-[#667085] bg-white px-2.5 py-1 rounded-md border border-[#DCE3EC] mt-2">
                      <FileText className="w-3 h-3" />
                      <span>Formatos soportados: Excel (.xlsx, .xls) y CSV (.csv)</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Result Summary Screen */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-[#E8F0FC] border border-[#DCE3EC] rounded-2xl p-4 text-[#172033] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#174EAF] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-[#174EAF]">Proceso de Importación Finalizado</h4>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Se procesaron las 6 columnas de notas para la asignatura <strong>{asignatura.sigla} - Grupo {asignatura.grupo}</strong>.
                  </p>
                </div>
              </div>

              {/* Metric Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Nuevas notas */}
                <div className="bg-white border border-[#DCE3EC] p-3.5 rounded-2xl shadow-2xs text-center">
                  <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider block">
                    Estudiantes Procesados
                  </span>
                  <span className="text-2xl font-black text-[#174EAF] mt-1 block">
                    {importSummary.importadosCorrectamente}
                  </span>
                  <span className="text-[11px] text-[#667085]">calificaciones registradas</span>
                </div>

                {/* Actualizadas */}
                <div className="bg-white border border-[#DCE3EC] p-3.5 rounded-2xl shadow-2xs text-center">
                  <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider block">
                    Notas Actualizadas
                  </span>
                  <span className="text-2xl font-black text-[#174EAF] mt-1 block">
                    {importSummary.actualizados}
                  </span>
                  <span className="text-[11px] text-[#667085]">registros sobreescritos</span>
                </div>

                {/* No encontrados */}
                <div className="bg-white border border-[#DCE3EC] p-3.5 rounded-2xl shadow-2xs text-center">
                  <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider block">
                    Registros No Encontrados
                  </span>
                  <span
                    className={`text-2xl font-black mt-1 block ${
                      importSummary.noEncontradosCount > 0 ? 'text-amber-600' : 'text-[#667085]'
                    }`}
                  >
                    {importSummary.noEncontradosCount}
                  </span>
                  <span className="text-[11px] text-[#667085]">no pertenecen a la materia</span>
                </div>
              </div>

              {/* Detailed list of Not Found Registros */}
              {importSummary.noEncontrados.length > 0 && (
                <div className="bg-[#F5F7FA] border border-[#DCE3EC] rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#172033]">
                    <UserX className="w-4 h-4 text-amber-600" />
                    <span>
                      Registros Universitarios no encontrados en esta asignatura ({importSummary.noEncontrados.length}):
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667085]">
                    Los siguientes registros del archivo Excel no coinciden con ningún estudiante inscrito en la asignatura seleccionada y fueron omitidos para preservar la integridad de datos:
                  </p>
                  <div className="max-h-40 overflow-y-auto divide-y divide-[#DCE3EC] bg-white rounded-xl border border-[#DCE3EC] text-xs">
                    {importSummary.noEncontrados.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <span className="font-mono font-bold text-[#174EAF] mr-2">
                            RU: {item.registro}
                          </span>
                          <span className="text-[#172033]">{item.nombre}</span>
                        </div>
                        <div className="font-mono text-[#667085] text-[11px]">
                          P1: {item.primerParcial ?? '-'} | P2: {item.segundoParcial ?? '-'} | EF: {item.examenFinal ?? '-'} | NF: {item.notaFinal ?? '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F5F7FA] px-6 py-4 border-t border-[#DCE3EC] flex items-center justify-between">
          {!importSummary ? (
            <>
              <button
                id="btn-cancelar-importacion-notas"
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-[#667085] hover:text-[#172033] hover:bg-[#E8F0FC] rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                id="btn-confirmar-importar-notas"
                type="button"
                disabled={!file || isProcessing}
                onClick={handleProcessImport}
                className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                  !file || isProcessing
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#174EAF] hover:bg-[#103B88]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Procesando archivo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importar Notas</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                id="btn-finalizar-importacion-notas"
                type="button"
                onClick={handleClose}
                className="px-5 py-2 text-xs font-bold text-white bg-[#174EAF] hover:bg-[#103B88] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Cerrar y Ver Tabla de Notas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
