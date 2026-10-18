import React, { useState, useEffect, useMemo } from 'react';
import { Asignatura, Estudiante } from '../types';
import {
  X,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Calculator,
  User,
  GraduationCap,
  Save,
  Trash2,
} from 'lucide-react';

interface EditableStudentGrade {
  registro: string;
  nombre: string;
  primerParcial?: string | number;
  segundoParcial?: string | number;
  examenFinal?: string | number;
  notaFinal?: string | number;
  hasGrade?: boolean;
}

interface ManualGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  asignatura: Asignatura;
  student: EditableStudentGrade | null;
  enrolledStudents: Estudiante[];
  onSave: (gradeData: {
    registro: string;
    nombre: string;
    primerParcial: string | number;
    segundoParcial: string | number;
    examenFinal: string | number;
    notaFinal: string | number;
  }) => void;
  onDeleteGrade?: (registro: string) => void;
}

export const ManualGradeModal: React.FC<ManualGradeModalProps> = ({
  isOpen,
  onClose,
  asignatura,
  student,
  enrolledStudents,
  onSave,
  onDeleteGrade,
}) => {
  const isNewStudentGrade = !student;

  const [selectedRU, setSelectedRU] = useState('');
  const [nombre, setNombre] = useState('');
  const [primerParcial, setPrimerParcial] = useState('');
  const [segundoParcial, setSegundoParcial] = useState('');
  const [examenFinal, setExamenFinal] = useState('');
  const [notaFinal, setNotaFinal] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize form when modal opens or student changes
  useEffect(() => {
    if (isOpen) {
      if (student) {
        setSelectedRU(student.registro);
        setNombre(student.nombre);
        setPrimerParcial(
          student.primerParcial !== undefined && student.primerParcial !== '-'
            ? String(student.primerParcial)
            : ''
        );
        setSegundoParcial(
          student.segundoParcial !== undefined && student.segundoParcial !== '-'
            ? String(student.segundoParcial)
            : ''
        );
        setExamenFinal(
          student.examenFinal !== undefined && student.examenFinal !== '-'
            ? String(student.examenFinal)
            : ''
        );
        setNotaFinal(
          student.notaFinal !== undefined && student.notaFinal !== '-'
            ? String(student.notaFinal)
            : ''
        );
      } else {
        // New manual grade entry
        setSelectedRU('');
        setNombre('');
        setPrimerParcial('');
        setSegundoParcial('');
        setExamenFinal('');
        setNotaFinal('');
      }
      setError(null);
    }
  }, [isOpen, student]);

  // When selecting an enrolled student from the dropdown for a new grade
  const handleStudentSelect = (ru: string) => {
    setSelectedRU(ru);
    const found = enrolledStudents.find(
      (e) => e.registroUniversitario.trim().toLowerCase() === ru.trim().toLowerCase()
    );
    if (found) {
      setNombre(found.nombreCompleto);
    }
  };

  // Auto-calculate Nota Final as the arithmetic average of available valid partials/final
  const handleCalculateAverage = () => {
    const p1 = primerParcial !== '' ? Number(primerParcial) : NaN;
    const p2 = segundoParcial !== '' ? Number(segundoParcial) : NaN;
    const ef = examenFinal !== '' ? Number(examenFinal) : NaN;

    const validScores: number[] = [];
    if (!isNaN(p1) && p1 >= 0 && p1 <= 100) validScores.push(p1);
    if (!isNaN(p2) && p2 >= 0 && p2 <= 100) validScores.push(p2);
    if (!isNaN(ef) && ef >= 0 && ef <= 100) validScores.push(ef);

    if (validScores.length === 0) {
      setError('Ingrese al menos una nota válida (0-100) para calcular el promedio.');
      return;
    }

    const sum = validScores.reduce((acc, curr) => acc + curr, 0);
    const avg = Math.round(sum / validScores.length);
    setNotaFinal(String(avg));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanRU = selectedRU.trim();
    const cleanNombre = nombre.trim();

    if (!cleanRU) {
      setError('El Registro Universitario es obligatorio.');
      return;
    }
    if (!cleanNombre) {
      setError('El nombre del estudiante es obligatorio.');
      return;
    }

    // Validate grades if provided
    const validateGradeValue = (val: string, label: string): boolean => {
      if (!val || val === '-') return true;
      const num = Number(val);
      if (isNaN(num) || num < 0 || num > 100) {
        setError(`${label} debe ser un número válido entre 0 y 100.`);
        return false;
      }
      return true;
    };

    if (!validateGradeValue(primerParcial, 'El Primer Parcial')) return;
    if (!validateGradeValue(segundoParcial, 'El Segundo Parcial')) return;
    if (!validateGradeValue(examenFinal, 'El Examen Final')) return;
    if (!validateGradeValue(notaFinal, 'La Nota Final')) return;

    onSave({
      registro: cleanRU,
      nombre: cleanNombre,
      primerParcial: primerParcial !== '' ? Number(primerParcial) : '-',
      segundoParcial: segundoParcial !== '' ? Number(segundoParcial) : '-',
      examenFinal: examenFinal !== '' ? Number(examenFinal) : '-',
      notaFinal: notaFinal !== '' ? Number(notaFinal) : '-',
    });

    onClose();
  };

  const handleDelete = () => {
    if (!student || !onDeleteGrade) return;
    if (
      window.confirm(
        `¿Está seguro de eliminar las calificaciones registradas de ${student.nombre} (${student.registro})?`
      )
    ) {
      onDeleteGrade(student.registro);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Grade badge status
  const numericFinalGrade = notaFinal !== '' ? Number(notaFinal) : NaN;
  const isApproved = !isNaN(numericFinalGrade) && numericFinalGrade >= 51;
  const isFailed = !isNaN(numericFinalGrade) && numericFinalGrade < 51;

  return (
    <div
      id="modal-modificar-nota-manual"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#E8F0FC]/60 border-b border-[#DCE3EC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#174EAF] text-white flex items-center justify-center shadow-2xs">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033]">
                {isNewStudentGrade ? 'Asignar Calificación Manual' : 'Modificar Calificaciones'}
              </h3>
              <p className="text-xs text-[#667085]">
                {asignatura.sigla} · Grupo {asignatura.grupo} — {asignatura.nombre}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Identification */}
          <div className="space-y-3 bg-[#F5F7FA] p-3.5 rounded-xl border border-[#DCE3EC]">
            {isNewStudentGrade ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Seleccionar Estudiante Inscrito
                  </label>
                  <select
                    id="select-estudiante-nota-manual"
                    value={selectedRU}
                    onChange={(e) => handleStudentSelect(e.target.value)}
                    className="w-full bg-white border border-[#DCE3EC] rounded-xl px-3 py-2 text-xs text-[#172033] font-medium focus:ring-2 focus:ring-[#174EAF] outline-hidden cursor-pointer"
                  >
                    <option value="">-- Seleccionar de la lista de inscritos --</option>
                    {enrolledStudents.map((est) => (
                      <option key={est.id} value={est.registroUniversitario}>
                        {est.registroUniversitario} — {est.nombreCompleto}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#172033] mb-1">
                      Registro Universitario (RU) *
                    </label>
                    <input
                      id="input-ru-nota-manual"
                      type="text"
                      value={selectedRU}
                      onChange={(e) => setSelectedRU(e.target.value)}
                      placeholder="Ej. 220054321"
                      className="w-full bg-white border border-[#DCE3EC] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#174EAF] focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#172033] mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      id="input-nombre-nota-manual"
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Nombre y Apellidos"
                      className="w-full bg-white border border-[#DCE3EC] rounded-xl px-3 py-2 text-xs text-[#172033] font-medium focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-[#174EAF]">
                    RU: {selectedRU}
                  </div>
                  <div className="text-sm font-bold text-[#172033]">{nombre}</div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#667085]">
                  <GraduationCap className="w-4 h-4 text-[#174EAF]" />
                  <span>Estudiante Oficial</span>
                </div>
              </div>
            )}
          </div>

          {/* Grades Inputs Grid (4 columns/fields) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                Calificaciones de las Evaluaciones (0 - 100)
              </span>
              <button
                type="button"
                onClick={handleCalculateAverage}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#174EAF] hover:text-[#103B88] hover:bg-[#E8F0FC] px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="Calcular Nota Final como promedio de los parciales y examen final"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calcular Nota Final Automática</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Primer Parcial */}
              <div className="space-y-1">
                <label
                  htmlFor="input-primer-parcial"
                  className="block text-[11px] font-semibold text-[#172033]"
                >
                  Primer Parcial
                </label>
                <input
                  id="input-primer-parcial"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={primerParcial}
                  onChange={(e) => setPrimerParcial(e.target.value)}
                  placeholder="0 - 100"
                  className="w-full bg-white border border-[#DCE3EC] rounded-xl px-3 py-2 text-center text-xs font-mono font-bold text-[#172033] focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                />
              </div>

              {/* Segundo Parcial */}
              <div className="space-y-1">
                <label
                  htmlFor="input-segundo-parcial"
                  className="block text-[11px] font-semibold text-[#172033]"
                >
                  Segundo Parcial
                </label>
                <input
                  id="input-segundo-parcial"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={segundoParcial}
                  onChange={(e) => setSegundoParcial(e.target.value)}
                  placeholder="0 - 100"
                  className="w-full bg-white border border-[#DCE3EC] rounded-xl px-3 py-2 text-center text-xs font-mono font-bold text-[#172033] focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                />
              </div>

              {/* Examen Final */}
              <div className="space-y-1">
                <label
                  htmlFor="input-examen-final"
                  className="block text-[11px] font-semibold text-[#172033]"
                >
                  Examen Final
                </label>
                <input
                  id="input-examen-final"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={examenFinal}
                  onChange={(e) => setExamenFinal(e.target.value)}
                  placeholder="0 - 100"
                  className="w-full bg-white border border-[#DCE3EC] rounded-xl px-3 py-2 text-center text-xs font-mono font-bold text-[#172033] focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                />
              </div>

              {/* Nota Final */}
              <div className="space-y-1">
                <label
                  htmlFor="input-nota-final"
                  className="block text-[11px] font-bold text-[#174EAF]"
                >
                  Nota Final
                </label>
                <input
                  id="input-nota-final"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={notaFinal}
                  onChange={(e) => setNotaFinal(e.target.value)}
                  placeholder="0 - 100"
                  className="w-full bg-[#E8F0FC]/70 border-2 border-[#174EAF] rounded-xl px-3 py-2 text-center text-xs font-mono font-black text-[#174EAF] focus:ring-2 focus:ring-[#174EAF] outline-hidden"
                />
              </div>
            </div>

            {/* Status Preview Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F7FA] border border-[#DCE3EC] text-xs">
              <span className="text-[#667085] font-medium">Estado del Estudiante:</span>
              <div>
                {isApproved && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprobado ({numericFinalGrade})</span>
                  </span>
                )}
                {isFailed && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-800 font-bold border border-red-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Reprobado ({numericFinalGrade})</span>
                  </span>
                )}
                {!isApproved && !isFailed && (
                  <span className="text-[#667085] italic font-medium">
                    Sin nota final definida
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#DCE3EC] gap-3">
            <div>
              {student && student.hasGrade && onDeleteGrade && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent transition-colors cursor-pointer"
                  title="Eliminar las calificaciones de este estudiante"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Borrar nota</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#DCE3EC] text-xs font-bold text-[#667085] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-guardar-nota-manual"
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#174EAF] hover:bg-[#103B88] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Calificación</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
