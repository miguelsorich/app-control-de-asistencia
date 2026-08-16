import React, { useState, useRef } from 'react';
import { Asignatura, Estudiante, ImportSummaryResult } from '../types';
import { parseFileForStudents, generateSampleStudentsFile } from '../utils/studentParser';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Users,
  Download,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asignatura: Asignatura | null;
  existingStudentsInSubject: Estudiante[];
  onImportComplete: (newStudents: Estudiante[]) => void;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
  asignatura,
  existingStudentsInSubject,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportSummaryResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !asignatura) return null;

  const handleReset = () => {
    setFile(null);
    setIsProcessing(false);
    setErrorMessage(null);
    setImportResult(null);
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
    setImportResult(null);
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
      const result = await parseFileForStudents(
        file,
        asignatura.id,
        existingStudentsInSubject
      );

      setImportResult(result);

      if (result.nuevosAgregados > 0) {
        onImportComplete(result.estudiantesNuevos);
      }
    } catch (err: any) {
      console.error('Error parsing student file:', err);
      setErrorMessage(
        'Ocurrió un error al procesar el archivo. Verifique que las columnas contengan "Registro Universitario", "Nombre completo" y "Correo electrónico".'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="modal-import-students-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#172033]/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div
        id="modal-import-students-container"
        className="bg-white rounded-2xl shadow-2xl border border-[#DCE3EC] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-[#174EAF] px-6 py-4.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold">Importar Lista de Estudiantes</h2>
                <span className="bg-[#E8F0FC] text-[#174EAF] text-xs px-2.5 py-0.5 rounded-lg font-mono font-bold">
                  {asignatura.sigla} - Grupo {asignatura.grupo}
                </span>
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-lg font-medium">
                  Semestre {asignatura.semestre || 1} · {asignatura.año || 2026}
                </span>
              </div>
              <p className="text-xs text-[#E8F0FC]/80 line-clamp-1">
                Asignatura: <span className="font-semibold text-white">{asignatura.nombre}</span>
              </p>
            </div>
          </div>
          <button
            id="btn-close-import-modal"
            type="button"
            onClick={handleClose}
            className="text-[#E8F0FC] hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {!importResult ? (
            <>
              {/* Instructions & Required Columns Card */}
              <div className="bg-[#F5F7FA] border border-[#DCE3EC] rounded-2xl p-4 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172033] flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-[#174EAF]" />
                    Estructura requerida del archivo (Excel o CSV):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => generateSampleStudentsFile('xlsx')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#174EAF] hover:text-[#103B88] bg-white hover:bg-[#E8F0FC] border border-[#DCE3EC] px-2.5 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-[#174EAF]" />
                      <span>Descargar Plantilla (.xlsx)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-[#DCE3EC] shadow-2xs">
                    <p className="font-bold text-[#172033] text-xs">1. Registro Universitario</p>
                    <p className="text-[11px] text-[#667085] mt-0.5">Ej. 220014521</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#DCE3EC] shadow-2xs">
                    <p className="font-bold text-[#172033] text-xs">2. Nombre completo</p>
                    <p className="text-[11px] text-[#667085] mt-0.5">Ej. Alvarez Torrico Carlos</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#DCE3EC] shadow-2xs">
                    <p className="font-bold text-[#172033] text-xs">3. Correo electrónico</p>
                    <p className="text-[11px] text-[#667085] mt-0.5">Ej. carlos.alvarez@uagrm.edu.bo</p>
                  </div>
                </div>

                <p className="text-[11px] text-[#667085] flex items-center gap-1 pt-1">
                  <HelpCircle className="w-3.5 h-3.5 text-[#174EAF]" />
                  <span>
                    Si ya existen estudiantes en esta asignatura, solo se añadirán los nuevos sin duplicar registros existentes.
                  </span>
                </p>
              </div>

              {/* Upload Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-[#174EAF] bg-[#E8F0FC]/50'
                    : file
                    ? 'border-[#174EAF] bg-[#E8F0FC]/30'
                    : 'border-[#DCE3EC] hover:border-[#174EAF] bg-[#F5F7FA]/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="input-file-students"
                />

                <div className="flex flex-col items-center justify-center space-y-2.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      file
                        ? 'bg-[#E8F0FC] text-[#174EAF]'
                        : 'bg-[#E8F0FC] text-[#174EAF]'
                    }`}
                  >
                    {file ? (
                      <FileSpreadsheet className="w-6 h-6" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>

                  {file ? (
                    <div>
                      <p className="text-sm font-bold text-[#172033]">{file.name}</p>
                      <p className="text-xs text-[#667085] mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB — Listo para procesar
                      </p>
                      <span className="inline-block mt-2 text-[11px] text-[#174EAF] bg-[#E8F0FC] px-2.5 py-0.5 rounded-full font-semibold border border-[#DCE3EC]">
                        Archivo seleccionado (haga clic para cambiar)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-[#172033]">
                        Arrastre su archivo Excel o CSV aquí, o haga clic para seleccionar
                      </p>
                      <p className="text-xs text-[#667085] mt-1">
                        Formatos soportados: .xlsx, .xls, .csv
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          ) : (
            /* Import Results View */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-[#E8F0FC] border border-[#DCE3EC] text-[#172033] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#174EAF] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-[#174EAF]">
                    Procesamiento de importación completado
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    El archivo fue procesado con éxito para la asignatura {asignatura.sigla}.
                  </p>
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-[#F5F7FA] border border-[#DCE3EC] rounded-xl text-center">
                  <p className="text-[11px] font-semibold text-[#667085] uppercase">
                    Total Leídos
                  </p>
                  <p className="text-xl font-bold text-[#172033] mt-0.5">
                    {importResult.totalLeidos}
                  </p>
                </div>

                <div className="p-3.5 bg-[#E8F0FC] border border-[#DCE3EC] rounded-xl text-center">
                  <p className="text-[11px] font-semibold text-[#174EAF] uppercase">
                    Nuevos Agregados
                  </p>
                  <p className="text-xl font-bold text-[#174EAF] mt-0.5">
                    +{importResult.nuevosAgregados}
                  </p>
                </div>

                <div className="p-3.5 bg-[#F5F7FA] border border-[#DCE3EC] rounded-xl text-center col-span-2 sm:col-span-1">
                  <p className="text-[11px] font-semibold text-[#667085] uppercase">
                    Ya Existían (No duplicados)
                  </p>
                  <p className="text-xl font-bold text-[#667085] mt-0.5">
                    {importResult.yaExistentesOmitidos}
                  </p>
                </div>
              </div>

              {/* Sample of Added Students */}
              {importResult.nuevosAgregados > 0 && (
                <div className="border border-[#DCE3EC] rounded-2xl overflow-hidden">
                  <div className="bg-[#E8F0FC] px-4 py-2 text-xs font-bold text-[#172033] flex items-center justify-between border-b border-[#DCE3EC]">
                    <span>Estudiantes agregados en esta importación:</span>
                    <span className="text-[#667085] font-normal text-[11px]">
                      {importResult.nuevosAgregados} registros
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-[#DCE3EC] text-xs bg-white">
                    {importResult.estudiantesNuevos.map((est) => (
                      <div
                        key={est.id}
                        className="px-4 py-2 flex items-center justify-between hover:bg-[#F5F7FA]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#174EAF] bg-[#E8F0FC] px-1.5 py-0.5 rounded text-[11px]">
                            {est.registroUniversitario}
                          </span>
                          <span className="font-medium text-[#172033]">
                            {est.nombreCompleto}
                          </span>
                        </div>
                        <span className="text-[#667085] text-[11px] hidden sm:inline">
                          {est.correoElectronico}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {importResult.yaExistentesOmitidos > 0 && (
                <div className="p-3 bg-[#F5F7FA] border border-[#DCE3EC] rounded-xl text-xs text-[#667085]">
                  <p className="font-semibold flex items-center gap-1.5 text-[#172033]">
                    <Users className="w-3.5 h-3.5 text-[#174EAF]" />
                    <span>
                      {importResult.yaExistentesOmitidos}{' '}
                      {importResult.yaExistentesOmitidos === 1
                        ? 'estudiante ya estaba registrado'
                        : 'estudiantes ya estaban registrados'}{' '}
                      en esta asignatura y se mantuvo su registro previo.
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F5F7FA] px-6 py-4 border-t border-[#DCE3EC] flex items-center justify-between">
          {!importResult ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-[#667085] hover:bg-[#E8F0FC] rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-procesar-importacion"
                type="button"
                onClick={handleProcessImport}
                disabled={!file || isProcessing}
                className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer ${
                  !file || isProcessing
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#174EAF] hover:bg-[#103B88]'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{isProcessing ? 'Procesando archivo...' : 'Importar Estudiantes'}</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 text-xs font-semibold text-[#667085] hover:bg-[#E8F0FC] rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5 text-[#174EAF]" />
                <span>Importar otro archivo</span>
              </button>
              <button
                id="btn-finalizar-importacion"
                type="button"
                onClick={handleClose}
                className="px-5 py-2 text-xs font-bold text-white bg-[#174EAF] hover:bg-[#103B88] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finalizar y Ver Lista</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
