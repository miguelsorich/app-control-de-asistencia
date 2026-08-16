import React, { useState, useMemo } from 'react';
import {
  Asignatura,
  Estudiante,
  RegistroAsistencia,
  SesionHabilitacion,
  NotaEstudiante,
  MODALIDADES,
} from '../types';
import { formatTimeRange } from '../utils/timeHelpers';
import { AttendanceEnablementManager } from './AttendanceEnablementManager';
import { AttendanceReportsView } from './AttendanceReportsView';
import { SubjectGradesView } from './SubjectGradesView';
import { SubjectStudentsView } from './SubjectStudentsView';
import {
  GraduationCap,
  LayoutGrid,
  Users,
  Timer,
  FileSpreadsheet,
  BookOpen,
  ArrowLeft,
  LogOut,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  AlertCircle,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface TeacherPortalViewProps {
  asignaturas: Asignatura[];
  estudiantes: Estudiante[];
  registrosAsistencia: RegistroAsistencia[];
  sesionesHabilitacion: Record<string, SesionHabilitacion>;
  notas: NotaEstudiante[];
  onOpenAddSubjectModal: () => void;
  onEditSubject: (asig: Asignatura) => void;
  onDeleteSubject: (id: string, nombre: string) => void;
  onOpenImportModalForSubject: (asig: Asignatura) => void;
  onDeleteStudent: (studentId: string, studentName: string) => void;
  onHabilitarAsistencia: (asignaturaId: string, duracionMinutos: number) => void;
  onCerrarAsistencia: (asignaturaId: string) => void;
  onSaveGrades: (updatedGrades: NotaEstudiante[]) => void;
  onVolverPrincipal?: () => void;
  onLogoutToMain?: () => void;
}

export type DocenteSection =
  | 'DASHBOARD'
  | 'ASIGNATURAS'
  | 'ESTUDIANTES'
  | 'HABILITACION'
  | 'REPORTES'
  | 'NOTAS';

export const TeacherPortalView: React.FC<TeacherPortalViewProps> = ({
  asignaturas,
  estudiantes,
  registrosAsistencia,
  sesionesHabilitacion,
  notas,
  onOpenAddSubjectModal,
  onEditSubject,
  onDeleteSubject,
  onOpenImportModalForSubject,
  onDeleteStudent,
  onHabilitarAsistencia,
  onCerrarAsistencia,
  onSaveGrades,
  onVolverPrincipal,
  onLogoutToMain,
}) => {
  // ==========================================
  // MÓDULO 9: AUTENTICACIÓN DEL DOCENTE
  // ==========================================
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(false);
  const [usuarioInput, setUsuarioInput] = useState('');
  const [contrasenaInput, setContrasenaInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active section inside the Teacher Portal
  const [activeSection, setActiveSection] = useState<DocenteSection>('DASHBOARD');

  // Sub-states for specific sections
  const [selectedSubjectForStudentsId, setSelectedSubjectForStudentsId] = useState<string | null>(null);
  const [searchTermAsignaturas, setSearchTermAsignaturas] = useState('');
  const [selectedModalidadFilter, setSelectedModalidadFilter] = useState<string>('TODAS');

  // Login handler
  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUser = usuarioInput.trim();
    const cleanPass = contrasenaInput.trim();

    // Valid credentials:
    // Usuario: 6379
    // Contraseña: 6379
    if (cleanUser === '6379' && cleanPass === '6379') {
      setIsTeacherAuthenticated(true);
      setUsuarioInput('');
      setContrasenaInput('');
      setLoginError(null);
      setActiveSection('DASHBOARD');
    } else {
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  // Logout handler
  const handleTeacherLogout = () => {
    setIsTeacherAuthenticated(false);
    setUsuarioInput('');
    setContrasenaInput('');
    setLoginError(null);
    setActiveSection('DASHBOARD');
    setSelectedSubjectForStudentsId(null);
    if (onLogoutToMain) {
      onLogoutToMain();
    }
  };

  // Filtered subjects for Section 1 (Gestión de Asignaturas)
  const filteredAsignaturas = useMemo(() => {
    return asignaturas.filter((asig) => {
      const term = searchTermAsignaturas.toLowerCase();
      const semStr = `semestre ${asig.semestre || 1}`;
      const anioStr = String(asig.año || 2026);
      const matchesSearch =
        asig.nombre.toLowerCase().includes(term) ||
        asig.sigla.toLowerCase().includes(term) ||
        asig.grupo.toLowerCase().includes(term) ||
        semStr.includes(term) ||
        anioStr.includes(term);

      const matchesModalidad =
        selectedModalidadFilter === 'TODAS' || asig.modalidad === selectedModalidadFilter;

      return matchesSearch && matchesModalidad;
    });
  }, [asignaturas, searchTermAsignaturas, selectedModalidadFilter]);

  // Selected subject for Students section
  const selectedSubjectForStudents = useMemo(() => {
    if (!selectedSubjectForStudentsId) return null;
    return asignaturas.find((a) => a.id === selectedSubjectForStudentsId) || null;
  }, [asignaturas, selectedSubjectForStudentsId]);

  const studentsOfSelectedSubject = useMemo(() => {
    if (!selectedSubjectForStudents) return [];
    return estudiantes.filter((e) => e.asignaturaId === selectedSubjectForStudents.id);
  }, [estudiantes, selectedSubjectForStudents]);

  // Modalidad counts
  const countLunMieVie = asignaturas.filter((a) => a.modalidad === 'LUN_MIE_VIE').length;
  const countMarJue = asignaturas.filter((a) => a.modalidad === 'MAR_JUE').length;
  const countSabado = asignaturas.filter((a) => a.modalidad === 'SABADO').length;

  // ==========================================
  // VIEW 1: ACCESO DOCENTE (LOGIN)
  // ==========================================
  if (!isTeacherAuthenticated) {
    return (
      <div id="teacher-login-view" className="max-w-md mx-auto py-6 sm:py-10 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-6 sm:p-8 space-y-6">
          {/* Official Logos Header */}
          <div className="flex items-center justify-center gap-3 pb-2 border-b border-[#DCE3EC]">
            <img
              src="/logo_digital_academy.png"
              alt="Digital Academy"
              className="h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="h-9 w-px bg-[#DCE3EC]" />
            <img
              src="/logo_facultad.png"
              alt="Facultad de Ciencias Contables UAGRM"
              className="h-12 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Title & Teacher Info */}
          <div className="text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              Acceso Docente
            </h1>
            <p className="text-xs font-semibold text-[#174EAF]">
              Sistema de Control de Asistencia — UAGRM
            </p>
            <p className="text-[11px] text-[#667085]">
              Docente: <strong>Miguel Antonio Sorich Rojas</strong> (Código: 6379)
            </p>
          </div>

          {/* Formulario de Acceso */}
          <form onSubmit={handleTeacherLogin} className="space-y-4">
            <div>
              <label
                htmlFor="input-teacher-usuario"
                className="block text-xs font-bold text-[#172033] mb-1.5 uppercase tracking-wider"
              >
                Usuario
              </label>
              <input
                id="input-teacher-usuario"
                type="text"
                autoFocus
                value={usuarioInput}
                onChange={(e) => {
                  setUsuarioInput(e.target.value);
                  if (loginError) setLoginError(null);
                }}
                placeholder="Código docente"
                className="w-full px-4 py-2.5 text-sm font-mono font-medium rounded-xl border border-[#DCE3EC] focus:outline-none focus:ring-2 focus:ring-[#174EAF] focus:border-[#174EAF] bg-white text-[#172033] placeholder:font-sans placeholder:text-[#667085]"
              />
            </div>

            <div>
              <label
                htmlFor="input-teacher-contrasena"
                className="block text-xs font-bold text-[#172033] mb-1.5 uppercase tracking-wider"
              >
                Contraseña
              </label>
              <input
                id="input-teacher-contrasena"
                type="password"
                value={contrasenaInput}
                onChange={(e) => {
                  setContrasenaInput(e.target.value);
                  if (loginError) setLoginError(null);
                }}
                placeholder="Contraseña"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[#DCE3EC] focus:outline-none focus:ring-2 focus:ring-[#174EAF] focus:border-[#174EAF] bg-white text-[#172033] placeholder:text-[#667085]"
              />
            </div>

            {/* Error banner */}
            {loginError && (
              <div
                id="teacher-login-error"
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="font-medium">{loginError}</span>
              </div>
            )}

            <button
              id="btn-teacher-ingresar"
              type="submit"
              className="w-full py-3 px-4 bg-[#174EAF] hover:bg-[#103B88] text-white font-bold text-sm rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#174EAF] focus:ring-offset-2 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Ingresar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Volver a la pantalla principal de acceso */}
          {onVolverPrincipal && (
            <div className="pt-2 border-t border-[#DCE3EC] text-center">
              <button
                id="btn-teacher-volver-principal"
                type="button"
                onClick={onVolverPrincipal}
                className="text-xs font-semibold text-[#174EAF] hover:text-[#103B88] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a la pantalla principal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // HEADER DEL PORTAL DOCENTE
  // ==========================================
  const renderTeacherPortalHeader = (sectionTitle?: string) => (
    <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Profile photo and Teacher Identification */}
        <div className="flex items-center gap-4">
          <img
            src="/docente_miguel.jpeg"
            alt="Docente Miguel Antonio Sorich Rojas"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#174EAF]/30 shadow-xs flex-shrink-0"
            referrerPolicy="no-referrer"
          />

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC]">
                Portal Docente
              </span>
              {sectionTitle && (
                <span className="bg-[#F5F7FA] text-[#172033] border border-[#DCE3EC] text-xs font-bold px-2 py-0.5 rounded">
                  {sectionTitle}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-[#172033]">
              Miguel Antonio Sorich Rojas
            </h2>

            <div className="flex items-center gap-3 text-xs text-[#667085] flex-wrap">
              <span className="font-mono bg-[#E8F0FC] px-2 py-0.5 rounded text-[#174EAF] font-bold border border-[#DCE3EC]">
                Código docente: <strong>6379</strong>
              </span>
              <span>•</span>
              <span className="text-[#667085]">Docente Titular / Administrador</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeSection !== 'DASHBOARD' && (
            <button
              id="btn-nav-volver-dashboard-docente"
              type="button"
              onClick={() => {
                setActiveSection('DASHBOARD');
                setSelectedSubjectForStudentsId(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#174EAF] hover:text-[#103B88] bg-[#E8F0FC] hover:bg-blue-100 border border-[#DCE3EC] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Portal Docente</span>
            </button>
          )}

          <button
            id="btn-teacher-cerrar-sesion"
            type="button"
            onClick={handleTeacherLogout}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#174EAF] hover:text-[#103B88] bg-white hover:bg-[#E8F0FC] border border-[#174EAF] px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            title="Cerrar sesión del docente"
          >
            <LogOut className="w-3.5 h-3.5 text-[#174EAF]" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // VIEW 2: DASHBOARD DOCENTE (5 TARJETAS PRINCIPALES)
  // ==========================================
  if (activeSection === 'DASHBOARD') {
    return (
      <div id="teacher-portal-dashboard" className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Top Header */}
        {renderTeacherPortalHeader()}

        {/* Resumen Académico Rápido */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#DCE3EC] shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Total Materias
              </p>
              <p className="text-2xl font-black text-[#172033] mt-1">
                {asignaturas.length}
              </p>
              <p className="text-[11px] text-[#667085]">Registradas</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#DCE3EC] shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Lun, Mié y Vie
              </p>
              <p className="text-2xl font-black text-[#174EAF] mt-1">
                {countLunMieVie}
              </p>
              <p className="text-[11px] text-[#667085]">1h 30m / clase</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#DCE3EC] shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Martes y Jueves
              </p>
              <p className="text-2xl font-black text-[#174EAF] mt-1">
                {countMarJue}
              </p>
              <p className="text-[11px] text-[#667085]">2h 15m / clase</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#DCE3EC] shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Sábados
              </p>
              <p className="text-2xl font-black text-[#174EAF] mt-1">
                {countSabado}
              </p>
              <p className="text-[11px] text-[#667085]">07:00 a 11:30</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 5 TARJETAS PRINCIPALES DEL PORTAL DOCENTE */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
            Funciones Administrativas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. GESTIÓN DE ASIGNATURAS */}
            <div
              id="card-teacher-gestion-asignaturas"
              onClick={() => setActiveSection('ASIGNATURAS')}
              className="bg-white rounded-2xl border border-[#DCE3EC] hover:border-[#174EAF] hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] group-hover:bg-[#174EAF] group-hover:text-white transition-colors flex items-center justify-center shadow-2xs">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#172033] group-hover:text-[#174EAF] transition-colors">
                    1. Gestión de asignaturas
                  </h4>
                  <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                    Crear, visualizar y consultar asignaturas con su nombre, sigla, grupo, modalidad (L-M-V, M-J, Sábados) y horarios.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#DCE3EC] flex items-center justify-between text-xs font-bold text-[#174EAF]">
                <span>Administrar materias</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 2. ESTUDIANTES */}
            <div
              id="card-teacher-estudiantes"
              onClick={() => setActiveSection('ESTUDIANTES')}
              className="bg-white rounded-2xl border border-[#DCE3EC] hover:border-[#174EAF] hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] group-hover:bg-[#174EAF] group-hover:text-white transition-colors flex items-center justify-center shadow-2xs">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#172033] group-hover:text-[#174EAF] transition-colors">
                    2. Estudiantes
                  </h4>
                  <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                    Seleccionar una asignatura, importar nómina mediante Excel/CSV y visualizar la lista con RU, Nombre Completo y Correo.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#DCE3EC] flex items-center justify-between text-xs font-bold text-[#174EAF]">
                <span>Gestionar listas</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 3. HABILITAR ASISTENCIA */}
            <div
              id="card-teacher-habilitar-asistencia"
              onClick={() => setActiveSection('HABILITACION')}
              className="bg-white rounded-2xl border border-[#DCE3EC] hover:border-[#174EAF] hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] group-hover:bg-[#174EAF] group-hover:text-white transition-colors flex items-center justify-center shadow-2xs">
                  <Timer className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#172033] group-hover:text-[#174EAF] transition-colors">
                    3. Habilitar asistencia
                  </h4>
                  <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                    Habilitar asistencia de clase, definir tiempo de validez, consultar estado (habilitada/cerrada) y cierre manual.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#DCE3EC] flex items-center justify-between text-xs font-bold text-[#174EAF]">
                <span>Controlar sesiones</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 4. REPORTES DE ASISTENCIA */}
            <div
              id="card-teacher-reportes-asistencia"
              onClick={() => setActiveSection('REPORTES')}
              className="bg-white rounded-2xl border border-[#DCE3EC] hover:border-[#174EAF] hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] group-hover:bg-[#174EAF] group-hover:text-white transition-colors flex items-center justify-center shadow-2xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#172033] group-hover:text-[#174EAF] transition-colors">
                    4. Reportes de asistencia
                  </h4>
                  <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                    Consultar asistencias por fecha (Presente: 1, Ausente: 0), total sumatoria y exportar reportes en Excel o CSV.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#DCE3EC] flex items-center justify-between text-xs font-bold text-[#174EAF]">
                <span>Ver y exportar reportes</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 5. IMPORTACIÓN DE NOTAS */}
            <div
              id="card-teacher-importacion-notas"
              onClick={() => setActiveSection('NOTAS')}
              className="bg-white rounded-2xl border border-[#DCE3EC] hover:border-[#174EAF] hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group md:col-span-2 lg:col-span-1"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] group-hover:bg-[#174EAF] group-hover:text-white transition-colors flex items-center justify-center shadow-2xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#172033] group-hover:text-[#174EAF] transition-colors">
                    5. Importación de notas
                  </h4>
                  <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                    Importar archivo Excel con Registro, Nombre, Primer Parcial, Segundo Parcial, Examen Final y Nota Final oficial.
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-[#DCE3EC] flex items-center justify-between text-xs font-bold text-[#174EAF]">
                <span>Importar calificaciones</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SECTION 1: GESTIÓN DE ASIGNATURAS (MÓDULO 1)
  // ==========================================
  if (activeSection === 'ASIGNATURAS') {
    return (
      <div id="teacher-section-asignaturas" className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
        {renderTeacherPortalHeader('1. Gestión de asignaturas')}

        {/* Toolbar & Filters */}
        <div className="bg-white p-4 rounded-xl border border-[#DCE3EC] shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#174EAF]" />
              <h3 className="text-sm font-bold text-[#172033]">
                Lista de Asignaturas
              </h3>
              <span className="text-xs font-bold bg-[#E8F0FC] text-[#174EAF] px-2.5 py-0.5 rounded-full">
                {filteredAsignaturas.length}
              </span>
            </div>

            <button
              id="btn-crear-asignatura-desde-seccion"
              type="button"
              onClick={onOpenAddSubjectModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#174EAF] hover:bg-[#103B88] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Asignatura</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-[#DCE3EC]">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#667085]" />
              <input
                type="text"
                value={searchTermAsignaturas}
                onChange={(e) => setSearchTermAsignaturas(e.target.value)}
                placeholder="Buscar por materia, sigla o grupo..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#DCE3EC] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#174EAF] text-[#172033]"
              />
            </div>

            {/* Modalidad Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#667085]" />
              <select
                value={selectedModalidadFilter}
                onChange={(e) => setSelectedModalidadFilter(e.target.value)}
                className="text-xs bg-white border border-[#DCE3EC] rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-[#174EAF] font-medium text-[#172033]"
              >
                <option value="TODAS">Todas las modalidades</option>
                <option value="LUN_MIE_VIE">Lunes, Miércoles y Viernes</option>
                <option value="MAR_JUE">Martes y Jueves</option>
                <option value="SABADO">Sábados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        {filteredAsignaturas.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DCE3EC] p-8 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-[#667085]/40 mx-auto" />
            <p className="text-sm font-bold text-[#172033]">No se encontraron asignaturas</p>
            <p className="text-xs text-[#667085]">
              Intente con otro término de búsqueda o cree una nueva asignatura.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAsignaturas.map((asig) => {
              const enrolledCount = estudiantes.filter((e) => e.asignaturaId === asig.id).length;
              const modConfig = MODALIDADES[asig.modalidad] || MODALIDADES.LUN_MIE_VIE;

              return (
                <div
                  key={asig.id}
                  id={`subject-card-${asig.id}`}
                  className="bg-white rounded-xl border border-[#DCE3EC] hover:border-[#174EAF] p-5 shadow-2xs hover:shadow-xs transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#174EAF] text-white text-xs font-mono font-bold px-2 py-0.5 rounded">
                          {asig.sigla}
                        </span>
                        <span className="bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC] text-xs font-bold px-2 py-0.5 rounded">
                          Grupo {asig.grupo}
                        </span>
                      </div>
                      <span className="bg-[#F5F7FA] text-[#172033] border border-[#DCE3EC] text-[11px] font-semibold px-2 py-0.5 rounded">
                        Semestre {asig.semestre || 1} · {asig.año || 2026}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-[#172033] text-sm leading-snug">
                        {asig.nombre}
                      </h4>
                      {asig.aula && (
                        <p className="text-[11px] text-[#667085] mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#667085]" />
                          <span>{asig.aula}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-[#667085] space-y-1 pt-1 border-t border-[#DCE3EC]">
                      <div className="flex items-center gap-1.5 font-medium text-[#172033]">
                        <Calendar className="w-3.5 h-3.5 text-[#174EAF]" />
                        <span>{modConfig.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[#667085]">
                        <Clock className="w-3.5 h-3.5 text-[#667085]" />
                        <span>{formatTimeRange(asig.horaInicio, asig.horaFin)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#667085] pt-0.5">
                        <Users className="w-3.5 h-3.5 text-[#667085]" />
                        <span>{enrolledCount} estudiantes inscritos</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#DCE3EC] gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubjectForStudentsId(asig.id);
                        setActiveSection('ESTUDIANTES');
                      }}
                      className="text-xs font-bold text-[#174EAF] hover:text-[#103B88] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Ver Estudiantes</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditSubject(asig)}
                        className="p-1.5 text-[#667085] hover:text-[#174EAF] hover:bg-[#E8F0FC] rounded-lg transition-colors cursor-pointer"
                        title="Editar asignatura"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSubject(asig.id, asig.nombre)}
                        className="p-1.5 text-[#667085] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar asignatura"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // SECTION 2: ESTUDIANTES (MÓDULO 2)
  // ==========================================
  if (activeSection === 'ESTUDIANTES') {
    if (selectedSubjectForStudents) {
      return (
        <div id="teacher-section-estudiantes-selected" className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
          {renderTeacherPortalHeader('2. Estudiantes')}

          <SubjectStudentsView
            asignatura={selectedSubjectForStudents}
            estudiantes={studentsOfSelectedSubject}
            onBackToSubjects={() => setSelectedSubjectForStudentsId(null)}
            onOpenImportModal={() => onOpenImportModalForSubject(selectedSubjectForStudents)}
            onDeleteStudent={onDeleteStudent}
          />
        </div>
      );
    }

    return (
      <div id="teacher-section-estudiantes-select" className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
        {renderTeacherPortalHeader('2. Estudiantes')}

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#DCE3EC] shadow-sm space-y-5">
          <div className="border-b border-[#DCE3EC] pb-3">
            <h3 className="text-base font-bold text-[#172033]">
              Seleccionar Asignatura para Gestionar Estudiantes
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Haga clic sobre una materia para ver su lista de estudiantes o importar la nómina oficial mediante Excel o CSV.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {asignaturas.map((asig) => {
              const enrolled = estudiantes.filter((e) => e.asignaturaId === asig.id).length;
              return (
                <div
                  key={asig.id}
                  onClick={() => setSelectedSubjectForStudentsId(asig.id)}
                  className="bg-white hover:bg-[#E8F0FC]/40 border border-[#DCE3EC] hover:border-[#174EAF] rounded-xl p-4 cursor-pointer transition-all space-y-2 group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs bg-[#174EAF] text-white px-2 py-0.5 rounded">
                        {asig.sigla}
                      </span>
                      <span className="text-xs font-bold text-[#172033] bg-[#E8F0FC] border border-[#DCE3EC] px-2 py-0.5 rounded">
                        Gr. {asig.grupo}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#667085] bg-[#F5F7FA] border border-[#DCE3EC] px-2 py-0.5 rounded">
                      Sem. {asig.semestre || 1}/{asig.año || 2026}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#172033] group-hover:text-[#174EAF] transition-colors">
                    {asig.nombre}
                  </h4>
                  <div className="flex items-center justify-between pt-2 border-t border-[#DCE3EC] text-xs">
                    <span className="text-[#667085] font-medium">{enrolled} estudiantes</span>
                    <span className="font-bold text-[#174EAF] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Ver lista</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // SECTION 3: HABILITAR ASISTENCIA (MÓDULO 4)
  // ==========================================
  if (activeSection === 'HABILITACION') {
    return (
      <div id="teacher-section-habilitacion" className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
        {renderTeacherPortalHeader('3. Habilitar asistencia')}

        <AttendanceEnablementManager
          asignaturas={asignaturas}
          estudiantes={estudiantes}
          registrosAsistencia={registrosAsistencia}
          sesionesHabilitacion={sesionesHabilitacion}
          onHabilitarAsistencia={onHabilitarAsistencia}
          onCerrarAsistencia={onCerrarAsistencia}
        />
      </div>
    );
  }

  // ==========================================
  // SECTION 4: REPORTES DE ASISTENCIA (MÓDULO 5)
  // ==========================================
  if (activeSection === 'REPORTES') {
    return (
      <div id="teacher-section-reportes" className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
        {renderTeacherPortalHeader('4. Reportes de asistencia')}

        <AttendanceReportsView
          asignaturas={asignaturas}
          estudiantes={estudiantes}
          registrosAsistencia={registrosAsistencia}
        />
      </div>
    );
  }

  // ==========================================
  // SECTION 5: IMPORTACIÓN DE NOTAS (MÓDULO 6)
  // ==========================================
  if (activeSection === 'NOTAS') {
    return (
      <div id="teacher-section-notas" className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
        {renderTeacherPortalHeader('5. Importación de notas')}

        <SubjectGradesView
          asignaturas={asignaturas}
          estudiantes={estudiantes}
          notas={notas}
          onSaveGrades={onSaveGrades}
        />
      </div>
    );
  }

  return null;
};
