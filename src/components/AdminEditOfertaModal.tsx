import React, { useState, useEffect } from 'react';
import { OfertaAcademicaItem, ModalidadSemanal, SemestreAsignatura } from '../types';
import { X, Edit2, BookOpen, AlertCircle, Save } from 'lucide-react';

interface AdminEditOfertaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: OfertaAcademicaItem | null;
  onUpdateOfertaItem: (updatedItem: OfertaAcademicaItem) => void;
}

const CARRERAS_PREDETERMINADAS = [
  'Contaduría Pública',
  'Auditoría Financiera',
  'Sistemas de Control de Gestión',
  'Ingeniería Financiera',
  'Administración de Empresas',
  'Ingeniería Comercial',
  'Ingeniería Informática / Sistemas',
  'Ciencias Exactas',
  'Economía',
  'Comercio Internacional',
  'Facultad de Ciencias Contables',
];

export const AdminEditOfertaModal: React.FC<AdminEditOfertaModalProps> = ({
  isOpen,
  onClose,
  item,
  onUpdateOfertaItem,
}) => {
  const [sigla, setSigla] = useState('');
  const [nombre, setNombre] = useState('');
  const [grupo, setGrupo] = useState('G1');
  const [semestre, setSemestre] = useState<SemestreAsignatura>(1);
  const [año, setAño] = useState(2026);
  const [carrera, setCarrera] = useState('');
  const [modalidad, setModalidad] = useState<ModalidadSemanal>('LUN_MIE_VIE');
  const [horaInicio, setHoraInicio] = useState('07:00');
  const [horaFin, setHoraFin] = useState('08:30');
  const [aula, setAula] = useState('Aula 236-01');
  const [cupo, setCupo] = useState<number | undefined>(60);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setSigla(item.sigla || '');
      setNombre(item.nombre || '');
      setGrupo(item.grupo || 'G1');
      setSemestre(item.semestre || 1);
      setAño(item.año || 2026);
      setCarrera(item.carrera || 'Contaduría Pública');
      setModalidad(item.modalidad || 'LUN_MIE_VIE');
      setHoraInicio(item.horaInicio || '07:00');
      setHoraFin(item.horaFin || '08:30');
      setAula(item.aula || '');
      setCupo(item.cupo || 60);
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanSigla = sigla.trim().toUpperCase();
    const cleanNombre = nombre.trim();
    const cleanGrupo = grupo.trim().toUpperCase();
    const cleanCarrera = carrera.trim();

    if (!cleanSigla) {
      setError('La sigla de la materia es requerida (ej. CPA-200).');
      return;
    }
    if (!cleanNombre) {
      setError('El nombre de la materia es requerido.');
      return;
    }
    if (!cleanGrupo) {
      setError('El grupo es requerido (ej. G1, A, SC).');
      return;
    }
    if (!cleanCarrera) {
      setError('La carrera o área académica es requerida.');
      return;
    }

    const updatedItem: OfertaAcademicaItem = {
      ...item,
      sigla: cleanSigla,
      nombre: cleanNombre,
      grupo: cleanGrupo,
      semestre,
      año,
      carrera: cleanCarrera,
      modalidad,
      horaInicio,
      horaFin,
      aula: aula.trim() || undefined,
      cupo: cupo ? Number(cupo) : undefined,
    };

    onUpdateOfertaItem(updatedItem);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#172033] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Modificar Asignatura de Oferta</h3>
              <p className="text-xs text-slate-400">
                Editar detalles en el Catálogo Maestro ({item.sigla})
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700">
                Sigla *
              </label>
              <input
                type="text"
                required
                value={sigla}
                onChange={(e) => setSigla(e.target.value.toUpperCase())}
                placeholder="CPA-200"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700">
                Nombre de la Asignatura *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Contabilidad Básica II"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          {/* Carrera con introducción a mano */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Carrera / Área Académica *
              </label>
              <span className="text-[10px] text-slate-400">Puedes escribirla a mano libremente</span>
            </div>
            <input
              type="text"
              required
              list="edit-carreras-oferta-datalist"
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              placeholder="Introduce la carrera o área académica..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            />
            <datalist id="edit-carreras-oferta-datalist">
              {CARRERAS_PREDETERMINADAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 mr-1 self-center">Sugerencias:</span>
              {['Contaduría Pública', 'Auditoría Financiera', 'Ing. Financiera', 'Ing. Sistemas'].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setCarrera(sug)}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#174EAF] rounded-md transition-colors border border-slate-200 cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Grupo *
              </label>
              <input
                type="text"
                required
                value={grupo}
                onChange={(e) => setGrupo(e.target.value.toUpperCase())}
                placeholder="G1"
                className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Semestre
              </label>
              <select
                value={semestre}
                onChange={(e) => setSemestre(Number(e.target.value) as SemestreAsignatura)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              >
                <option value={1}>1° Semestre</option>
                <option value={2}>2° Semestre</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Gestión / Año
              </label>
              <input
                type="number"
                value={año}
                onChange={(e) => setAño(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Modalidad de Días
            </label>
            <select
              value={modalidad}
              onChange={(e) => setModalidad(e.target.value as ModalidadSemanal)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            >
              <option value="LUN_MIE_VIE">Lunes, Miércoles y Viernes</option>
              <option value="MAR_JUE">Martes y Jueves</option>
              <option value="SABADO">Sábado Intensivo</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Hora Inicio
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Hora Fin
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Aula / Ubicación
              </label>
              <input
                type="text"
                value={aula}
                onChange={(e) => setAula(e.target.value)}
                placeholder="Aula 236-04"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Cupo Estimado
              </label>
              <input
                type="number"
                value={cupo || ''}
                onChange={(e) => setCupo(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="60"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#174EAF] hover:bg-[#103B88] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
