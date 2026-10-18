import React, { useState, useMemo } from 'react';
import { Asignatura, Estudiante, NotaEstudiante, ImportGradesSummary } from '../types';
import { ImportGradesModal } from './ImportGradesModal';
import { ManualGradeModal } from './ManualGradeModal';
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
  Edit3,
  Plus,
  Save,
  X,
  Calculator,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface SubjectGradesViewProps {
  asignaturas: Asignatura[];
  estudiantes: Estudiante[];
  notas: NotaEstudiante[];
  onSaveGrades: (updatedGrades: NotaEstudiante[]) => void;
  initialSelectedSubjectId?: string | null;
}

interface TableRowData {
  registro: string;
  nombre: string;
  primerParcial: string | number;
  segundoParcial: string | number;
  examenFinal: string | number;
  notaFinal: string | number;
  hasGrade: boolean;
  fechaActualizacion?: number;
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

  // Manual Editing States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<TableRowData | null>(null);

  // Single row inline edit state
  const [editingRowRU, setEditingRowRU] = useState<string | null>(null);
  const [rowDraft, setRowDraft] = useState<{
    primerParcial: string;
    segundoParcial: string;
    examenFinal: string;
    notaFinal: string;
  }>({
    primerParcial: '',
    segundoParcial: '',
    examenFinal: '',
    notaFinal: '',
  });

  // Table-wide quick edit mode
  const [isTableEditMode, setIsTableEditMode] = useState(false);
  const [tableDrafts, setTableDrafts] = useState<
    Record<
      string,
      {
        primerParcial: string;
        segundoParcial: string;
        examenFinal: string;
        notaFinal: string;
        nombre: string;
      }
    >
  >({});

