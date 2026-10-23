import React, { useState, useMemo } from 'react';
import { OfertaAcademicaItem, Asignatura } from '../types';
import {
  X,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Layers,
  GraduationCap,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface SelectFromOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  ofertaAcademica: OfertaAcademicaItem[];
  existingAsignaturas: Asignatura[];
  currentDocenteId?: string;
  onSelectOfertaItem: (item: OfertaAcademicaItem) => void;
}

export const SelectFromOfferModal: React.FC<SelectFromOfferModalProps> = ({
  isOpen,
  onClose,
  ofertaAcademica,
  existingAsignaturas,
  currentDocenteId,
  onSelectOfertaItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCarrera, setSelectedCarrera] = useState<string>('TODAS');
  const [selectedSemestre, setSelectedSemestre] = useState<string>('TODOS');

  // Extract unique careers from offer
  const uniqueCarreras = useMemo(() => {
    const set = new Set<string>();
    ofertaAcademica.forEach((o) => {
      if (o.carrera) set.add(o.carrera);
    });
    return Array.from(set).sort();
  }, [ofertaAcademica]);

  // Map of subjects already taken in current subjects list
  const existingOfferMap = useMemo(() => {
    const map = new Map<string, Asignatura>();
    existingAsignaturas.forEach((a) => {
      if (a.origenOfertaId) {
        map.set(a.origenOfertaId, a);
      }
      // Also match by sigla + grupo
      const key = `${a.sigla.trim().toUpperCase()}_${a.grupo.trim().toUpperCase()}`;
      map.set(key, a);
    });
    return map;
  }, [existingAsignaturas]);

  // Filtered offer items
  const filteredOffer = useMemo(() => {
    return ofertaAcademica.filter((item) => {
      if (selectedCarrera !== 'TODAS' && item.carrera !== selectedCarrera) {
        return false;
      }
      if (selectedSemestre !== 'TODOS' && item.semestre.toString() !== selectedSemestre) {
        return false;
      }
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase();
      const matchSigla = item.sigla.toLowerCase().includes(term);
      const matchNombre = item.nombre.toLowerCase().includes(term);
      const matchGrupo = item.grupo.toLowerCase().includes(term);
      const matchCarrera = (item.carrera || '').toLowerCase().includes(term);
      return matchSigla || matchNombre || matchGrupo || matchCarrera;
    });
  }, [ofertaAcademica, searchTerm, selectedCarrera, selectedSemestre]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#174EAF] text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Maestro de Oferta Académica
              </h2>
              <p className="text-xs text-blue-100/90">
                Busca y selecciona tus materias del catálogo oficial para agregarlas a tu portal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por sigla (CPA-100), materia o grupo..."
                className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174EAF] focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Carrera Filter */}
            <div className="sm:col-span-4">
              <select
                value={selectedCarrera}
                onChange={(e) => setSelectedCarrera(e.target.value)}
                className="w-full py-2 px-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174EAF] transition-all"
              >
                <option value="TODAS">Todas las Carreras</option>
                {uniqueCarreras.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Semestre Filter */}
            <div className="sm:col-span-2">
              <select
                value={selectedSemestre}
                onChange={(e) => setSelectedSemestre(e.target.value)}
                className="w-full py-2 px-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174EAF] transition-all"
              >
                <option value="TODOS">Semestre</option>
                <option value="1">1° Semestre</option>
                <option value="2">2° Semestre</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Mostrando <strong>{filteredOffer.length}</strong> de {ofertaAcademica.length} asignaturas ofertadas
            </span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Haz clic en "Tomar Asignatura" para activarla en tu panel docente
            </span>
          </div>
        </div>

        {/* Offer Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredOffer.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">
                No se encontraron materias con el filtro seleccionado
              </p>
              <p className="text-xs text-slate-400">
                Intenta buscar con otra sigla o nombre, o restablece los filtros.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCarrera('TODAS');
                  setSelectedSemestre('TODOS');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-[#174EAF] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                Restablecer búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredOffer.map((item) => {
                const alreadyTaken =
                  existingOfferMap.has(item.id) ||
                  existingOfferMap.has(`${item.sigla.trim().toUpperCase()}_${item.grupo.trim().toUpperCase()}`);
                const existingSub =
                  existingOfferMap.get(item.id) ||
                  existingOfferMap.get(`${item.sigla.trim().toUpperCase()}_${item.grupo.trim().toUpperCase()}`);
                const isMine = existingSub && currentDocenteId && existingSub.docenteId === currentDocenteId;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      alreadyTaken
                        ? 'bg-slate-50 border-slate-200 opacity-90'
                        : 'bg-white border-slate-200 hover:border-[#174EAF] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-xs font-black bg-[#E8F0FC] text-[#174EAF] border border-blue-200">
                            {item.sigla}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800">
                            Grp: {item.grupo}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            NSA: {item.nsa ?? item.semestre}
                          </span>
                          {item.cupoOfertado !== undefined && (
                            <span className="text-[11px] font-mono text-slate-600 bg-blue-50/60 border border-blue-100 px-1.5 py-0.5 rounded">
                              Cupo: {item.cupoOfertado} (Insc: {item.inscritos ?? 0})
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.nombre}
                        </h4>
                        <div className="flex flex-col gap-0.5 text-[11px] text-slate-500">
                          <p className="flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Carreras: {item.carrera || 'Facultad de Ciencias Contables'}</span>
                          </p>
                          {item.docenteAsignadoNombre && (
                            <p className="text-slate-600 font-medium">
                              Docente: {item.docenteAsignadoNombre}
                              {item.docenteAsignadoId && <span className="font-mono text-slate-400 ml-1">({item.docenteAsignadoId})</span>}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Modalidad Pill */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {item.diasTexto ||
                          (item.modalidad === 'LUN_MIE_VIE'
                            ? 'Lun, Mié, Vie'
                            : item.modalidad === 'MAR_JUE'
                            ? 'Mar, Jue'
                            : 'Sábado')}
                      </span>
                    </div>

                    {/* Schedule & Classroom Details */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {item.horarioTexto || `${item.horaInicio} - ${item.horaFin}`}
                        </span>
                        {item.aula && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            Aula: {item.aula}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <div>
                        {alreadyTaken ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-200/80 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isMine ? 'En tu portal' : 'Ya agregada'}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectOfertaItem(item);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#174EAF] hover:bg-[#103B88] rounded-lg shadow-2xs transition-colors cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Tomar Asignatura</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px]">
            ¿No encuentras tu asignatura? También puedes crearla de forma manual con el botón <strong>"+ Nueva Asignatura (Manual)"</strong>.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
