import React, { useState, useMemo } from 'react';
import {
  DocenteUsuario,
  OfertaAcademicaItem,
  Asignatura,
  Estudiante,
  RegistroAsistencia,
} from '../types';
import { AdminAddDocenteModal } from './AdminAddDocenteModal';
import { AdminEditDocenteModal } from './AdminEditDocenteModal';
import { AdminAddOfertaModal } from './AdminAddOfertaModal';
import { AdminImportOfertaModal } from './AdminImportOfertaModal';
import { AdminEditOfertaModal } from './AdminEditOfertaModal';
import { AdminChangeCredentialsModal, AdminCredentials } from './AdminChangeCredentialsModal';
import { AttendanceMarkingHistory } from './AttendanceMarkingHistory';
import {
  Shield,
  Users,
  BookOpen,
  BarChart3,
  LogOut,
  UserPlus,
  Plus,
  Search,
  Key,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  GraduationCap,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  ArrowRight,
  UserCheck,
  Pencil,
  Ban,
  Lock,
  Unlock,
  History,
} from 'lucide-react';

interface AdminPortalViewProps {
  docentes: DocenteUsuario[];
  onSaveDocente: (docente: DocenteUsuario) => void;
  onUpdateDocente: (docente: DocenteUsuario) => void;
  onDeleteDocente: (docenteId: string) => void;
  ofertaAcademica: OfertaAcademicaItem[];
  onSaveOfertaItem: (item: OfertaAcademicaItem) => void;
  onUpdateOfertaItem: (item: OfertaAcademicaItem) => void;
  onImportOfertaItems: (items: OfertaAcademicaItem[]) => void;
  onDeleteOfertaItem: (itemId: string) => void;
  onResetOfertaDefault: () => void;
  asignaturas: Asignatura[];
  estudiantes: Estudiante[];
  registrosAsistencia: RegistroAsistencia[];
  adminCredentials?: AdminCredentials;
  onUpdateAdminCredentials?: (creds: AdminCredentials) => void;
  onAssignOfertaToTeacher?: (ofertaId: string, docenteId: string) => void;
  onExitAdmin: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  docentes,
  onSaveDocente,
  onUpdateDocente,
  onDeleteDocente,
  ofertaAcademica,
  onSaveOfertaItem,
  onUpdateOfertaItem,
  onImportOfertaItems,
  onDeleteOfertaItem,
  onResetOfertaDefault,
  asignaturas,
  estudiantes,
  registrosAsistencia,
  adminCredentials = { username: 'admin', password: '0715' },
  onUpdateAdminCredentials,
  onAssignOfertaToTeacher,
  onExitAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'DOCENTES' | 'OFERTA' | 'SUPERVISION' | 'HISTORIAL'>('DOCENTES');

  // Search & Filters for Docentes
  const [searchDocente, setSearchDocente] = useState('');

  // Search & Filters for Oferta
  const [searchOferta, setSearchOferta] = useState('');
  const [filterOfertaCarrera, setFilterOfertaCarrera] = useState<string>('TODAS');

