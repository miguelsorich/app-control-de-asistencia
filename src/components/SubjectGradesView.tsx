import React, { useState, useMemo } from 'react';
import { Asignatura, Estudiante, NotaEstudiante, ImportGradesSummary } from '../types';
import { ImportGradesModal } from './ImportGradesModal';
import {
  FileSpreadsheet,
  Upload,
  Search,
  BookOpen,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronDown,
} from 'lucide-react';

interface SubjectGradesViewProps {
  asignaturas: Asignatura[];
  estudiantes: Estudiante[];
  notas: NotaEstudiante[];
  onSaveGrades: (updatedGrades: NotaEstudiante[]) => void;
  initialSelectedSubjectId?: string | null;
}

export const SubjectGradesView: React.FC<SubjectGradesViewProps> = ({
  asignaturas,
  estudiantes,
  notas,
  onSaveGrades,
  initialSelectedSubjectId,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (
      initialSelectedSubjectId &&
      asignaturas.some((a) => a.id === initialSelectedSubjectId)
    ) {
      return initialSelectedSubjectId;
    }
    return asignaturas.length > 0 ? asignaturas[0].id : '';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [lastImportSummary, setLastImportSummary] = useState<ImportGradesSummary | null>(null);

  const selectedSubject = useMemo(() => {
    return asignaturas.find((a) => a.id === selectedSubjectId) || null;
  }, [asignaturas, selectedSubjectId]);

  // Students enrolled in this selected subject
  const subjectStudents = useMemo(() => {
    if (!selectedSubjectId) return [];
    return estudiantes.filter((e) => e.asignaturaId === selectedSubjectId);
  }, [estudiantes, selectedSubjectId]);

  // Grades registered for this selected subject
  const subjectGrades = useMemo(() => {
    if (!selectedSubjectId) return [];
    return notas.filter((n) => n.asignaturaId === selectedSubjectId);
  }, [notas, selectedSubjectId]);

  // Map of RU to grade
  const gradeByRUMap = useMemo(() => {
    const map = new Map<string, NotaEstudiante>();
    subjectGrades.forEach((g) => {
      map.set(g.registroUniversitario.trim().toLowerCase(), g);
    });
    return map;
  }, [subjectGrades]);

  // Combined rows for the 6-column table:
  // | Registro Universitario | Nombre | Primer Parcial | Segundo Parcial | Examen Final | Nota Final |
  const displayRows = useMemo(() => {
    const rows: {
      registro: string;
      nombre: string;
      primerParcial: string | number;
      segundoParcial: string | number;
      examenFinal: string | number;
      notaFinal: string | number;
      hasGrade: boolean;
      fechaActualizacion?: number;
    }[] = [];

    const processedRUs = new Set<string>();

    // 1. Process enrolled students for this subject
    subjectStudents.forEach((student) => {
      const normRU = student.registroUniversitario.trim().toLowerCase();
      processedRUs.add(normRU);
      const gradeObj = gradeByRUMap.get(normRU);

      rows.push({
        registro: student.registroUniversitario,
        nombre: student.nombreCompleto,
        primerParcial: gradeObj ? (gradeObj.primerParcial ?? '-') : '-',
        segundoParcial: gradeObj ? (gradeObj.segundoParcial ?? '-') : '-',
        examenFinal: gradeObj ? (gradeObj.examenFinal ?? '-') : '-',
        notaFinal: gradeObj ? (gradeObj.notaFinal ?? gradeObj.nota ?? '-') : '-',
        hasGrade: !!gradeObj,
        fechaActualizacion: gradeObj?.fechaActualizacion,
      });
    });

    // 2. Include any existing grade for this subject that was registered
    subjectGrades.forEach((grade) => {
      const normRU = grade.registroUniversitario.trim().toLowerCase();
      if (!processedRUs.has(normRU)) {
        processedRUs.add(normRU);
        rows.push({
          registro: grade.registroUniversitario,
          nombre: grade.nombreCompleto,
          primerParcial: grade.primerParcial ?? '-',
          segundoParcial: grade.segundoParcial ?? '-',
          examenFinal: grade.examenFinal ?? '-',
          notaFinal: grade.notaFinal ?? grade.nota ?? '-',
          hasGrade: true,
          fechaActualizacion: grade.fechaActualizacion,
        });
      }
    });

    // Sort alphabetically by student name
    return rows.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [subjectStudents, subjectGrades, gradeByRUMap]);

  // Filtered rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return displayRows;
    const term = searchTerm.toLowerCase().trim();
    return displayRows.filter(
      (r) =>
        r.registro.toLowerCase().includes(term) ||
        r.nombre.toLowerCase().includes(term)
    );
  }, [displayRows, searchTerm]);

  // Handle successful import of grades
  const handleImportComplete = (
    importedGrades: NotaEstudiante[],
    summary: ImportGradesSummary
  ) => {
    setLastImportSummary(summary);

    // Keep all other subjects' grades unchanged
    const otherSubjectsGrades = notas.filter((n) => n.asignaturaId !== selectedSubjectId);

    // Map of current subject grades to replace or add
    const currentSubjectGradesMap = new Map<string, NotaEstudiante>();
    subjectGrades.forEach((g) => {
      currentSubjectGradesMap.set(g.registroUniversitario.trim().toLowerCase(), g);
    });

    // Apply new/updated grades from the import
    importedGrades.forEach((g) => {
      currentSubjectGradesMap.set(g.registroUniversitario.trim().toLowerCase(), g);
    });

    const updatedAllGrades = [
      ...otherSubjectsGrades,
      ...Array.from(currentSubjectGradesMap.values()),
    ];

    onSaveGrades(updatedAllGrades);
  };

  const totalWithGrades = displayRows.filter((r) => r.hasGrade).length;

  return (
    <div id="modulo-importacion-notas" className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Subject Selector Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DCE3EC] shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC]">
                Módulo 6
              </span>
              <h1 className="text-xl font-black text-[#172033] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#174EAF]" />
                Importación Oficial de Calificaciones
              </h1>
            </div>
            <p className="text-xs text-[#667085]">
              Seleccione una asignatura e importe las calificaciones desde un archivo Excel con las 6 columnas oficiales.
            </p>
          </div>

          {/* Action Button: Importar Notas */}
          <div className="flex items-center gap-3">
            <button
              id="btn-abrir-importar-notas"
              type="button"
              disabled={!selectedSubject}
              onClick={() => setIsImportModalOpen(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer ${
                !selectedSubject
                  ? 'bg-slate-100 text-[#667085] cursor-not-allowed border border-[#DCE3EC]'
                  : 'bg-[#174EAF] hover:bg-[#103B88] text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Importar notas</span>
            </button>
          </div>
        </div>

        {/* Subject Selector and Subject Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#DCE3EC]">
          {/* Subject Dropdown */}
          <div className="space-y-1">
            <label
              htmlFor="select-subject-grades"
              className="block text-xs font-bold text-[#172033] uppercase tracking-wider"
            >
              Asignatura
            </label>
            <div className="relative">
              <select
                id="select-subject-grades"
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setLastImportSummary(null);
                  setSearchTerm('');
                }}
                className="w-full appearance-none bg-white hover:bg-[#F5F7FA] border border-[#DCE3EC] text-[#172033] text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-hidden focus:ring-2 focus:ring-[#174EAF] transition-colors cursor-pointer"
              >
                {asignaturas.length === 0 ? (
                  <option value="">No hay asignaturas creadas</option>
                ) : (
                  asignaturas.map((asig) => (
                    <option key={asig.id} value={asig.id}>
                      {asig.sigla} - {asig.nombre} (Grupo {asig.grupo} · Semestre {asig.semestre || 1}/{asig.año || 2026})
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-[#667085] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Subject Quick Details */}
          {selectedSubject ? (
            <div className="md:col-span-2 flex flex-wrap items-center gap-3 bg-[#F5F7FA] rounded-xl p-3 border border-[#DCE3EC] text-xs text-[#667085]">
              <div className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-[#174EAF]" />
                <span className="font-bold text-[#172033]">{selectedSubject.sigla}</span> — Grupo {selectedSubject.grupo}
              </div>
              <span className="text-[#DCE3EC]">|</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#174EAF]" />
                <span className="font-semibold text-[#172033]">Semestre {selectedSubject.semestre || 1} · {selectedSubject.año || 2026}</span>
              </div>
              <span className="text-[#DCE3EC]">|</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#667085]" />
                <span>{selectedSubject.horaInicio} - {selectedSubject.horaFin}</span>
              </div>
              <span className="text-[#DCE3EC]">|</span>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#667085]" />
                <span>{subjectStudents.length} estudiantes inscritos</span>
              </div>
            </div>
          ) : (
            <div className="md:col-span-2 flex items-center text-xs text-[#667085] italic">
              Seleccione una asignatura para ver y gestionar sus notas.
            </div>
          )}
        </div>
      </div>

      {/* Recent Import Banner Alert (if user recently imported) */}
      {lastImportSummary && (
        <div
          id="banner-resumen-importacion"
          className="bg-[#E8F0FC] border border-[#174EAF]/30 rounded-2xl p-4 flex items-start justify-between gap-4 animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#174EAF] mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#174EAF] uppercase tracking-wider">
                Resumen de la Importación
              </h4>
              <p className="text-xs text-[#172033]">
                Se procesó el archivo Excel: <strong>{lastImportSummary.importadosCorrectamente}</strong> estudiantes procesados correctamente,{' '}
                <strong>{lastImportSummary.actualizados}</strong> notas actualizadas, y{' '}
                <strong>{lastImportSummary.noEncontradosCount}</strong> Registros Universitarios no encontrados en esta asignatura.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLastImportSummary(null)}
            className="text-xs text-[#174EAF] hover:text-[#103B88] font-bold px-2 py-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Grades Table Section */}
      <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#172033]">
              Tabla de Calificaciones de la Asignatura
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC]">
              {totalWithGrades} de {displayRows.length} calificados
            </span>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-grades-table"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por RU o nombre..."
              className="w-full bg-white border border-[#DCE3EC] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#172033] focus:outline-hidden focus:ring-2 focus:ring-[#174EAF] transition-colors"
            />
          </div>
        </div>

        {/* Table with the 6 exact columns */}
        {displayRows.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#DCE3EC] rounded-2xl p-6">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] mx-auto flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#172033]">
              No hay notas registradas para esta asignatura
            </h4>
            <p className="text-xs text-[#667085] max-w-md mx-auto mt-1 mb-4">
              Importe el archivo Excel con las 6 columnas: Registro Universitario, Nombre, Primer Parcial, Segundo Parcial, Examen Final y Nota Final.
            </p>
            {selectedSubject && (
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#174EAF] hover:bg-[#103B88] shadow-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar notas ahora</span>
              </button>
            )}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#667085]">
            No se encontraron estudiantes que coincidan con la búsqueda "{searchTerm}".
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#DCE3EC]">
            <table id="tabla-notas-asignatura" className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#E8F0FC] border-b border-[#DCE3EC] text-[#172033] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-10 text-center text-[#667085]">#</th>
                  <th className="py-3 px-4 w-40">Registro Universitario</th>
                  <th className="py-3 px-4 min-w-[200px]">Nombre</th>
                  <th className="py-3 px-3 w-28 text-center">Primer Parcial</th>
                  <th className="py-3 px-3 w-28 text-center">Segundo Parcial</th>
                  <th className="py-3 px-3 w-28 text-center">Examen Final</th>
                  <th className="py-3 px-3 w-28 text-center text-[#174EAF]">Nota Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EC] bg-white">
                {filteredRows.map((row, idx) => (
                  <tr
                    key={row.registro}
                    id={`fila-nota-estudiante-${row.registro}`}
                    className="hover:bg-[#E8F0FC]/30 transition-colors"
                  >
                    <td className="py-3 px-3 text-center font-mono text-[#667085] text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#174EAF]">
                      {row.registro}
                    </td>
                    <td className="py-3 px-4 text-[#172033] font-medium">
                      {row.nombre}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {row.hasGrade && row.primerParcial !== '-' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded bg-[#F5F7FA] text-[#172033] font-semibold border border-[#DCE3EC]">
                          {row.primerParcial}
                        </span>
                      ) : (
                        <span className="text-[#667085]/60 italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {row.hasGrade && row.segundoParcial !== '-' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded bg-[#F5F7FA] text-[#172033] font-semibold border border-[#DCE3EC]">
                          {row.segundoParcial}
                        </span>
                      ) : (
                        <span className="text-[#667085]/60 italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {row.hasGrade && row.examenFinal !== '-' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded bg-[#F5F7FA] text-[#172033] font-semibold border border-[#DCE3EC]">
                          {row.examenFinal}
                        </span>
                      ) : (
                        <span className="text-[#667085]/60 italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.hasGrade && row.notaFinal !== '-' ? (
                        <span
                          id={`valor-nota-final-${row.registro}`}
                          className="inline-flex items-center justify-center font-mono font-bold text-xs px-3 py-1 rounded-lg bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC] shadow-2xs min-w-[48px]"
                        >
                          {row.notaFinal}
                        </span>
                      ) : (
                        <span className="text-[#667085]/60 italic text-[11px]">
                          Sin nota
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {selectedSubject && (
        <ImportGradesModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          asignatura={selectedSubject}
          subjectStudents={subjectStudents}
          existingGrades={subjectGrades}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
};
