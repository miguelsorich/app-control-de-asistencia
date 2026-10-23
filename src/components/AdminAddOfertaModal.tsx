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
  const [cupoOfertado, setCupoOfertado] = useState<number | undefined>(40);
  const [inscritos, setInscritos] = useState<number | undefined>(0);
  const [nsa, setNsa] = useState<string | number>(1);
  const [docenteId, setDocenteId] = useState('');
  const [docenteNombre, setDocenteNombre] = useState('');
  const [diasTexto, setDiasTexto] = useState('Lun');
  const [horarioTexto, setHorarioTexto] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigla.trim()) {
      setError('La sigla / código es obligatoria (ej. ADM100).');
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
      grupo: grupo.trim().toUpperCase() || 'A',
      semestre,
      año: 2026,
      carrera: carrera.trim(),
      modalidad,
      horaInicio,
      horaFin,
      aula: aula.trim() || undefined,
      colorTag: '#174EAF',
      cupoOfertado: cupoOfertado !== undefined ? Number(cupoOfertado) : undefined,
      inscritos: inscritos !== undefined ? Number(inscritos) : undefined,
      nsa: nsa || 1,
      docenteAsignadoId: docenteId.trim() || undefined,
      docenteAsignadoNombre: docenteNombre.trim() || undefined,
      diasTexto: diasTexto.trim() || undefined,
      horarioTexto: horarioTexto.trim() || `${horaInicio}-${horaFin}`,
      cupo: cupoOfertado,
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
                placeholder="ADM100"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl uppercase font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Nombre de la Materia *</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. ADMINISTRACION GENERAL"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Grp (Grupo)</label>
              <input
                type="text"
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                placeholder="A, G1, SA"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
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
                placeholder="21318 o Aula 236-01"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          {/* Plantilla UAGRM: C_Of, Insc, NSA */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">C_Of (Cupo)</label>
              <input
                type="number"
                value={cupoOfertado ?? ''}
                onChange={(e) => setCupoOfertado(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="40"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Insc (Inscritos)</label>
              <input
                type="number"
                value={inscritos ?? ''}
                onChange={(e) => setInscritos(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="21"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">NSA (Nivel)</label>
              <input
                type="text"
                value={nsa}
                onChange={(e) => setNsa(e.target.value)}
                placeholder="1"
                className="w-full px-3 py-2 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">Carreras / Área</label>
              <span className="text-[10px] text-slate-400">Códigos o nombre libre</span>
            </div>
            <input
              type="text"
              list="carreras-oferta-add-list"
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              placeholder="Ej. 105-5 109-1 o Contaduría Pública"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            />
            <datalist id="carreras-oferta-add-list">
              <option value="105-5 109-1" />
              <option value="Contaduría Pública" />
              <option value="Auditoría Financiera" />
              <option value="Sistemas de Control de Gestión" />
              <option value="Ingeniería Financiera" />
              <option value="Administración de Empresas" />
              <option value="Ingeniería Comercial" />
              <option value="Ingeniería Informática / Sistemas" />
              <option value="Ciencias Exactas" />
              <option value="Economía" />
            </datalist>
          </div>

          {/* Docente: Cod.Doc. & NombreDoc */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Cod.Doc.</label>
              <input
                type="text"
                value={docenteId}
                onChange={(e) => setDocenteId(e.target.value)}
                placeholder="3000"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">NombreDoc</label>
              <input
                type="text"
                value={docenteNombre}
                onChange={(e) => setDocenteNombre(e.target.value)}
                placeholder="AZOGUE ROMERO OSCAR"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          {/* Días y Horario según formato UAGRM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Días (ej. Lun, Mar-Jue)</label>
              <input
                type="text"
                value={diasTexto}
                onChange={(e) => setDiasTexto(e.target.value)}
                placeholder="Lun"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Horario (ej. 19:45-21:15)</label>
              <input
                type="text"
                value={horarioTexto}
                onChange={(e) => setHorarioTexto(e.target.value)}
                placeholder="19:45-21:15"
                className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Modalidad Asistencia</label>
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