  // Modals state
  const [isAddDocenteOpen, setIsAddDocenteOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<DocenteUsuario | null>(null);
  const [isAddOfertaOpen, setIsAddOfertaOpen] = useState(false);
  const [isImportOfertaOpen, setIsImportOfertaOpen] = useState(false);
  const [editingOfertaItem, setEditingOfertaItem] = useState<OfertaAcademicaItem | null>(null);
  const [isChangeAdminPasswordOpen, setIsChangeAdminPasswordOpen] = useState(false);

  // Filtered Docentes
  const filteredDocentes = useMemo(() => {
    if (!searchDocente.trim()) return docentes;
    const term = searchDocente.toLowerCase();
    return docentes.filter(
      (d) =>
        d.nombreCompleto.toLowerCase().includes(term) ||
        d.codigoDocente.toLowerCase().includes(term) ||
        d.correo.toLowerCase().includes(term) ||
        (d.carrera || '').toLowerCase().includes(term)
    );
  }, [docentes, searchDocente]);

  // Unique carreras in offer
  const uniqueOfertaCarreras = useMemo(() => {
    const set = new Set<string>();
    ofertaAcademica.forEach((o) => {
      if (o.carrera) set.add(o.carrera);
    });
    return Array.from(set).sort();
  }, [ofertaAcademica]);

  // Filtered Oferta
  const filteredOferta = useMemo(() => {
    return ofertaAcademica.filter((item) => {
      if (filterOfertaCarrera !== 'TODAS' && item.carrera !== filterOfertaCarrera) {
        return false;
      }
      if (!searchOferta.trim()) return true;
      const term = searchOferta.toLowerCase();
      return (
        item.sigla.toLowerCase().includes(term) ||
        item.nombre.toLowerCase().includes(term) ||
        item.grupo.toLowerCase().includes(term) ||
        (item.carrera || '').toLowerCase().includes(term)
      );
    });
  }, [ofertaAcademica, searchOferta, filterOfertaCarrera]);

  // Map docente to count of assigned subjects
  const docenteSubjectsMap = useMemo(() => {
    const map = new Map<string, Asignatura[]>();
    asignaturas.forEach((a) => {
      if (a.docenteId) {
        const list = map.get(a.docenteId) || [];
        list.push(a);
        map.set(a.docenteId, list);
      }
    });
    return map;
  }, [asignaturas]);

  return (
    <div id="admin-portal-view" className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Banner / Bar */}
      <div className="bg-[#172033] rounded-2xl border border-slate-800 p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-2xs">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                Panel de Administrador Propietario
              </h1>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Gestión Propietaria</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Administración central de Docentes, Maestro de Oferta Académica y Supervisión Institucional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsChangeAdminPasswordOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-amber-400/30 cursor-pointer shadow-xs"
            title="Cambiar contraseña y usuario del Administrador"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Cambiar Clave Admin</span>
          </button>

          <button
            type="button"
            onClick={onExitAdmin}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-slate-700 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Salir de Modo Administrador</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('DOCENTES')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'DOCENTES'
              ? 'bg-[#174EAF] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gestión de Docentes ({docentes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('OFERTA')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'OFERTA'
              ? 'bg-[#174EAF] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Maestro de Oferta Académica ({ofertaAcademica.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SUPERVISION')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'SUPERVISION'
              ? 'bg-[#174EAF] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Supervisión General</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('HISTORIAL')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'HISTORIAL'
              ? 'bg-[#174EAF] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial de Marcaciones ({registrosAsistencia.length})</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: GESTIÓN DE DOCENTES */}
      {/* ==================================================== */}
      {activeTab === 'DOCENTES' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Action bar and metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold">Total Docentes Registrados</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{docentes.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold">Docentes Activos</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {docentes.filter((d) => d.activo).length}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold">Materias Asignadas en Total</span>
              <p className="text-2xl font-black text-[#174EAF] mt-1">{asignaturas.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchDocente}
                  onChange={(e) => setSearchDocente(e.target.value)}
                  placeholder="Buscar docente por nombre, usuario o correo..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddDocenteOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#174EAF] hover:bg-[#103B88] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Crear Nuevo Docente</span>
              </button>
            </div>

            {/* Docentes Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5">Docente</th>
                    <th className="py-3 px-3.5">Usuario / Código</th>
                    <th className="py-3 px-3.5">Contraseña</th>
                    <th className="py-3 px-3.5">Carrera / Área</th>
                    <th className="py-3 px-3.5 text-center">Materias</th>
                    <th className="py-3 px-3.5 text-center">Estado</th>
                    <th className="py-3 px-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocentes.map((doc) => {
                    const docSubjects = docenteSubjectsMap.get(doc.id) || [];
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#174EAF] font-bold flex items-center justify-center shrink-0">
                              {doc.nombreCompleto.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{doc.nombreCompleto}</p>
                              <p className="text-[11px] text-slate-500">{doc.correo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {doc.codigoDocente}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-mono text-slate-600 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                            {doc.contrasena}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600">
                          {doc.carrera || 'Facultad General'}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#174EAF] border border-blue-200">
                            {docSubjects.length} {docSubjects.length === 1 ? 'materia' : 'materias'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = !doc.activo;
                              onUpdateDocente({ ...doc, activo: newStatus });
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border shadow-2xs hover:scale-102"
                            title={doc.activo ? 'Clic para bloquear/inactivar docente' : 'Clic para activar/habilitar docente'}
                          >
                            {doc.activo ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Activo (Habilitado)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50">
                                <Ban className="w-3.5 h-3.5 text-rose-600" />
                                <span>Inactivo (Bloqueado)</span>
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3.5 text-right space-x-1 whitespace-nowrap">
                          {/* Botón rápido de bloqueo/desbloqueo */}
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = !doc.activo;
                              onUpdateDocente({ ...doc, activo: newStatus });
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              doc.activo
                                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={doc.activo ? 'Bloquear uso (inactivar)' : 'Desbloquear uso (activar)'}
                          >
                            {doc.activo ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingDocente(doc)}
                            className="p-1.5 text-slate-500 hover:text-[#174EAF] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar credenciales, usuario o contraseña"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Estás seguro de eliminar al docente "${doc.nombreCompleto}"? Esta acción borrará sus credenciales.`)) {
                                onDeleteDocente(doc.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar docente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredDocentes.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                        No se encontraron docentes con ese criterio de búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: MAESTRO DE OFERTA ACADÉMICA */}
      {/* ==================================================== */}
      {activeTab === 'OFERTA' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Catálogo Maestro de Oferta Académica
                </h3>
                <p className="text-xs text-slate-500">
                  Asignaturas disponibles para que los docentes las busquen y seleccionen en sus portales
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={onResetOfertaDefault}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  title="Cargar catálogo modelo de la facultad con 12 asignaturas oficiales"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Oferta Modelo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsImportOfertaOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Importar Excel / CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddOfertaOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#174EAF] hover:bg-[#103B88] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar a la Oferta</span>
                </button>
              </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchOferta}
                  onChange={(e) => setSearchOferta(e.target.value)}
                  placeholder="Buscar en oferta por sigla, nombre o grupo..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={filterOfertaCarrera}
                  onChange={(e) => setFilterOfertaCarrera(e.target.value)}
                  className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF]"
                >
                  <option value="TODAS">Todas las Carreras</option>
                  {uniqueOfertaCarreras.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Oferta Table matching official UAGRM model */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5">Sigla</th>
                    <th className="py-3 px-2 text-center">Grp</th>
                    <th className="py-3 px-2.5 text-center">C_Of / Insc</th>
                    <th className="py-3 px-3.5">Nombre de la Materia</th>
                    <th className="py-3 px-2 text-center">NSA</th>
                    <th className="py-3 px-3.5">Carreras</th>
                    <th className="py-3 px-3.5">Docente (Cod. / Nombre)</th>
                    <th className="py-3 px-3.5">Días & Horario</th>
                    <th className="py-3 px-2.5 text-center">Aula</th>
                    <th className="py-3 px-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOferta.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5 font-bold font-mono text-[#174EAF]">
                        <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                          {item.sigla}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-800">
                        {item.grupo}
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono text-[11px] text-slate-600">
                        {item.cupoOfertado !== undefined ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700">
                            {item.cupoOfertado} / {item.inscritos ?? 0}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-900 max-w-[220px] truncate" title={item.nombre}>
                        {item.nombre}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-700 font-mono">
                        {item.nsa ?? item.semestre}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 text-[11px] max-w-[160px] truncate" title={item.carrera}>
                        {item.carrera || 'Facultad General'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 text-[11px]">
                        {item.docenteAsignadoNombre ? (
                          <div>
                            <span className="font-semibold">{item.docenteAsignadoNombre}</span>
                            {item.docenteAsignadoId && (
                              <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                                ({item.docenteAsignadoId})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-800">
                            {item.diasTexto ||
                              (item.modalidad === 'LUN_MIE_VIE'
                                ? 'Lun, Mié, Vie'
                                : item.modalidad === 'MAR_JUE'
                                ? 'Mar, Jue'
                                : 'Sábado')}
                          </span>
                          <span className="text-slate-400 mx-1">•</span>
                          <span className="font-mono">
                            {item.horarioTexto || `${item.horaInicio} - ${item.horaFin}`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono font-bold text-slate-800 text-[11px]">
                        {item.aula || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingOfertaItem(item)}
                          className="p-1.5 text-slate-500 hover:text-[#174EAF] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Modificar datos de la asignatura en oferta"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar la materia ${item.sigla} (${item.nombre}) de la oferta?`)) {
                              onDeleteOfertaItem(item.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar de la oferta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOferta.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-slate-400 italic">
                        No hay asignaturas en el catálogo con ese filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: SUPERVISIÓN GENERAL */}
      {/* ==================================================== */}
      {activeTab === 'SUPERVISION' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Docentes</span>
              <p className="text-3xl font-black text-slate-900 mt-2">{docentes.length}</p>
              <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
                {docentes.filter((d) => d.activo).length} habilitados en el sistema
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Asignaturas Activas</span>
              <p className="text-3xl font-black text-[#174EAF] mt-2">{asignaturas.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Materias en curso</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estudiantes Inscritos</span>
              <p className="text-3xl font-black text-slate-900 mt-2">{estudiantes.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">En todas las materias</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Asistencias Marcadas</span>
              <p className="text-3xl font-black text-emerald-600 mt-2">{registrosAsistencia.length}</p>
              <p className="text-[11px] text-slate-500 mt-1">Historial total registrado</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Distribución Global de Asignaturas y Docentes
            </h3>
            <p className="text-xs text-slate-500">
              Listado consolidado de materias dictadas actualmente en el sistema
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5">Materia</th>
                    <th className="py-3 px-3.5">Grupo</th>
                    <th className="py-3 px-3.5">Semestre</th>
                    <th className="py-3 px-3.5">Modalidad</th>
                    <th className="py-3 px-3.5">Docente Responsable</th>
                    <th className="py-3 px-3.5 text-center">Alumnos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asignaturas.map((asig) => {
                    const doc = docentes.find((d) => d.id === asig.docenteId);
                    const studentsCount = estudiantes.filter((e) => e.asignaturaId === asig.id).length;
                    return (
                      <tr key={asig.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3.5 font-bold text-slate-900">
                          <span className="text-[#174EAF] font-mono mr-2">{asig.sigla}</span>
                          {asig.nombre}
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-700">{asig.grupo}</td>
                        <td className="py-3 px-3.5 text-slate-600">{asig.semestre}° Semestre</td>
                        <td className="py-3 px-3.5 text-slate-600">
                          {asig.modalidad === 'LUN_MIE_VIE'
                            ? 'Lun-Mié-Vie'
                            : asig.modalidad === 'MAR_JUE'
                            ? 'Mar-Jue'
                            : 'Sábado'}
                        </td>
                        <td className="py-3 px-3.5 font-semibold text-slate-800">
                          {doc ? doc.nombreCompleto : (asig.docenteNombre || 'Lic. Miguel Antonio Sorich Rojas')}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#174EAF] font-bold text-[11px]">
                            {studentsCount}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: HISTORIAL DE MARCACIONES (EXCLUSIVO ADMINISTRADOR) */}
      {/* ==================================================== */}
      {activeTab === 'HISTORIAL' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Historial y Auditoría Global de Marcaciones
              </h2>
              <p className="text-xs text-slate-500">
                Supervisión institucional centralizada de marcaciones, control de duplicados y asistencia en vivo en toda la Facultad
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-[#174EAF] border border-blue-200 self-start sm:self-auto">
              Total Registros Globales: <strong>{registrosAsistencia.length}</strong>
            </div>
          </div>

          <AttendanceMarkingHistory
            asignaturas={asignaturas}
            estudiantes={estudiantes}
            registrosAsistencia={registrosAsistencia}
            isAdmin={true}
          />
        </div>
      )}

      {/* Modals */}
      <AdminAddDocenteModal
        isOpen={isAddDocenteOpen}
        onClose={() => setIsAddDocenteOpen(false)}
        onSaveDocente={onSaveDocente}
        existingDocentes={docentes}
      />

      <AdminEditDocenteModal
        isOpen={!!editingDocente}
        onClose={() => setEditingDocente(null)}
        docente={editingDocente}
        onUpdateDocente={onUpdateDocente}
      />

      <AdminAddOfertaModal
        isOpen={isAddOfertaOpen}
        onClose={() => setIsAddOfertaOpen(false)}
        onSaveOfertaItem={onSaveOfertaItem}
      />

      <AdminEditOfertaModal
        isOpen={!!editingOfertaItem}
        onClose={() => setEditingOfertaItem(null)}
        item={editingOfertaItem}
        onUpdateOfertaItem={onUpdateOfertaItem}
      />

      <AdminImportOfertaModal
        isOpen={isImportOfertaOpen}
        onClose={() => setIsImportOfertaOpen(false)}
        onImportComplete={onImportOfertaItems}
      />

      {onUpdateAdminCredentials && (
        <AdminChangeCredentialsModal
          isOpen={isChangeAdminPasswordOpen}
          onClose={() => setIsChangeAdminPasswordOpen(false)}
          currentCredentials={adminCredentials}
          onSaveCredentials={onUpdateAdminCredentials}
        />
      )}
    </div>
  );
};