  // Local feedback message
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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
  const displayRows: TableRowData[] = useMemo(() => {
    const rows: TableRowData[] = [];
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

  // Helper to show temporary feedback
  const triggerFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // ==========================================
  // MANUAL MODIFICATION HANDLERS
  // ==========================================

  // Save or update a single student's grade manually
  const handleSaveManualGrade = (gradeData: {
    registro: string;
    nombre: string;
    primerParcial: string | number;
    segundoParcial: string | number;
    examenFinal: string | number;
    notaFinal: string | number;
  }) => {
    if (!selectedSubjectId) return;

    const normRU = gradeData.registro.trim().toLowerCase();
    const existingGrade = subjectGrades.find(
      (g) => g.registroUniversitario.trim().toLowerCase() === normRU
    );

    const cleanGrade = (val: string | number): number | string => {
      if (val === '' || val === '-' || val === undefined || val === null) return '-';
      const num = Number(val);
      return isNaN(num) ? String(val).trim() : num;
    };

    const p1 = cleanGrade(gradeData.primerParcial);
    const p2 = cleanGrade(gradeData.segundoParcial);
    const ef = cleanGrade(gradeData.examenFinal);
    const nf = cleanGrade(gradeData.notaFinal);

    const newOrUpdatedGrade: NotaEstudiante = {
      id: existingGrade?.id || `nota-${Date.now()}-${selectedSubjectId}-${normRU}`,
      asignaturaId: selectedSubjectId,
      registroUniversitario: gradeData.registro.trim(),
      nombreCompleto: gradeData.nombre.trim(),
      primerParcial: p1,
      segundoParcial: p2,
      examenFinal: ef,
      notaFinal: nf,
      nota: nf,
      fechaActualizacion: Date.now(),
    };

    // Keep all other subjects' grades unchanged
    const otherSubjectsGrades = notas.filter((n) => n.asignaturaId !== selectedSubjectId);

    // Map of current subject grades to replace or add
    const currentSubjectGradesMap = new Map<string, NotaEstudiante>();
    subjectGrades.forEach((g) => {
      currentSubjectGradesMap.set(g.registroUniversitario.trim().toLowerCase(), g);
    });
    currentSubjectGradesMap.set(normRU, newOrUpdatedGrade);

    const updatedAllGrades = [
      ...otherSubjectsGrades,
      ...Array.from(currentSubjectGradesMap.values()),
    ];

    onSaveGrades(updatedAllGrades);
    triggerFeedback(`Calificación de ${gradeData.nombre} (${gradeData.registro}) guardada manualmente.`);
  };

  // Delete or reset single student's grade
  const handleDeleteSingleGrade = (registro: string) => {
    if (!selectedSubjectId) return;
    const normRU = registro.trim().toLowerCase();

    const otherSubjectsGrades = notas.filter((n) => n.asignaturaId !== selectedSubjectId);
    const remainingSubjectGrades = subjectGrades.filter(
      (g) => g.registroUniversitario.trim().toLowerCase() !== normRU
    );

    onSaveGrades([...otherSubjectsGrades, ...remainingSubjectGrades]);
    triggerFeedback(`Calificación eliminada para RU: ${registro}`);
  };

  // Start inline row editing
  const handleStartRowEdit = (row: TableRowData) => {
    setEditingRowRU(row.registro);
    setRowDraft({
      primerParcial: row.hasGrade && row.primerParcial !== '-' ? String(row.primerParcial) : '',
      segundoParcial: row.hasGrade && row.segundoParcial !== '-' ? String(row.segundoParcial) : '',
      examenFinal: row.hasGrade && row.examenFinal !== '-' ? String(row.examenFinal) : '',
      notaFinal: row.hasGrade && row.notaFinal !== '-' ? String(row.notaFinal) : '',
    });
  };

  // Cancel inline row editing
  const handleCancelRowEdit = () => {
    setEditingRowRU(null);
  };

  // Auto-calculate row average
  const handleAutoCalcRowAverage = () => {
    const p1 = rowDraft.primerParcial !== '' ? Number(rowDraft.primerParcial) : NaN;
    const p2 = rowDraft.segundoParcial !== '' ? Number(rowDraft.segundoParcial) : NaN;
    const ef = rowDraft.examenFinal !== '' ? Number(rowDraft.examenFinal) : NaN;

    const scores: number[] = [];
    if (!isNaN(p1) && p1 >= 0 && p1 <= 100) scores.push(p1);
    if (!isNaN(p2) && p2 >= 0 && p2 <= 100) scores.push(p2);
    if (!isNaN(ef) && ef >= 0 && ef <= 100) scores.push(ef);

    if (scores.length > 0) {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      setRowDraft((prev) => ({ ...prev, notaFinal: String(avg) }));
    }
  };

  // Save inline row edit
  const handleSaveRowEdit = (row: TableRowData) => {
    handleSaveManualGrade({
      registro: row.registro,
      nombre: row.nombre,
      primerParcial: rowDraft.primerParcial !== '' ? Number(rowDraft.primerParcial) : '-',
      segundoParcial: rowDraft.segundoParcial !== '' ? Number(rowDraft.segundoParcial) : '-',
      examenFinal: rowDraft.examenFinal !== '' ? Number(rowDraft.examenFinal) : '-',
      notaFinal: rowDraft.notaFinal !== '' ? Number(rowDraft.notaFinal) : '-',
    });
    setEditingRowRU(null);
  };

  // ==========================================
  // TABLE-WIDE QUICK EDIT MODE
  // ==========================================
  const handleToggleTableEditMode = () => {
    if (!isTableEditMode) {
      // Enter mode: populate drafts
      const drafts: Record<
        string,
        {
          primerParcial: string;
          segundoParcial: string;
          examenFinal: string;
          notaFinal: string;
          nombre: string;
        }
      > = {};

      displayRows.forEach((r) => {
        drafts[r.registro] = {
          nombre: r.nombre,
          primerParcial: r.hasGrade && r.primerParcial !== '-' ? String(r.primerParcial) : '',
          segundoParcial: r.hasGrade && r.segundoParcial !== '-' ? String(r.segundoParcial) : '',
          examenFinal: r.hasGrade && r.examenFinal !== '-' ? String(r.examenFinal) : '',
          notaFinal: r.hasGrade && r.notaFinal !== '-' ? String(r.notaFinal) : '',
        };
      });

      setTableDrafts(drafts);
      setIsTableEditMode(true);
      setEditingRowRU(null);
    } else {
      // Exit mode without saving
      setIsTableEditMode(false);
      setTableDrafts({});
    }
  };

  const handleTableDraftFieldChange = (
    ru: string,
    field: 'primerParcial' | 'segundoParcial' | 'examenFinal' | 'notaFinal',
    value: string
  ) => {
    setTableDrafts((prev) => ({
      ...prev,
      [ru]: {
        ...prev[ru],
        [field]: value,
      },
    }));
  };

  // Auto-calculate Nota Final for all students in tableDrafts if partials exist
  const handleCalculateAllTableAverages = () => {
    setTableDrafts((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((ru) => {
        const item = updated[ru];
        const p1 = item.primerParcial !== '' ? Number(item.primerParcial) : NaN;
        const p2 = item.segundoParcial !== '' ? Number(item.segundoParcial) : NaN;
        const ef = item.examenFinal !== '' ? Number(item.examenFinal) : NaN;

        const scores: number[] = [];
        if (!isNaN(p1) && p1 >= 0 && p1 <= 100) scores.push(p1);
        if (!isNaN(p2) && p2 >= 0 && p2 <= 100) scores.push(p2);
        if (!isNaN(ef) && ef >= 0 && ef <= 100) scores.push(ef);

        if (scores.length > 0) {
          item.notaFinal = String(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
        }
      });
      return updated;
    });
    triggerFeedback('Promedios de notas finales calculados en la tabla.');
  };

  // Save all modified tableDrafts
  const handleSaveAllTableDrafts = () => {
    if (!selectedSubjectId) return;

    const cleanGrade = (val: string | number): number | string => {
      if (val === '' || val === '-' || val === undefined || val === null) return '-';
      const num = Number(val);
      return isNaN(num) ? String(val).trim() : num;
    };

    const otherSubjectsGrades = notas.filter((n) => n.asignaturaId !== selectedSubjectId);
    const currentSubjectGradesMap = new Map<string, NotaEstudiante>();
    subjectGrades.forEach((g) => {
      currentSubjectGradesMap.set(g.registroUniversitario.trim().toLowerCase(), g);
    });

    let savedCount = 0;
    Object.keys(tableDrafts).forEach((ru) => {
      const draft = tableDrafts[ru];
      if (!draft) return;
      const normRU = ru.trim().toLowerCase();
      const existing = currentSubjectGradesMap.get(normRU);

      const p1 = cleanGrade(draft.primerParcial);
      const p2 = cleanGrade(draft.segundoParcial);
      const ef = cleanGrade(draft.examenFinal);
      const nf = cleanGrade(draft.notaFinal);

      // Only store if at least one value is set
      const hasAnyScore = p1 !== '-' || p2 !== '-' || ef !== '-' || nf !== '-';
      if (hasAnyScore || existing) {
        const updatedObj: NotaEstudiante = {
          id: existing?.id || `nota-${Date.now()}-${selectedSubjectId}-${normRU}`,
          asignaturaId: selectedSubjectId,
          registroUniversitario: ru.trim(),
          nombreCompleto: draft.nombre || existing?.nombreCompleto || 'Estudiante',
          primerParcial: p1,
          segundoParcial: p2,
          examenFinal: ef,
          notaFinal: nf,
          nota: nf,
          fechaActualizacion: Date.now(),
        };
        currentSubjectGradesMap.set(normRU, updatedObj);
        savedCount++;
      }
    });

    const updatedAllGrades = [
      ...otherSubjectsGrades,
      ...Array.from(currentSubjectGradesMap.values()),
    ];

    onSaveGrades(updatedAllGrades);
    setIsTableEditMode(false);
    setTableDrafts({});
    triggerFeedback(`Se guardaron exitosamente las modificaciones manuales de ${savedCount} estudiantes.`);
  };

  // Handle successful import of grades from Excel
  const handleImportComplete = (
    importedGrades: NotaEstudiante[],
    summary: ImportGradesSummary
  ) => {
    setLastImportSummary(summary);

    const otherSubjectsGrades = notas.filter((n) => n.asignaturaId !== selectedSubjectId);
    const currentSubjectGradesMap = new Map<string, NotaEstudiante>();
    subjectGrades.forEach((g) => {
      currentSubjectGradesMap.set(g.registroUniversitario.trim().toLowerCase(), g);
    });

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
                Calificaciones y Registro de Notas
              </h1>
            </div>
            <p className="text-xs text-[#667085]">
              Modifique las notas manualmente de forma individual o en tabla, o impórtelas desde un archivo Excel oficial.
            </p>
          </div>

          {/* Action Buttons: Modificación Manual & Importación */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Button: + Calificación Manual */}
            <button
              id="btn-agregar-nota-manual"
              type="button"
              disabled={!selectedSubject}
              onClick={() => {
                setStudentToEdit(null);
                setIsManualModalOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer ${
                !selectedSubject
                  ? 'bg-slate-100 text-[#667085] cursor-not-allowed border border-[#DCE3EC]'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title="Asignar o registrar manualmente las notas de un estudiante"
            >
              <Plus className="w-4 h-4" />
              <span>+ Calificación manual</span>
            </button>

            {/* Button: Modo Edición Rápida en Tabla */}
            <button
              id="btn-toggle-edicion-tabla"
              type="button"
              disabled={!selectedSubject || displayRows.length === 0}
              onClick={handleToggleTableEditMode}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                isTableEditMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-white hover:bg-[#F5F7FA] text-[#174EAF] border-[#DCE3EC]'
              }`}
              title="Activar edición directa en las casillas de la tabla"
            >
              <Edit3 className="w-4 h-4 text-[#174EAF]" />
              <span>{isTableEditMode ? 'Salir de edición en tabla' : 'Edición rápida en tabla'}</span>
            </button>

            {/* Button: Importar Notas Excel */}
            <button
              id="btn-abrir-importar-notas"
              type="button"
              disabled={!selectedSubject}
              onClick={() => setIsImportModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer ${
                !selectedSubject
                  ? 'bg-slate-100 text-[#667085] cursor-not-allowed border border-[#DCE3EC]'
                  : 'bg-[#174EAF] hover:bg-[#103B88] text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Importar Excel</span>
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
                  setEditingRowRU(null);
                  setIsTableEditMode(false);
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
                <span className="font-semibold text-[#172033]">
                  Semestre {selectedSubject.semestre || 1} · {selectedSubject.año || 2026}
                </span>
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

      {/* Local Feedback / Toast Notification */}
      {feedbackMessage && (
        <div
          id="banner-feedback-notas"
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center justify-between gap-3 animate-in fade-in"
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Recent Import Banner Alert */}
      {lastImportSummary && (
        <div
          id="banner-resumen-importacion"
          className="bg-[#E8F0FC] border border-[#174EAF]/30 rounded-2xl p-4 flex items-start justify-between gap-4 animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#174EAF] mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#174EAF] uppercase tracking-wider">
                Resumen de la Importación Excel
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

      {/* Table-wide Edit Mode Banner */}
      {isTableEditMode && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Modo Edición Rápida en Tabla Activo
              </h4>
              <p className="text-xs text-amber-800">
                Escriba o ajuste las notas directamente en cada casilla. Al finalizar, haga clic en <strong>Guardar todos los cambios</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCalculateAllTableAverages}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition-colors cursor-pointer"
              title="Calcular la Nota Final como promedio de los parciales en toda la tabla"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-700" />
              <span>Calcular promedios</span>
            </button>

            <button
              type="button"
              onClick={handleToggleTableEditMode}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              id="btn-guardar-cambios-tabla"
              type="button"
              onClick={handleSaveAllTableDrafts}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar todos los cambios</span>
            </button>
          </div>
        </div>
      )}

      {/* Grades Table Section */}
      <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#172033]">
              Tabla Oficial de Calificaciones
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

        {/* Table */}
        {displayRows.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#DCE3EC] rounded-2xl p-6">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] mx-auto flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#172033]">
              No hay calificaciones registradas para esta asignatura
            </h4>
            <p className="text-xs text-[#667085] max-w-md mx-auto mt-1 mb-4">
              Puede registrar calificaciones manualmente estudiante por estudiante, o importar el archivo Excel con las 6 columnas oficiales.
            </p>
            {selectedSubject && (
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStudentToEdit(null);
                    setIsManualModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Calificación Manual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#174EAF] hover:bg-[#103B88] shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar Excel</span>
                </button>
              </div>
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
                  <th className="py-3 px-4 w-36">Registro Universitario</th>
                  <th className="py-3 px-4 min-w-[180px]">Nombre</th>
                  <th className="py-3 px-3 w-24 text-center">Primer Parcial</th>
                  <th className="py-3 px-3 w-24 text-center">Segundo Parcial</th>
                  <th className="py-3 px-3 w-24 text-center">Examen Final</th>
                  <th className="py-3 px-3 w-24 text-center text-[#174EAF]">Nota Final</th>
                  <th className="py-3 px-3 w-28 text-center text-[#172033]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EC] bg-white">
                {filteredRows.map((row, idx) => {
                  const isRowInlineEditing = editingRowRU === row.registro;
                  const tableDraft = tableDrafts[row.registro];

                  return (
                    <tr
                      key={row.registro}
                      id={`fila-nota-estudiante-${row.registro}`}
                      className={`transition-colors ${
                        isRowInlineEditing || isTableEditMode
                          ? 'bg-amber-50/50'
                          : 'hover:bg-[#E8F0FC]/30'
                      }`}
                    >
                      {/* # Index */}
                      <td className="py-3 px-3 text-center font-mono text-[#667085] text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Registro Universitario */}
                      <td className="py-3 px-4 font-mono font-bold text-[#174EAF]">
                        {row.registro}
                      </td>

                      {/* Nombre */}
                      <td className="py-3 px-4 text-[#172033] font-medium">
                        {row.nombre}
                      </td>

                      {/* Primer Parcial */}
                      <td className="py-2 px-2 text-center font-mono">
                        {isTableEditMode && tableDraft ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={tableDraft.primerParcial}
                            onChange={(e) =>
                              handleTableDraftFieldChange(row.registro, 'primerParcial', e.target.value)
                            }
                            placeholder="-"
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white border border-[#DCE3EC] rounded-lg focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                          />
                        ) : isRowInlineEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={rowDraft.primerParcial}
                            onChange={(e) =>
                              setRowDraft((prev) => ({ ...prev, primerParcial: e.target.value }))
                            }
                            placeholder="-"
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white border border-[#174EAF] rounded-lg focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                          />
                        ) : row.hasGrade && row.primerParcial !== '-' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded bg-[#F5F7FA] text-[#172033] font-semibold border border-[#DCE3EC]">
                            {row.primerParcial}
                          </span>
                        ) : (
                          <span className="text-[#667085]/60 italic">-</span>
                        )}
                      </td>

                      {/* Segundo Parcial */}
                      <td className="py-2 px-2 text-center font-mono">
                        {isTableEditMode && tableDraft ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={tableDraft.segundoParcial}
                            onChange={(e) =>
                              handleTableDraftFieldChange(row.registro, 'segundoParcial', e.target.value)
                            }
                            placeholder="-"
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white border border-[#DCE3EC] rounded-lg focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                          />
                        ) : isRowInlineEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={rowDraft.segundoParcial}
                            onChange={(e) =>
                              setRowDraft((prev) => ({ ...prev, segundoParcial: e.target.value }))
                            }
                            placeholder="-"
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white border border-[#174EAF] rounded-lg focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                          />
                        ) : row.hasGrade && row.segundoParcial !== '-' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded bg-[#F5F7FA] text-[#172033] font-semibold border border-[#DCE3EC]">
                            {row.segundoParcial}
                          </span>
                        ) : (
                          <span className="text-[#667085]/60 italic">-</span>
                        )}
                      </td>

                      {/* Examen Final */}
                      <td className="py-2 px-2 text-center font-mono">
                        {isTableEditMode && tableDraft ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={tableDraft.examenFinal}
                            onChange={(e) =>
                              handleTableDraftFieldChange(row.registro, 'examenFinal', e.target.value)
                            }
                            placeholder="-"
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white border border-[#DCE3EC] rounded-lg focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                          />
                        ) : isRowInlineEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={rowDraft.examenFinal}
                            onChange={(e) =>
                              setRowDraft((prev) => ({ ...prev, examenFinal: e.target.value }))
                            }
                            placeholder="-"
                            className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white border border-[#174EAF] rounded-lg focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                          />
                        ) : row.hasGrade && row.examenFinal !== '-' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded bg-[#F5F7FA] text-[#172033] font-semibold border border-[#DCE3EC]">
                            {row.examenFinal}
                          </span>
                        ) : (
                          <span className="text-[#667085]/60 italic">-</span>
                        )}
                      </td>

                      {/* Nota Final */}
                      <td className="py-2 px-2 text-center">
                        {isTableEditMode && tableDraft ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={tableDraft.notaFinal}
                            onChange={(e) =>
                              handleTableDraftFieldChange(row.registro, 'notaFinal', e.target.value)
                            }
                            placeholder="-"
                            className="w-16 px-1.5 py-1 text-center font-mono font-black text-xs bg-[#E8F0FC] border-2 border-[#174EAF] text-[#174EAF] rounded-lg focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                          />
                        ) : isRowInlineEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={rowDraft.notaFinal}
                              onChange={(e) =>
                                setRowDraft((prev) => ({ ...prev, notaFinal: e.target.value }))
                              }
                              placeholder="-"
                              className="w-16 px-1.5 py-1 text-center font-mono font-black text-xs bg-[#E8F0FC] border-2 border-[#174EAF] text-[#174EAF] rounded-lg focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={handleAutoCalcRowAverage}
                              className="p-1 text-[#174EAF] hover:bg-[#E8F0FC] rounded transition-colors"
                              title="Calcular promedio automático"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : row.hasGrade && row.notaFinal !== '-' ? (
                          <span
                            id={`valor-nota-final-${row.registro}`}
                            className={`inline-flex items-center justify-center font-mono font-bold text-xs px-3 py-1 rounded-lg border shadow-2xs min-w-[48px] ${
                              Number(row.notaFinal) >= 51
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-red-50 text-red-800 border-red-200'
                            }`}
                          >
                            {row.notaFinal}
                          </span>
                        ) : (
                          <span className="text-[#667085]/60 italic text-[11px]">
                            Sin nota
                          </span>
                        )}
                      </td>

                      {/* Acciones de Modificación Manual */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {isRowInlineEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveRowEdit(row)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
                              title="Guardar notas de esta fila"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Guardar</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelRowEdit}
                              className="p-1 text-[#667085] hover:text-[#172033] hover:bg-[#F5F7FA] rounded-lg transition-colors cursor-pointer"
                              title="Cancelar edición"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : isTableEditMode ? (
                          <span className="text-[11px] text-amber-700 font-semibold italic">
                            Editando en tabla
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {/* Botón Modificar en Modal */}
                            <button
                              id={`btn-modificar-nota-${row.registro}`}
                              type="button"
                              onClick={() => {
                                setStudentToEdit(row);
                                setIsManualModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#E8F0FC] hover:bg-blue-100 text-[#174EAF] font-bold rounded-lg border border-[#DCE3EC] transition-colors cursor-pointer"
                              title="Modificar calificaciones manualmente en ventana"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Modificar</span>
                            </button>

                            {/* Botón Edición Rápida Fila */}
                            <button
                              type="button"
                              onClick={() => handleStartRowEdit(row)}
                              className="p-1 text-[#667085] hover:text-[#174EAF] hover:bg-[#F5F7FA] rounded-lg transition-colors cursor-pointer"
                              title="Editar directamente en esta fila"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Grade Modal (Individual Student Edit or Add) */}
      {selectedSubject && (
        <ManualGradeModal
          isOpen={isManualModalOpen}
          onClose={() => {
            setIsManualModalOpen(false);
            setStudentToEdit(null);
          }}
          asignatura={selectedSubject}
          student={studentToEdit}
          enrolledStudents={subjectStudents}
          onSave={handleSaveManualGrade}
          onDeleteGrade={handleDeleteSingleGrade}
        />
      )}

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
