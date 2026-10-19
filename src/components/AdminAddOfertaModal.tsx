import React, { useState } from 'react';
import { OfertaAcademicaItem, ModalidadSemanal, SemestreAsignatura } from '../types';
import { X, Plus, BookOpen, AlertCircle } from 'lucide-react';

interface AdminAddOfertaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOfertaItem: (item: OfertaAcademicaItem) => void;
}

export const AdminAddOfertaModal: React.FC<AdminAddOfertaModalProps> = ({
  isOpen,
  onClose,
  onSaveOfertaItem,
}) => {
  const [sigla, setSigla] = useState('');
  const [nombre, setNombre] = useState('');
  const [grupo, setGrupo] = useState('G1');
  const [semestre, setSemestre] = useState<SemestreAsignatura>(1);
  const [carrera, setCarrera] = useState('Contaduría Pública');
  const [modalidad, setModalidad] = useState<ModalidadSemanal>('LUN_MIE_VIE');
  const [horaInicio, setHoraInicio] = useState('07:00');
  const [horaFin, setHoraFin] = useState('08:30');
  const [aula, setAula] = useState('Aula 236-01');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigla.trim()) {
      setError('La sigla / código es obligatoria (ej. CPA-100).');
      return;
    }
    if (!nombre.trim()) {
      setError('El nombre de la asignatura es obligatorio.');
      return;
    }

    const newItem: OfertaAcademicaItem = {
      id: `oferta-${Date.now()}`,
      sigla: sigla.trim().toUpperCase(),
      nombre: nombre.trim(),
      grupo: grupo.trim().toUpperCase() || 'G1',
      semestre,
      año: 2026,
      carrera: carrera.trim(),
      modalidad,
      horaInicio,
      horaFin,
      aula: aula.trim() || undefined,
      colorTag: '#174EAF',
    };

    onSaveOfertaItem(newItem);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#172033] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Agregar Asignatura a Oferta</h3>
              <p className="text-xs text-slate-400">Incorporar materia al catálogo de la Facultad</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Sigla / Código *</label>
              <input
                type="text"
                required
                value={sigla}
                onChange={(e) => setSigla(e.target.value)}
                placeholder="CPA-100"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl uppercase font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Nombre de Asignatura *</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Contabilidad Básica I"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Grupo</label>
              <input
                type="text"
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                placeholder="G1, SA"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Semestre</label>
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
              <label className="block text-xs font-bold text-slate-700">Aula</label>
              <input
                type="text"
                value={aula}
                onChange={(e) => setAula(e.target.value)}
                placeholder="Aula 236-01"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">Carrera / Área Académica</label>
              <span className="text-[10px] text-slate-400">Puedes escribirla a mano si lo deseas</span>
            </div>
            <input
              type="text"
              list="carreras-oferta-add-list"
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              placeholder="Escribe la carrera (ej. Contaduría Pública, Finanzas...)"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            />
            <datalist id="carreras-oferta-add-list">
              <option value="Contaduría Pública" />
              <option value="Auditoría Financiera" />
              <option value="Sistemas de Control de Gestión" />
              <option value="Ingeniería Financiera" />
              <option value="Administración de Empresas" />
              <option value="Ingeniería Comercial" />
              <option value="Ingeniería Informática / Sistemas" />
              <option value="Ciencias Exactas" />
              <option value="Economía" />
              <option value="Facultad de Ciencias Contables" />
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Modalidad</label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as ModalidadSemanal)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              >
                <option value="LUN_MIE_VIE">Lun-Mié-Vie</option>
                <option value="MAR_JUE">Mar-Jue</option>
                <option value="SABADO">Sábado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Hora Inicio</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Hora Fin</label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
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
              <Plus className="w-4 h-4" />
              <span>Guardar en Oferta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
