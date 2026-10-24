import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Asignatura,
  ModalidadSemanal,
  SemestreAsignatura,
  OfertaAcademicaItem,
  DocenteUsuario,
} from '../types';
import {
  calculateEndTime,
  COMMON_TIME_SLOTS_LUN_MIE_VIE,
  COMMON_TIME_SLOTS_MAR_JUE,
  COMMON_TIME_SLOTS_SABADO,
} from '../utils/timeHelpers';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  UserCheck,
  Building2,
  GraduationCap,
  MapPin,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { matchOfertaItem } from '../utils/searchHelpers';

interface SubjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<Asignatura, 'id' | 'fechaCreacion'> & {
      id?: string;
      docenteId?: string;
      docenteNombre?: string;
    }
  ) => void;
  initialData?: Asignatura | null;
  ofertaAcademica?: OfertaAcademicaItem[];
  docentes?: DocenteUsuario[];
  currentDocente?: DocenteUsuario | null;
}

export const SubjectFormModal: React.FC<SubjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  ofertaAcademica = [],
  docentes = [],
  currentDocente = null,
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
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoCalculateEnd, setAutoCalculateEnd] = useState(true);

  // Search & Filter from academic offer catalog
  const [offerSearchTerm, setOfferSearchTerm] = useState('');
  const [offerCarreraFilter, setOfferCarreraFilter] = useState<string>('TODAS');
  const [offerSemestreFilter, setOfferSemestreFilter] = useState<string>('TODOS');
  const [isOfferDropdownOpen, setIsOfferDropdownOpen] = useState(false);
  const [selectedOfferItem, setSelectedOfferItem] = useState<OfertaAcademicaItem | null>(null);
  const offerContainerRef = useRef<HTMLDivElement>(null);

  // Close offer dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        offerContainerRef.current &&
        !offerContainerRef.current.contains(event.target as Node)
      ) {
        setIsOfferDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Unique careers in offer for quick filtering
  const uniqueCarreras = useMemo(() => {
    const set = new Set<string>();
    ofertaAcademica.forEach((o) => {
      if (o.carrera) set.add(o.carrera);
    });
    return Array.from(set).sort();
  }, [ofertaAcademica]);

  // Filtered offer items for the search dropdown
  const filteredOfferItems = useMemo(() => {
    if (!offerSearchTerm.trim() && offerCarreraFilter === 'TODAS' && offerSemestreFilter === 'TODOS') {
      return ofertaAcademica.slice(0, 20);
    }
    return ofertaAcademica.filter((item) =>
      matchOfertaItem(item, offerSearchTerm, offerCarreraFilter, offerSemestreFilter)
    );
  }, [ofertaAcademica, offerSearchTerm, offerCarreraFilter, offerSemestreFilter]);

  // Unique siglas and names for native datalists
  const uniqueSiglas = useMemo(() => {
    const set = new Set<string>();
    ofertaAcademica.forEach((o) => {
      if (o.sigla) set.add(o.sigla.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [ofertaAcademica]);

  const uniqueNombres = useMemo(() => {
    const set = new Set<string>();
    ofertaAcademica.forEach((o) => {
      if (o.nombre) set.add(o.nombre.trim());
    });
    return Array.from(set).sort();
  }, [ofertaAcademica]);

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
        setSelectedDocenteId(initialData.docenteId || currentDocente?.id || '');
        setAutoCalculateEnd(false);
        setSelectedOfferItem(null);
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
        setSelectedDocenteId(currentDocente?.id || (docentes[0]?.id || 'docente-6379'));
        setAutoCalculateEnd(true);
        setSelectedOfferItem(null);
      }
      setOfferSearchTerm('');
      setOfferCarreraFilter('TODAS');
      setOfferSemestreFilter('TODOS');
      setIsOfferDropdownOpen(false);
      setErrors({});
    }
  }, [isOpen, initialData, currentDocente, docentes]);

  // Select an offer item and auto-fill form fields
  const handleSelectOfferItem = (item: OfertaAcademicaItem) => {
    setSelectedOfferItem(item);
    setNombre(item.nombre);
    setSigla(item.sigla);
    setGrupo(item.grupo);
    setSemestre(item.semestre === 2 ? 2 : 1);
    setAño(item.año || 2026);
    setModalidad(item.modalidad || 'LUN_MIE_VIE');
    setHoraInicio(item.horaInicio || '07:00');
    setHoraFin(item.horaFin || '08:30');
    setAula(item.aula || '');
    setAutoCalculateEnd(false);

    // Try to auto-match assigned docente in the registered docentes list
    if (item.docenteAsignadoId || item.docenteAsignadoNombre) {
      const docCode = (item.docenteAsignadoId || '').toLowerCase().trim();
      const docName = (item.docenteAsignadoNombre || '').toLowerCase().trim();

      const matchedDoc = docentes.find((d) => {
        const dCode = d.codigoDocente.toLowerCase().trim();
        const dName = d.nombreCompleto.toLowerCase().trim();
        return (
          (docCode && (dCode === docCode || docCode.includes(dCode) || dCode.includes(docCode))) ||
          (docName && (dName === docName || docName.includes(dName) || dName.includes(docName)))
        );
      });

      if (matchedDoc) {
        setSelectedDocenteId(matchedDoc.id);
      }
    }

    setIsOfferDropdownOpen(false);
    setErrors({});
  };

  const handleClearOfferSelection = () => {
    setSelectedOfferItem(null);
  };

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

    const assignedDoc = docentes.find((d) => d.id === selectedDocenteId) || currentDocente;

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
      docenteId: assignedDoc?.id,
      docenteNombre: assignedDoc?.nombreCompleto,
      origenOfertaId: selectedOfferItem?.id,
      carrera: selectedOfferItem?.carrera,
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
      className="fixed inset-0 z-50 overflow-y-auto bg-[#172033]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      {/* Datalists for native browser autocomplete suggestions */}
      <datalist id="oferta-siglas-datalist">
        {uniqueSiglas.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="oferta-nombres-datalist">
        {uniqueNombres.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <div
        id="modal-container"
        className="bg-white rounded-2xl shadow-2xl border border-[#DCE3EC] w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-[#174EAF] px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {initialData ? 'Editar Asignatura' : 'Agregar / Asignar Asignatura'}
              </h2>
              <p className="text-xs text-[#E8F0FC]/90">
                Filtra desde el Maestro de Oferta o completa los datos manualmente
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

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* ========================================================= */}
          {/* SECTOR 1: BUSCADOR Y FILTROS DEL MAESTRO DE OFERTA       */}
          {/* ========================================================= */}
          {ofertaAcademica.length > 0 && !initialData && (
            <div
              ref={offerContainerRef}
              className="bg-blue-50/50 border border-blue-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5 relative"
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#174EAF] text-white">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Autocompletar desde el Maestro de Oferta
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Filtra por sigla (ej. CPA500), nombre o docente para rellenar los datos al instante
                    </p>
                  </div>
                </div>

                {selectedOfferItem && (
                  <button
                    type="button"
                    onClick={handleClearOfferSelection}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#174EAF] hover:text-[#103B88] bg-white px-2 py-1 rounded-md border border-blue-200 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpiar selección</span>
                  </button>
                )}
              </div>

              {/* Filters Bar: Search text + Carrera + Semestre */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6 relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={offerSearchTerm}
                    onChange={(e) => {
                      setOfferSearchTerm(e.target.value);
                      setIsOfferDropdownOpen(true);
                    }}
                    onFocus={() => setIsOfferDropdownOpen(true)}
                    placeholder="Buscar sigla (CPA500), materia o docente..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174EAF] text-slate-900"
                  />
                  {offerSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setOfferSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={offerCarreraFilter}
                    onChange={(e) => {
                      setOfferCarreraFilter(e.target.value);
                      setIsOfferDropdownOpen(true);
                    }}
                    className="w-full py-1.5 px-2 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174EAF] text-slate-700"
                  >
                    <option value="TODAS">Todas las Carreras</option>
                    {uniqueCarreras.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <select
                    value={offerSemestreFilter}
                    onChange={(e) => {
                      setOfferSemestreFilter(e.target.value);
                      setIsOfferDropdownOpen(true);
                    }}
                    className="w-full py-1.5 px-2 text-xs bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174EAF] text-slate-700"
                  >
                    <option value="TODOS">Semestre</option>
                    <option value="1">Sem. 1</option>
                    <option value="2">Sem. 2</option>
                  </select>
                </div>
              </div>

              {/* Live Offer Dropdown Suggestions */}
              {isOfferDropdownOpen && (
                <div className="absolute left-3.5 right-3.5 top-full mt-1 z-30 bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                    <span>
                      {filteredOfferItems.length} asignaturas encontradas en la oferta
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOfferDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  {filteredOfferItems.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 italic">
                      No se encontraron asignaturas con ese filtro en la oferta.
                    </div>
                  ) : (
                    filteredOfferItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectOfferItem(item)}
                        className="p-2.5 hover:bg-blue-50/80 cursor-pointer transition-colors flex items-start justify-between gap-2"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-xs bg-blue-100 text-[#174EAF] px-1.5 py-0.2 rounded">
                              {item.sigla}
                            </span>
                            <span className="font-bold text-xs text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded">
                              Grp {item.grupo}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Sem. {item.semestre}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.nombre}
                          </p>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                            {item.docenteAsignadoNombre && (
                              <span className="text-[#174EAF] font-medium">
                                Doc: {item.docenteAsignadoNombre}
                                {item.docenteAsignadoId && ` (${item.docenteAsignadoId})`}
                              </span>
                            )}
                            <span>•</span>
                            <span>{item.diasTexto || item.modalidad}</span>
                            <span>•</span>
                            <span className="font-mono">{item.horarioTexto || `${item.horaInicio}-${item.horaFin}`}</span>
                            {item.aula && <span>• Aula {item.aula}</span>}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="shrink-0 px-2 py-1 text-[11px] font-bold text-white bg-[#174EAF] hover:bg-[#103B88] rounded-md shadow-2xs cursor-pointer"
                        >
                          Cargar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Visual Confirmation Banner if an offer item is loaded */}
              {selectedOfferItem && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Datos cargados de: <strong>{selectedOfferItem.sigla} - Grp {selectedOfferItem.grupo}</strong> ({selectedOfferItem.nombre})
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200/60 px-2 py-0.5 rounded text-emerald-900">
                    Oferta Vinculada
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTOR 2: ASIGNACIÓN DE DOCENTE                           */}
          {/* ========================================================= */}
          {docentes.length > 0 && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-[#DCE3EC] space-y-1.5">
              <label
                htmlFor="select-docente-asignado"
                className="block text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#174EAF]" />
                <span>Docente Asignado a la Asignatura <span className="text-red-500">*</span></span>
              </label>
              <select
                id="select-docente-asignado"
                value={selectedDocenteId}
                onChange={(e) => setSelectedDocenteId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCE3EC] rounded-xl focus:ring-2 focus:ring-[#174EAF] focus:outline-none font-medium text-slate-800"
              >
                {docentes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombreCompleto} (Cod: {d.codigoDocente}) — {d.carrera || 'Facultad General'}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                La materia aparecerá directamente en el portal del docente seleccionado.
              </p>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTOR 3: DATOS DE LA ASIGNATURA                          */}
          {/* ========================================================= */}
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
              list="oferta-nombres-datalist"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. AUDITORIA IMPOSITIVA, CONTABILIDAD BASICA I, CALCULO I"
              className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                errors.nombre
                  ? 'border-red-400 focus:ring-red-400 focus:border-red-500 bg-red-50/20'
                  : 'border-[#DCE3EC] focus:ring-[#174EAF] focus:border-[#174EAF]'
              } focus:outline-none focus:ring-2 transition-all`}
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
                  list="oferta-siglas-datalist"
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value.toUpperCase())}
                  placeholder="Ej. CPA500, MAT101, INF210"
                  className={`w-full uppercase px-3.5 py-2.5 text-sm rounded-xl border ${
                    errors.sigla
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-500 bg-red-50/20'
                      : 'border-[#DCE3EC] focus:ring-[#174EAF] focus:border-[#174EAF]'
                  } focus:outline-none focus:ring-2 transition-all font-mono font-bold`}
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
                  onChange={(e) => setGrupo(e.target.value.toUpperCase())}
                  placeholder="Ej. B, HL, L, MI, SA, SB"
                  className={`w-full uppercase px-3.5 py-2.5 text-sm rounded-xl border ${
                    errors.grupo
                      ? 'border-red-400 focus:ring-red-400 focus:border-red-500 bg-red-50/20'
                      : 'border-[#DCE3EC] focus:ring-[#174EAF] focus:border-[#174EAF]'
                  } focus:outline-none focus:ring-2 transition-all font-bold`}
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

          {/* Semestre y Año Académico */}
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
                  } focus:outline-none focus:ring-2 transition-all font-mono`}
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
            <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
              Modalidad Semanal <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Lun, Mié y Vie */}
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
                placeholder="Ej. 21410, Aula 236-04, Lab. Computación 2, Edif. 224"
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
