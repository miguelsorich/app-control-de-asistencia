import React, { useState, useEffect } from 'react';
import { Asignatura, ModalidadSemanal, SemestreAsignatura } from '../types';
import {
  calculateEndTime,
  COMMON_TIME_SLOTS_LUN_MIE_VIE,
  COMMON_TIME_SLOTS_MAR_JUE,
  COMMON_TIME_SLOTS_SABADO,
} from '../utils/timeHelpers';
import { X, Calendar, Clock, BookOpen, CheckCircle2, AlertCircle, CalendarDays } from 'lucide-react';

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Asignatura, 'id' | 'fechaCreacion'> & { id?: string }) => void;
  initialData?: Asignatura | null;
}

export const SubjectFormModal: React.FC<SubjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [nombre, setNombre] = useState('');
  const [sigla, setSigla] = useState('');
  const [grupo, setGrupo] = useState('');
  const [semestre, setSemestre] = useState<SemestreAsignatura>(1);
  const [año, setAño] = useState<number>(2026);
  const [modalidad, setModalidad] = useState<ModalidadSemanal>('LUN_MIE_VIE');
  const [horaInicio, setHoraInicio] = useState('07:00');
  const [horaFin, setHoraFin] = useState('08:30');
  const [aula, setAula] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoCalculateEnd, setAutoCalculateEnd] = useState(true);

  // Populate or reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setNombre(initialData.nombre);
        setSigla(initialData.sigla);
        setGrupo(initialData.grupo);
        setSemestre(initialData.semestre || 1);
        setAño(initialData.año || 2026);
        setModalidad(initialData.modalidad);
        setHoraInicio(initialData.horaInicio);
        setHoraFin(initialData.horaFin);
        setAula(initialData.aula || '');
        setAutoCalculateEnd(false);
      } else {
        setNombre('');
        setSigla('');
        setGrupo('');
        setSemestre(1);
        setAño(new Date().getFullYear() >= 2026 ? new Date().getFullYear() : 2026);
        setModalidad('LUN_MIE_VIE');
        setHoraInicio('07:00');
        setHoraFin('08:30');
        setAula('');
        setAutoCalculateEnd(true);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Recalculate end time when modality changes if autoCalculateEnd is enabled
  const handleModalidadChange = (newMod: ModalidadSemanal) => {
    setModalidad(newMod);
    if (newMod === 'SABADO') {
      setHoraInicio('07:00');
      setHoraFin('11:30');
    } else if (autoCalculateEnd && horaInicio) {
      const calculatedEnd = calculateEndTime(horaInicio, newMod);
      if (calculatedEnd) {
        setHoraFin(calculatedEnd);
      }
    }
  };

  // Recalculate end time when start time changes if autoCalculateEnd is enabled
  const handleHoraInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHoraInicio(val);
    if (autoCalculateEnd && val) {
      const calculatedEnd = calculateEndTime(val, modalidad);
      if (calculatedEnd) {
        setHoraFin(calculatedEnd);
      }
    }
  };

  const handleSelectPresetSlot = (start: string, end: string) => {
    setHoraInicio(start);
    setHoraFin(end);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre de la asignatura es obligatorio.';
    }
    if (!sigla.trim()) {
      newErrors.sigla = 'La sigla es obligatoria (ej. INF210, MAT101).';
    }
    if (!grupo.trim()) {
      newErrors.grupo = 'El grupo es obligatorio (ej. SA, SB, Z1).';
    }
    if (semestre !== 1 && semestre !== 2) {
      newErrors.semestre = 'El semestre debe ser 1 o 2.';
    }
    const numAño = Number(año);
    if (!numAño || isNaN(numAño) || numAño < 2000 || numAño > 2100 || String(numAño).length !== 4) {
      newErrors.año = 'Debe indicar un año válido de 4 dígitos (ej. 2026, 2027, 2028).';
    }
    if (!horaInicio) {
      newErrors.horaInicio = 'Debe indicar la hora de inicio.';
    }
    if (!horaFin) {
      newErrors.horaFin = 'Debe indicar la hora de fin.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...(initialData?.id ? { id: initialData.id } : {}),
      nombre: nombre.trim(),
      sigla: sigla.trim().toUpperCase(),
      grupo: grupo.trim().toUpperCase(),
      semestre: Number(semestre) === 2 ? 2 : 1,
      año: Number(año),
      modalidad,
      horaInicio,
      horaFin,
      aula: aula.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  const activePresets =
    modalidad === 'LUN_MIE_VIE'
      ? COMMON_TIME_SLOTS_LUN_MIE_VIE
      : modalidad === 'MAR_JUE'
      ? COMMON_TIME_SLOTS_MAR_JUE
      : COMMON_TIME_SLOTS_SABADO;

  const getDuracionEstandarTexto = () => {
    if (modalidad === 'LUN_MIE_VIE') return 'Duración estándar: 1h 30m';
    if (modalidad === 'MAR_JUE') return 'Duración estándar: 2h 15m';
    return 'Duración estándar: 4h 30m';
  };

  return (
    <div
      id="modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#172033]/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div
        id="modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-[#DCE3EC] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-[#174EAF] px-6 py-4.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialData ? 'Editar Asignatura' : 'Agregar Nueva Asignatura'}
              </h2>
              <p className="text-xs text-[#E8F0FC]/80">
                Complete la información requerida para el registro
              </p>
            </div>
          </div>
          <button
            id="btn-close-modal"
            type="button"
            onClick={onClose}
            className="text-[#E8F0FC] hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre de la asignatura */}
          <div>
            <label
              htmlFor="input-nombre"
              className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5"
            >
              Nombre de la asignatura <span className="text-red-500">*</span>
            </label>
            <input
              id="input-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Estructuras de Datos I, Cálculo I, Redes I"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                errors.nombre
                  ? 'border-red-400 focus:ring-red-400 focus:border-red-500 bg-red-50/20'
                  : 'border-[#DCE3EC] focus:ring-[#174EAF] focus:border-[#174EAF]'
              } focus:outline-none focus:ring-2 transition-all`}
              autoFocus
            />
            {errors.nombre && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.nombre}
              </p>
            )}
          </div>

          {/* Sigla y Grupo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="input-sigla"
                className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5"
              >
                Sigla <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-sigla"
                  type="text"
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  placeholder="Ej. INF210, MAT101"
                  className={`w-full uppercase px-3.5 py-2.5 text-sm rounded-xl border ${
                    errors.sigla
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-500 bg-red-50/20'
                      : 'border-[#DCE3EC] focus:ring-[#174EAF] focus:border-[#174EAF]'
                  } focus:outline-none focus:ring-2 transition-all font-mono font-medium`}
                />
              </div>
              {errors.sigla && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.sigla}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="input-grupo"
                className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5"
              >
                Grupo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-grupo"
                  type="text"
                  value={grupo}
                  onChange={(e) => setGrupo(e.target.value)}
                  placeholder="Ej. SA, SB, SC, Z1"
                  className={`w-full uppercase px-3.5 py-2.5 text-sm rounded-xl border ${
                    errors.grupo
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-500 bg-red-50/20'
                      : 'border-[#DCE3EC] focus:ring-[#174EAF] focus:border-[#174EAF]'
                  } focus:outline-none focus:ring-2 transition-all font-medium`}
                />
              </div>
              {errors.grupo && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.grupo}
                </p>
              )}
            </div>
          </div>

          {/* Semestre y Año Académico (Nuevos campos obligatorios) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F5F7FA] p-3.5 rounded-xl border border-[#DCE3EC]">
            <div>
              <label
                htmlFor="select-semestre"
                className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5"
              >
                Semestre <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-semestre-1"
                  onClick={() => setSemestre(1)}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                    semestre === 1
                      ? 'bg-[#174EAF] text-white border-[#174EAF] shadow-xs'
                      : 'bg-white text-[#172033] border-[#DCE3EC] hover:border-[#174EAF]'
                  }`}
                >
                  Semestre 1
                </button>
                <button
                  type="button"
                  id="btn-semestre-2"
                  onClick={() => setSemestre(2)}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                    semestre === 2
                      ? 'bg-[#174EAF] text-white border-[#174EAF] shadow-xs'
                      : 'bg-white text-[#172033] border-[#DCE3EC] hover:border-[#174EAF]'
                  }`}
                >
                  Semestre 2
                </button>
              </div>
              {errors.semestre && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.semestre}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="input-anio"
                className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5"
              >
                Año <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-anio"
                  type="number"
                  min="2000"
                  max="2100"
                  step="1"
                  value={año}
                  onChange={(e) => setAño(parseInt(e.target.value, 10) || 0)}
                  placeholder="Ej. 2026, 2027"
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    errors.año
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-500 bg-red-50/20'
                      : 'border-[#DCE3EC] focus:ring-[#174EAF] focus:border-[#174EAF]'
                  } focus:outline-none focus:ring-2 transition-all font-mono font-medium bg-white`}
                />
              </div>
              {errors.año && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.año}
                </p>
              )}
            </div>
          </div>

          {/* Modalidad Semanal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                Modalidad Semanal <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-[#667085]">Seleccione los días de clase</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Lunes, miércoles y viernes */}
              <button
                id="btn-mod-lun-mie-vie"
                type="button"
                onClick={() => handleModalidadChange('LUN_MIE_VIE')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  modalidad === 'LUN_MIE_VIE'
                    ? 'border-[#174EAF] bg-[#E8F0FC] ring-2 ring-[#174EAF]/20 shadow-xs'
                    : 'border-[#DCE3EC] hover:border-slate-300 hover:bg-[#F5F7FA]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className={`w-4 h-4 ${modalidad === 'LUN_MIE_VIE' ? 'text-[#174EAF]' : 'text-[#667085]'}`} />
                    <span className="text-xs font-bold text-[#172033]">
                      Lun, Mié y Vie
                    </span>
                  </div>
                  {modalidad === 'LUN_MIE_VIE' && (
                    <CheckCircle2 className="w-4 h-4 text-[#174EAF] flex-shrink-0" />
                  )}
                </div>
                <div className="mt-2 space-y-0.5 text-xs text-[#667085]">
                  <p className="font-semibold text-[#174EAF]">• 3 clases / sem</p>
                  <p className="text-[#667085] text-[11px]">• 1h 30m por clase</p>
                </div>
              </button>

              {/* Option 2: Martes y jueves */}
              <button
                id="btn-mod-mar-jue"
                type="button"
                onClick={() => handleModalidadChange('MAR_JUE')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  modalidad === 'MAR_JUE'
                    ? 'border-[#174EAF] bg-[#E8F0FC] ring-2 ring-[#174EAF]/20 shadow-xs'
                    : 'border-[#DCE3EC] hover:border-slate-300 hover:bg-[#F5F7FA]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className={`w-4 h-4 ${modalidad === 'MAR_JUE' ? 'text-[#174EAF]' : 'text-[#667085]'}`} />
                    <span className="text-xs font-bold text-[#172033]">
                      Martes y Jueves
                    </span>
                  </div>
                  {modalidad === 'MAR_JUE' && (
                    <CheckCircle2 className="w-4 h-4 text-[#174EAF] flex-shrink-0" />
                  )}
                </div>
                <div className="mt-2 space-y-0.5 text-xs text-[#667085]">
                  <p className="font-semibold text-[#174EAF]">• 2 clases / sem</p>
                  <p className="text-[#667085] text-[11px]">• 2h 15m por clase</p>
                </div>
              </button>

              {/* Option 3: Sábado */}
              <button
                id="btn-mod-sabado"
                type="button"
                onClick={() => handleModalidadChange('SABADO')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                  modalidad === 'SABADO'
                    ? 'border-[#174EAF] bg-[#E8F0FC] ring-2 ring-[#174EAF]/20 shadow-xs'
                    : 'border-[#DCE3EC] hover:border-slate-300 hover:bg-[#F5F7FA]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className={`w-4 h-4 ${modalidad === 'SABADO' ? 'text-[#174EAF]' : 'text-[#667085]'}`} />
                    <span className="text-xs font-bold text-[#172033]">
                      Sábado
                    </span>
                  </div>
                  {modalidad === 'SABADO' && (
                    <CheckCircle2 className="w-4 h-4 text-[#174EAF] flex-shrink-0" />
                  )}
                </div>
                <div className="mt-2 space-y-0.5 text-xs text-[#667085]">
                  <p className="font-semibold text-[#174EAF]">• 1 clase / sem</p>
                  <p className="text-[#667085] text-[11px]">• 07:00 a 11:30 (4h 30m)</p>
                </div>
              </button>
            </div>
          </div>

          {/* Horario */}
          <div className="bg-[#F5F7FA] rounded-xl p-4 border border-[#DCE3EC] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#667085]" />
                <span>Horario de Clase <span className="text-red-500">*</span></span>
              </label>
              <span className="text-[11px] text-[#667085] font-medium">
                {getDuracionEstandarTexto()}
              </span>
            </div>

            {/* Common UAGRM Slot Presets */}
            <div>
              <p className="text-[11px] font-medium text-[#667085] mb-1.5">
                Horarios universitarios habituales:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activePresets.map((slot) => {
                  const isSelected = horaInicio === slot.start && horaFin === slot.end;
                  return (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => handleSelectPresetSlot(slot.start, slot.end)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#174EAF] text-white border-[#174EAF] font-bold shadow-2xs'
                          : 'bg-white text-[#172033] border-[#DCE3EC] hover:bg-[#E8F0FC]'
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Time inputs */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#DCE3EC]">
              <div>
                <label
                  htmlFor="input-hora-inicio"
                  className="block text-[11px] font-semibold text-[#667085] mb-1"
                >
                  Hora de inicio
                </label>
                <input
                  id="input-hora-inicio"
                  type="time"
                  value={horaInicio}
                  onChange={handleHoraInicioChange}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#DCE3EC] bg-white text-[#172033] focus:ring-2 focus:ring-[#174EAF] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="input-hora-fin"
                  className="block text-[11px] font-semibold text-[#667085] mb-1"
                >
                  Hora de finalización
                </label>
                <input
                  id="input-hora-fin"
                  type="time"
                  value={horaFin}
                  onChange={(e) => {
                    setHoraFin(e.target.value);
                    setAutoCalculateEnd(false);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#DCE3EC] bg-white text-[#172033] focus:ring-2 focus:ring-[#174EAF] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Aula (Opcional) */}
          <div>
            <label
              htmlFor="input-aula"
              className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5"
            >
              Aula o Laboratorio <span className="text-[#667085] font-normal text-[11px]">(Opcional)</span>
            </label>
            <div className="relative">
              <input
                id="input-aula"
                type="text"
                value={aula}
                onChange={(e) => setAula(e.target.value)}
                placeholder="Ej. Aula 236-04, Lab. Computación 2, Edif. 224"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#DCE3EC] focus:ring-2 focus:ring-[#174EAF] focus:border-[#174EAF] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Modal Footer / Actions */}
          <div className="pt-3 border-t border-[#DCE3EC] flex items-center justify-end gap-2.5">
            <button
              id="btn-cancelar-modal"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#667085] hover:text-[#172033] hover:bg-[#F5F7FA] rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-guardar-asignatura"
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-[#174EAF] hover:bg-[#103B88] rounded-xl shadow-xs transition-all focus:ring-2 focus:ring-[#174EAF] focus:ring-offset-2 cursor-pointer"
            >
              {initialData ? 'Guardar Cambios' : 'Registrar Asignatura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
