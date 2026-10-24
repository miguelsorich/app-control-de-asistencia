import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DocenteUsuario, OfertaAcademicaItem } from '../types';
import {
  X,
  UserPlus,
  Shield,
  Mail,
  Key,
  Phone,
  GraduationCap,
  AlertCircle,
  Search,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Building2,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

interface AdminAddDocenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDocente: (docente: DocenteUsuario) => void;
  existingDocentes: DocenteUsuario[];
  ofertaAcademica?: OfertaAcademicaItem[];
}

interface OfertaDocenteCandidate {
  codigo: string;
  nombre: string;
  carreras: string[];
  carreraPrincipal: string;
  materiasCount: number;
  materiasList: { sigla: string; grupo: string; nombre: string }[];
  alreadyRegistered: boolean;
}

export const AdminAddDocenteModal: React.FC<AdminAddDocenteModalProps> = ({
  isOpen,
  onClose,
  onSaveDocente,
  existingDocentes,
  ofertaAcademica = [],
}) => {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [codigoDocente, setCodigoDocente] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [carrera, setCarrera] = useState('Contaduría Pública');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Search & filter state from academic offer
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<OfertaDocenteCandidate | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSearchQuery('');
      setIsDropdownOpen(false);
      setSelectedCandidate(null);
    }
  }, [isOpen]);

  // Extract unique teachers from the academic offer catalog
  const candidatesFromOferta = useMemo(() => {
    if (!ofertaAcademica || ofertaAcademica.length === 0) return [];

    const map = new Map<string, OfertaDocenteCandidate>();

    ofertaAcademica.forEach((item) => {
      const nombre = (item.docenteAsignadoNombre || '').trim();
      const codigoRaw = (item.docenteAsignadoId || '').trim();
      const codigo = codigoRaw.startsWith('docente-')
        ? codigoRaw.replace('docente-', '')
        : codigoRaw;

      // Skip rows with neither name nor code
      if (!nombre && !codigo) return;

      const key = (codigo || nombre).toLowerCase();
      const carreraItem = (item.carrera || '').trim();
      const materiaItem = {
        sigla: item.sigla,
        grupo: item.grupo,
        nombre: item.nombre,
      };

      const existing = map.get(key);

      if (existing) {
        if (!existing.codigo && codigo) existing.codigo = codigo;
        if (!existing.nombre && nombre) existing.nombre = nombre;
        if (carreraItem && !existing.carreras.includes(carreraItem)) {
          existing.carreras.push(carreraItem);
        }
        existing.materiasList.push(materiaItem);
        existing.materiasCount += 1;
      } else {
        const alreadyRegistered = existingDocentes.some(
          (d) =>
            (codigo && d.codigoDocente.toLowerCase() === codigo.toLowerCase()) ||
            (nombre && d.nombreCompleto.toLowerCase() === nombre.toLowerCase())
        );

        map.set(key, {
          codigo: codigo || '',
          nombre: nombre || (codigo ? `Docente ${codigo}` : 'Docente'),
          carreras: carreraItem ? [carreraItem] : ['Facultad de Ciencias Contables'],
          carreraPrincipal: carreraItem || 'Contaduría Pública',
          materiasCount: 1,
          materiasList: [materiaItem],
          alreadyRegistered,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [ofertaAcademica, existingDocentes]);

  // Filter candidates based on search query
  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) {
      return candidatesFromOferta;
    }
    const term = searchQuery.toLowerCase().trim();
    return candidatesFromOferta.filter(
      (doc) =>
        doc.nombre.toLowerCase().includes(term) ||
        doc.codigo.toLowerCase().includes(term) ||
        doc.carreras.some((c) => c.toLowerCase().includes(term)) ||
        doc.materiasList.some(
          (m) =>
            m.sigla.toLowerCase().includes(term) ||
            m.nombre.toLowerCase().includes(term)
        )
    );
  }, [candidatesFromOferta, searchQuery]);

  if (!isOpen) return null;

  // Handle selecting a teacher from the offer catalog
  const handleSelectCandidate = (candidate: OfertaDocenteCandidate) => {
    setNombreCompleto(candidate.nombre);
    setCodigoDocente(candidate.codigo || '');
    // Contraseña inicial asignada: su mismo código o '123456' si no tiene código
    setContrasena(candidate.codigo || '123456');

    // Extraer carrera del maestro de oferta
    if (candidate.carreras.length > 0) {
      setCarrera(candidate.carreras[0]);
    }

    // Sugerencia de correo institucional si está vacío
    if (!correo && candidate.codigo) {
      setCorreo(`${candidate.codigo.toLowerCase()}@uagrm.edu.bo`);
    }

    setSelectedCandidate(candidate);
    setSearchQuery(`${candidate.nombre} (${candidate.codigo || 'S/C'})`);
    setIsDropdownOpen(false);
    setError(null);
  };

  const handleClearSelection = () => {
    setSelectedCandidate(null);
    setSearchQuery('');
    setNombreCompleto('');
    setCodigoDocente('');
    setContrasena('');
    setCorreo('');
    setTelefono('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNombre = nombreCompleto.trim();
    const cleanCodigo = codigoDocente.trim();
    const cleanCorreo = correo.trim().toLowerCase();
    const cleanPass = contrasena.trim();

    if (!cleanNombre) {
      setError('El nombre completo es requerido.');
      return;
    }
    if (!cleanCodigo) {
      setError('El usuario / código de docente es requerido.');
      return;
    }
    if (!cleanPass) {
      setError('Debe asignar una contraseña para el docente.');
      return;
    }

    // Check duplicate code in existing docentes
    const duplicateCode = existingDocentes.some(
      (d) => d.codigoDocente.toLowerCase() === cleanCodigo.toLowerCase()
    );
    if (duplicateCode) {
      setError(`Ya existe un docente registrado con el usuario o código "${cleanCodigo}".`);
      return;
    }

    const newDocente: DocenteUsuario = {
      id: `docente-${cleanCodigo || Date.now()}`,
      codigoDocente: cleanCodigo,
      nombreCompleto: cleanNombre,
      correo: cleanCorreo || `${cleanCodigo.toLowerCase()}@uagrm.edu.bo`,
      contrasena: cleanPass,
      carrera: carrera.trim(),
      telefono: telefono.trim() || undefined,
      activo: true,
      fechaCreacion: Date.now(),
    };

    onSaveDocente(newDocente);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl max-h-[92vh] rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#172033] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Registrar Nuevo Docente</h3>
              <p className="text-xs text-slate-400">Crear credenciales de acceso para el profesor</p>
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

        {/* Form Body with Scroll */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* BUSCADOR Y FILTRADOR DE DOCENTES DESDE EL MAESTRO DE OFERTA ACADÉMICA */}
          <div
            ref={searchContainerRef}
            className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 border border-blue-200 rounded-2xl p-4 space-y-2.5 shadow-2xs"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#174EAF]" />
                <span className="text-xs font-bold text-slate-800">
                  Buscar en el Maestro de Oferta Académica
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#174EAF] bg-blue-100/80 border border-blue-200 px-2 py-0.5 rounded-full">
                {candidatesFromOferta.length} docentes en catálogo
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Filtra o busca por <strong>Nombre</strong> o <strong>Código Docente</strong>. Al seleccionar uno, se extraerán automáticamente sus datos de la Oferta Académica.
            </p>

            {/* Input de Búsqueda con Menú Desplegable */}
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Escribe el nombre o código (ej. 3000, AZOGUE, CPA...)"
                  className="w-full pl-9 pr-20 py-2.5 text-xs sm:text-sm bg-white border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#174EAF] font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsDropdownOpen(true);
                      }}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    title="Desplegar lista"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Menú Desplegable con Resultados */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {filteredCandidates.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No se encontraron docentes en la oferta que coincidan con &quot;{searchQuery}&quot;.
                    </div>
                  ) : (
                    filteredCandidates.map((cand) => (
                      <div
                        key={cand.codigo || cand.nombre}
                        onClick={() => handleSelectCandidate(cand)}
                        className={`p-3 hover:bg-blue-50/70 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                          selectedCandidate?.nombre === cand.nombre ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              {cand.nombre}
                            </span>
                            {cand.codigo && (
                              <span className="font-mono text-[10px] font-bold bg-[#174EAF] text-white px-1.5 py-0.2 rounded">
                                Cód: {cand.codigo}
                              </span>
                            )}
                            {cand.alreadyRegistered && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                                Ya registrado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{cand.carreraPrincipal}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-medium text-blue-700">
                              <BookOpen className="w-3 h-3" />
                              <span>
                                {cand.materiasCount} materia{cand.materiasCount > 1 ? 's' : ''} en Oferta
                              </span>
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold text-[#174EAF] hover:underline shrink-0">
                          Seleccionar →
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Aviso de docente seleccionado */}
            {selectedCandidate && (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Datos extraídos de Oferta: <strong>{selectedCandidate.nombre}</strong> (Cód. {selectedCandidate.codigo || 'S/C'}).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer ml-2 shrink-0"
                >
                  Limpiar / Cambiar
                </button>
              </div>
            )}
          </div>

          {/* Datalists para autocompletado en los campos nativos */}
          <datalist id="docentes-oferta-nombres-list">
            {candidatesFromOferta.map((cand) => (
              <option key={cand.nombre} value={cand.nombre}>
                {cand.codigo ? `Cód: ${cand.codigo} - ${cand.carreraPrincipal}` : cand.carreraPrincipal}
              </option>
            ))}
          </datalist>

          <datalist id="docentes-oferta-codigos-list">
            {candidatesFromOferta
              .filter((c) => c.codigo)
              .map((cand) => (
                <option key={cand.codigo} value={cand.codigo}>
                  {cand.nombre}
                </option>
              ))}
          </datalist>

          {/* NOMBRE COMPLETO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Nombre Completo del Docente *
              </label>
              {selectedCandidate && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Extraído de Oferta
                </span>
              )}
            </div>
            <input
              type="text"
              required
              list="docentes-oferta-nombres-list"
              value={nombreCompleto}
              onChange={(e) => {
                const val = e.target.value;
                setNombreCompleto(val);
                // Si el usuario elige exactamente un nombre del catálogo mediante el datalist
                const matched = candidatesFromOferta.find(
                  (c) => c.nombre.toLowerCase() === val.trim().toLowerCase()
                );
                if (matched) {
                  handleSelectCandidate(matched);
                }
              }}
              placeholder="Ej. AZOGUE ROMERO OSCAR o Lic. Carlos Mendoza Ramos"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            />
          </div>

          {/* CÓDIGO Y CONTRASEÑA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Usuario / Código Docente *
              </label>
              <input
                type="text"
                required
                list="docentes-oferta-codigos-list"
                value={codigoDocente}
                onChange={(e) => {
                  const val = e.target.value;
                  setCodigoDocente(val);
                  // Si el usuario introduce el código exactamente
                  const matched = candidatesFromOferta.find(
                    (c) => c.codigo.toLowerCase() === val.trim().toLowerCase()
                  );
                  if (matched && !nombreCompleto) {
                    handleSelectCandidate(matched);
                  }
                }}
                placeholder="Ej. 3000 o 6380"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF] font-mono"
              />
              <span className="text-[10px] text-slate-400">El docente usará esto para iniciar sesión</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Contraseña de Acceso *
              </label>
              <input
                type="text"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                placeholder="Ej. 3000 o 123456"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
              <span className="text-[10px] text-slate-400">Contraseña asignada al profesor</span>
            </div>
          </div>

          {/* CORREO Y CELULAR (LLENADOS A MANO) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Correo Electrónico
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Llenar a mano</span>
              </div>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@uagrm.edu.bo"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Teléfono / WhatsApp
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Llenar a mano</span>
              </div>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. 70852033"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
              />
            </div>
          </div>

          {/* CARRERA / ÁREA ACADÉMICA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Carrera / Área Académica *
              </label>
              <span className="text-[11px] font-semibold text-[#174EAF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Puedes escribirla a mano
              </span>
            </div>
            <input
              type="text"
              required
              list="carreras-docente-list"
              value={carrera}
              onChange={(e) => setCarrera(e.target.value)}
              placeholder="Escribe a mano la carrera (ej. Contaduría Pública, Auditoría, Finanzas...)"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
            />
            <datalist id="carreras-docente-list">
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
              <option value="Facultad de Ciencias Contables" />
            </datalist>

            {/* Sugerencias de carreras extraídas del docente o comunes */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-500 font-medium">Sugerencias:</span>
              {selectedCandidate && selectedCandidate.carreras.length > 0
                ? selectedCandidate.carreras.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCarrera(c)}
                      className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-[#174EAF] font-bold border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))
                : [
                    'Contaduría Pública',
                    'Auditoría Financiera',
                    'Ingeniería Financiera',
                    'Adm. de Empresas',
                    'Ing. Sistemas',
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCarrera(item)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-[#174EAF] transition-colors border border-slate-200 cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
            </div>
          </div>

          {/* Footer Buttons */}
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
              <UserPlus className="w-4 h-4" />
              <span>Guardar y Crear Docente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
