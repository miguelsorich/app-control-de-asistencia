import React, { useState, useEffect, useMemo } from 'react';
import {
  Asignatura,
  Estudiante,
  RegistroAsistencia,
  SesionHabilitacion,
  NotaEstudiante,
  MODALIDADES,
} from '../types';
import { formatTimeRange } from '../utils/timeHelpers';
import { isSesionVigente, formatRemainingTime, getTodayDateString } from '../utils/scheduleValidators';
import {
  CalendarCheck,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Clock,
  Calendar,
  Lock,
  LogOut,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface StudentAttendanceViewProps {
  asignaturas: Asignatura[];
  estudiantes: Estudiante[];
  registrosAsistencia: RegistroAsistencia[];
  sesionesHabilitacion: Record<string, SesionHabilitacion>;
  notas: NotaEstudiante[];
  onRegistrarAsistencia: (registro: RegistroAsistencia) => void;
  onVolverDocente?: () => void;
  onVolverPrincipal?: () => void;
  onLogoutToMain?: () => void;
}

type StudentSubView = 'DASHBOARD' | 'ASISTENCIAS' | 'NOTAS' | 'MARCAR';

export const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({
  asignaturas,
  estudiantes,
  registrosAsistencia,
  sesionesHabilitacion,
  notas,
  onRegistrarAsistencia,
  onVolverDocente,
  onVolverPrincipal,
  onLogoutToMain,
}) => {
  // ==========================================
  // MÓDULO 8: ESTADO DE ACCESO / AUTENTICACIÓN
  // Acceso directo por Registro Universitario
  // ==========================================
  const [authRU, setAuthRU] = useState<string | null>(null);
  const [ruInput, setRuInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Portal Navigation State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [activeSubView, setActiveSubView] = useState<StudentSubView>('DASHBOARD');
  const [markErrorMessage, setMarkErrorMessage] = useState<string | null>(null);

  // Confirmation state after marking attendance
  const [lastConfirmedRecord, setLastConfirmedRecord] = useState<{
    registro: RegistroAsistencia;
    estudiante: Estudiante;
    asignatura: Asignatura;
  } | null>(null);

  // Live timer tick to update expiration countdown
  const [currentClock, setCurrentClock] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentClock(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = getTodayDateString(new Date());

  // Enrolled student records for the authenticated RU
  const enrolledStudentRecords = useMemo(() => {
    if (!authRU) return [];
    const cleanAuth = authRU.trim().toLowerCase();
    return estudiantes.filter(
      (e) => e.registroUniversitario.trim().toLowerCase() === cleanAuth
    );
  }, [estudiantes, authRU]);

  // Enrolled subjects for the authenticated student (PRIVACY: only own subjects)
  const enrolledSubjects = useMemo(() => {
    if (!authRU || enrolledStudentRecords.length === 0) return [];
    const enrolledIds = new Set(enrolledStudentRecords.map((e) => e.asignaturaId));
    return asignaturas.filter((a) => enrolledIds.has(a.id));
  }, [asignaturas, enrolledStudentRecords, authRU]);

  // Automatically select initial subject if not chosen or if invalid
  useEffect(() => {
    if (authRU && enrolledSubjects.length > 0) {
      if (!selectedSubjectId || !enrolledSubjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(enrolledSubjects[0].id);
      }
    }
  }, [authRU, enrolledSubjects, selectedSubjectId]);

  // Currently active subject
  const selectedSubject = useMemo(() => {
    if (!selectedSubjectId) return null;
    return enrolledSubjects.find((a) => a.id === selectedSubjectId) || null;
  }, [enrolledSubjects, selectedSubjectId]);

  // Current student record for the active subject
  const currentStudent = useMemo(() => {
    if (!selectedSubject || enrolledStudentRecords.length === 0) return null;
    return (
      enrolledStudentRecords.find((e) => e.asignaturaId === selectedSubject.id) ||
      enrolledStudentRecords[0] ||
      null
    );
  }, [selectedSubject, enrolledStudentRecords]);

  // Session state for current subject
  const currentSession = selectedSubject ? sesionesHabilitacion[selectedSubject.id] : null;
  const isSubjectEnabled = selectedSubject
    ? isSesionVigente(currentSession, currentClock, todayStr)
    : false;

  const remainingMs = currentSession && isSubjectEnabled
    ? Math.max(0, currentSession.expiraTimestamp - currentClock)
    : 0;

  // Student's own attendance records in this subject
  const studentAttendanceRecords = useMemo(() => {
    if (!selectedSubject || !currentStudent) return [];
    return registrosAsistencia
      .filter(
        (r) =>
          r.asignaturaId === selectedSubject.id &&
          r.registroUniversitario.trim().toLowerCase() ===
            currentStudent.registroUniversitario.trim().toLowerCase()
      )
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [registrosAsistencia, selectedSubject, currentStudent]);

  // Check if student already marked today
  const todayRecord = useMemo(() => {
    if (!selectedSubject || !currentStudent) return null;
    return (
      registrosAsistencia.find(
        (r) =>
          r.asignaturaId === selectedSubject.id &&
          r.registroUniversitario.trim().toLowerCase() ===
            currentStudent.registroUniversitario.trim().toLowerCase() &&
          r.fecha === todayStr
      ) || null
    );
  }, [registrosAsistencia, selectedSubject, currentStudent, todayStr]);

  // Student's own grades in this subject
  const studentGrade = useMemo(() => {
    if (!selectedSubject || !currentStudent) return null;
    return (
      notas.find(
        (n) =>
          n.asignaturaId === selectedSubject.id &&
          n.registroUniversitario.trim().toLowerCase() ===
            currentStudent.registroUniversitario.trim().toLowerCase()
      ) || null
    );
  }, [notas, selectedSubject, currentStudent]);

  // ==========================================
  // HANDLERS
  // ==========================================

  // Handle student login (Módulo 8: Acceso directo por Registro Universitario)
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanRU = ruInput.trim();

    if (!cleanRU) {
      setLoginError('Registro Universitario no encontrado.');
      return;
    }

    // Check if the RU exists exactly in at least one imported student list
    const found = estudiantes.find(
      (est) => est.registroUniversitario.trim().toLowerCase() === cleanRU.toLowerCase()
    );

    if (!found) {
      setLoginError('Registro Universitario no encontrado.');
      return;
    }

    // Direct access allowed: Save authenticated RU and initialize portal
    setAuthRU(found.registroUniversitario);
    setRuInput('');
    setLoginError(null);
    setActiveSubView('DASHBOARD');
    setLastConfirmedRecord(null);
    setMarkErrorMessage(null);
  };

  // Handle logout (Cerrar sesión)
  const handleLogout = () => {
    setAuthRU(null);
    setSelectedSubjectId(null);
    setRuInput('');
    setLoginError(null);
    setActiveSubView('DASHBOARD');
    setLastConfirmedRecord(null);
    setMarkErrorMessage(null);
    if (onLogoutToMain) {
      onLogoutToMain();
    }
  };

  // Handle marking attendance
  const handleMarcarAsistencia = () => {
    setMarkErrorMessage(null);

    if (!selectedSubject || !currentStudent) return;

    // 1. Check if attendance is actively enabled via Módulo 4
    const session = sesionesHabilitacion[selectedSubject.id];
    const isEnabled = isSesionVigente(session, Date.now(), todayStr);
    if (!isEnabled) {
      setMarkErrorMessage('La asistencia no está habilitada en este momento.');
      return;
    }

    // 2. Check if already marked for today's class
    if (todayRecord) {
      setMarkErrorMessage(
        `La asistencia ya fue registrada para esta clase a las ${todayRecord.horaMarcado}.`
      );
      return;
    }

    // 3. Register attendance as PRESENTE
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

    const nuevoRegistro: RegistroAsistencia = {
      id: `asist-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      asignaturaId: selectedSubject.id,
      registroUniversitario: currentStudent.registroUniversitario,
      fecha: todayStr,
      horaMarcado: timeStr,
      estado: 'PRESENTE',
      timestamp: Date.now(),
    };

    onRegistrarAsistencia(nuevoRegistro);
    setLastConfirmedRecord({
      registro: nuevoRegistro,
      estudiante: currentStudent,
      asignatura: selectedSubject,
    });
  };

  // ==========================================
  // VIEW 1: ACCESO DE ESTUDIANTES (MÓDULO 8)
  // ==========================================
  if (!authRU) {
    return (
      <div id="student-login-view" className="max-w-md mx-auto py-6 sm:py-10 animate-in fade-in duration-200">
        {/* Card de Acceso */}
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

          {/* Title */}
          <div className="text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              Acceso de Estudiantes
            </h1>
            <p className="text-xs font-semibold text-[#174EAF]">
              Sistema de Control de Asistencia — UAGRM
            </p>
            <p className="text-[11px] text-[#667085]">
              Docente: <strong>Miguel Antonio Sorich Rojas</strong> (Código: 6379)
            </p>
          </div>

          {/* Formulario de Acceso Simplificado (Solo Registro Universitario) */}
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div>
              <label
                htmlFor="input-student-ru"
                className="block text-xs font-bold text-[#172033] mb-1.5 uppercase tracking-wider"
              >
                Registro Universitario
              </label>
              <input
                id="input-student-ru"
                type="text"
                autoFocus
                value={ruInput}
                onChange={(e) => {
                  setRuInput(e.target.value);
                  if (loginError) setLoginError(null);
                }}
                placeholder="Ingresa tu Registro Universitario"
                className="w-full px-4 py-2.5 text-sm font-mono font-medium rounded-xl border border-[#DCE3EC] focus:outline-none focus:ring-2 focus:ring-[#174EAF] focus:border-[#174EAF] bg-white text-[#172033] placeholder:font-sans placeholder:text-[#667085]"
              />
            </div>

            {/* Error banner */}
            {loginError && (
              <div
                id="student-login-error"
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="font-medium">{loginError}</span>
              </div>
            )}

            <button
              id="btn-student-ingresar"
              type="submit"
              className="w-full py-3 px-4 bg-[#174EAF] hover:bg-[#103B88] text-white font-bold text-sm rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#174EAF] focus:ring-offset-2 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Ingresar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Volver a la pantalla principal de acceso */}
          <div className="pt-2 border-t border-[#DCE3EC] text-center">
            <button
              id="btn-student-volver-principal"
              type="button"
              onClick={onVolverPrincipal || onVolverDocente}
              className="text-xs font-semibold text-[#174EAF] hover:text-[#103B88] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la pantalla principal</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CASE: ESTUDIANTE AUTENTICADO SIN ASIGNATURAS
  // ==========================================
  if (enrolledSubjects.length === 0) {
    return (
      <div id="student-no-subjects-view" className="max-w-md mx-auto py-10 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#172033]">
            Sin Asignaturas Inscritas
          </h2>
          <p className="text-xs text-[#667085]">
            El Registro Universitario <strong className="font-mono text-[#172033]">{authRU}</strong> no figura inscrito en ninguna asignatura registrada en el sistema.
          </p>
          <button
            id="btn-logout-no-subjects"
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-white hover:bg-[#E8F0FC] text-[#174EAF] border border-[#174EAF] font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    );
  }

  if (!selectedSubject || !currentStudent) {
    return null;
  }

  // ==========================================
  // HEADER DEL PORTAL DEL ESTUDIANTE
  // ==========================================
  const renderStudentPortalHeader = () => (
    <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title & Subject Info */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC]">
              Portal del Estudiante
            </span>
            <span className="font-mono font-bold text-xs bg-[#174EAF] text-white px-2.5 py-0.5 rounded">
              {selectedSubject.sigla}
            </span>
            <span className="bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC] text-xs font-bold px-2 py-0.5 rounded">
              Grupo {selectedSubject.grupo}
            </span>
            <span className="bg-[#F5F7FA] text-[#172033] border border-[#DCE3EC] text-xs font-semibold px-2 py-0.5 rounded">
              Semestre {selectedSubject.semestre || 1} · {selectedSubject.año || 2026}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-[#172033] truncate">
            {selectedSubject.nombre}
          </h2>

          <div className="flex items-center gap-4 text-xs text-[#667085] flex-wrap pt-0.5">
            <div className="flex items-center gap-1.5 font-medium text-[#172033]">
              <Calendar className="w-3.5 h-3.5 text-[#174EAF]" />
              <span>{MODALIDADES[selectedSubject.modalidad]?.label}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#667085]" />
              <span className="font-mono font-bold text-[#172033]">
                {formatTimeRange(selectedSubject.horaInicio, selectedSubject.horaFin)}
              </span>
            </div>
          </div>

          {/* Selector de asignatura si el estudiante está en varias materias */}
          {enrolledSubjects.length > 1 && (
            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <label htmlFor="select-enrolled-subject" className="text-[11px] font-bold text-[#667085] uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-[#174EAF]" />
                <span>Asignatura:</span>
              </label>
              <select
                id="select-enrolled-subject"
                value={selectedSubject.id}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setActiveSubView('DASHBOARD');
                  setLastConfirmedRecord(null);
                  setMarkErrorMessage(null);
                }}
                className="text-xs font-semibold text-[#172033] bg-white border border-[#DCE3EC] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#174EAF] cursor-pointer"
              >
                {enrolledSubjects.map((asig) => (
                  <option key={asig.id} value={asig.id}>
                    {asig.sigla} - {asig.nombre} (Gr. {asig.grupo} · Sem. {asig.semestre || 1}/{asig.año || 2026})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Sección Visual: Docente Responsable + Estudiante Identificado + Cerrar Sesión */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#DCE3EC]">
          {/* Tarjeta del Docente Responsable (Fotografía Oficial) */}
          <div className="flex items-center gap-3 bg-[#F5F7FA] border border-[#DCE3EC] rounded-xl p-2.5 sm:p-3">
            <img
              src="/docente_miguel.jpeg"
              alt="Docente Miguel Antonio Sorich Rojas"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-[#174EAF]/30 shadow-2xs flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
                Docente Responsable
              </span>
              <p className="font-bold text-xs sm:text-sm text-[#172033] truncate">
                Miguel Antonio Sorich Rojas
              </p>
              <p className="text-[11px] font-mono text-[#174EAF] font-bold">
                Cód. docente: 6379
              </p>
            </div>
          </div>

          {/* Tarjeta del Estudiante Identificado */}
          <div className="bg-[#F5F7FA] border border-[#DCE3EC] rounded-xl p-2.5 sm:p-3 text-xs space-y-0.5 min-w-[140px]">
            <span className="text-[10px] uppercase font-bold text-[#667085] tracking-wider block">
              Estudiante Identificado
            </span>
            <div className="font-bold text-[#172033] truncate">{currentStudent.nombreCompleto}</div>
            <div className="text-[#667085] font-mono text-[11px]">
              RU: <span className="font-bold text-[#174EAF]">{currentStudent.registroUniversitario}</span>
            </div>
          </div>

          {/* Cerrar Sesión */}
          <button
            id="btn-student-cerrar-sesion"
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#174EAF] hover:text-[#103B88] bg-white hover:bg-[#E8F0FC] border border-[#174EAF] px-3 py-2 sm:py-2.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
            title="Cerrar sesión del estudiante"
          >
            <LogOut className="w-3.5 h-3.5 text-[#174EAF]" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // SUBVIEW: MIS ASISTENCIAS
  // ==========================================
  if (activeSubView === 'ASISTENCIAS') {
    return (
      <div id="student-view-mis-asistencias" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Navigation Bar back to Dashboard */}
        <div className="flex items-center justify-between gap-3">
          <button
            id="btn-volver-dashboard-desde-asistencias"
            type="button"
            onClick={() => setActiveSubView('DASHBOARD')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#174EAF] hover:text-[#103B88] bg-white hover:bg-[#E8F0FC] border border-[#174EAF] px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Portal del Estudiante</span>
          </button>

          <span className="text-xs font-semibold text-[#667085]">
            Sección: Mis Asistencias
          </span>
        </div>

        {/* Header summary */}
        {renderStudentPortalHeader()}

        {/* Content: List of Student's Attendance Records */}
        <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#DCE3EC] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#172033]">
                Mis Asistencias Registradas
              </h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC]">
              {studentAttendanceRecords.length} clases asistidas
            </span>
          </div>

          {studentAttendanceRecords.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-[#DCE3EC] rounded-xl p-6">
              <CalendarCheck className="w-8 h-8 text-[#667085]/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#172033]">
                No tienes registros de asistencia en esta asignatura
              </p>
              <p className="text-xs text-[#667085] mt-1">
                Cuando el docente habilite la asistencia en horario de clase, podrás registrar tu presencia desde la opción "Marcar asistencia".
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#DCE3EC]">
              <table id="tabla-mis-asistencias-estudiante" className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#E8F0FC] border-b border-[#DCE3EC] text-[#172033] font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center text-[#667085]">#</th>
                    <th className="py-3 px-4">Fecha de Clase</th>
                    <th className="py-3 px-4">Hora de Registro</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3EC] bg-white">
                  {studentAttendanceRecords.map((rec, idx) => (
                    <tr key={rec.id} className="hover:bg-[#E8F0FC]/30 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-[#667085] text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#172033]">
                        {rec.fecha}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#172033]">
                        {rec.horaMarcado}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC]">
                          <CheckCircle2 className="w-3 h-3 text-[#174EAF]" />
                          PRESENTE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // SUBVIEW: MIS NOTAS
  // ==========================================
  if (activeSubView === 'NOTAS') {
    return (
      <div id="student-view-mis-notas" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Navigation Bar back to Dashboard */}
        <div className="flex items-center justify-between gap-3">
          <button
            id="btn-volver-dashboard-desde-notas"
            type="button"
            onClick={() => setActiveSubView('DASHBOARD')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#174EAF] hover:text-[#103B88] bg-white hover:bg-[#E8F0FC] border border-[#174EAF] px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Portal del Estudiante</span>
          </button>

          <span className="text-xs font-semibold text-[#667085]">
            Sección: Mis Notas
          </span>
        </div>

        {/* Header summary */}
        {renderStudentPortalHeader()}

        {/* Content: Student's Grades */}
        <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#DCE3EC] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Mis Calificaciones Oficiales
                </h3>
                <p className="text-xs text-[#667085]">
                  Notas registradas e importadas oficialmente para esta asignatura.
                </p>
              </div>
            </div>
          </div>

          {studentGrade ? (
            <div className="space-y-4">
              {/* 4 Cards for evaluations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Primer Parcial */}
                <div className="bg-white border border-[#DCE3EC] rounded-2xl p-4 text-center space-y-1">
                  <span className="text-xs font-bold text-[#667085] uppercase tracking-wider block">
                    Primer Parcial
                  </span>
                  <span
                    id="student-nota-primer-parcial"
                    className="text-3xl font-mono font-black text-[#172033] block pt-1"
                  >
                    {studentGrade.primerParcial ?? '-'}
                  </span>
                  <span className="text-[11px] text-[#667085]">Evaluación Parcial 1</span>
                </div>

                {/* Segundo Parcial */}
                <div className="bg-white border border-[#DCE3EC] rounded-2xl p-4 text-center space-y-1">
                  <span className="text-xs font-bold text-[#667085] uppercase tracking-wider block">
                    Segundo Parcial
                  </span>
                  <span
                    id="student-nota-segundo-parcial"
                    className="text-3xl font-mono font-black text-[#172033] block pt-1"
                  >
                    {studentGrade.segundoParcial ?? '-'}
                  </span>
                  <span className="text-[11px] text-[#667085]">Evaluación Parcial 2</span>
                </div>

                {/* Examen Final */}
                <div className="bg-white border border-[#DCE3EC] rounded-2xl p-4 text-center space-y-1">
                  <span className="text-xs font-bold text-[#667085] uppercase tracking-wider block">
                    Examen Final
                  </span>
                  <span
                    id="student-nota-examen-final"
                    className="text-3xl font-mono font-black text-[#172033] block pt-1"
                  >
                    {studentGrade.examenFinal ?? '-'}
                  </span>
                  <span className="text-[11px] text-[#667085]">Evaluación Final</span>
                </div>

                {/* Nota Final */}
                <div className="bg-[#E8F0FC] border-2 border-[#174EAF]/40 rounded-2xl p-4 text-center space-y-1 shadow-2xs">
                  <span className="text-xs font-bold text-[#174EAF] uppercase tracking-wider block">
                    Nota Final
                  </span>
                  <span
                    id="student-nota-nota-final"
                    className="text-3xl font-mono font-black text-[#174EAF] block pt-1"
                  >
                    {studentGrade.notaFinal ?? studentGrade.nota ?? '-'}
                  </span>
                  <span className="text-[11px] text-[#174EAF] font-semibold">Calificación Oficial</span>
                </div>
              </div>

              {/* Information Note */}
              <div className="bg-[#F5F7FA] rounded-xl p-3 border border-[#DCE3EC] text-xs text-[#667085] text-center">
                Calificaciones asociadas al Registro Universitario <strong className="font-mono text-[#172033]">{currentStudent.registroUniversitario}</strong> en la materia <strong className="text-[#172033]">{selectedSubject.nombre}</strong>.
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-[#DCE3EC] rounded-xl p-6">
              <GraduationCap className="w-8 h-8 text-[#667085]/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#172033]">
                Aún no hay calificaciones registradas para su Registro Universitario
              </p>
              <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
                El docente aún no ha importado las notas de esta asignatura en el sistema oficial.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // SUBVIEW: MARCAR ASISTENCIA
  // ==========================================
  if (activeSubView === 'MARCAR') {
    return (
      <div id="student-view-marcar-asistencia" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Navigation Bar back to Dashboard */}
        <div className="flex items-center justify-between gap-3">
          <button
            id="btn-volver-dashboard-desde-marcar"
            type="button"
            onClick={() => setActiveSubView('DASHBOARD')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#174EAF] hover:text-[#103B88] bg-white hover:bg-[#E8F0FC] border border-[#174EAF] px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Portal del Estudiante</span>
          </button>

          <span className="text-xs font-semibold text-[#667085]">
            Sección: Marcar Asistencia
          </span>
        </div>

        {/* Header summary */}
        {renderStudentPortalHeader()}

        {/* Action / Confirmation Box */}
        {lastConfirmedRecord ? (
          <div
            id="attendance-confirmation-card"
            className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-6 sm:p-8 text-center space-y-6 animate-in zoom-in-95 duration-200"
          >
            <div className="w-16 h-16 rounded-full bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-[#E8F0FC] text-[#174EAF] font-bold text-xs rounded-full uppercase tracking-wider mb-2 border border-[#DCE3EC]">
                Asistencia Registrada con Éxito
              </span>
              <h3 className="text-2xl font-black text-[#172033]">
                ¡Asistencia Marcada: PRESENTE!
              </h3>
              <p className="text-xs text-[#667085] mt-1">
                Su registro de asistencia ha quedado guardado en el sistema oficial de la materia.
              </p>
            </div>

            {/* Details Card */}
            <div className="bg-white border border-[#DCE3EC] rounded-xl p-5 text-left max-w-md mx-auto space-y-3 text-xs shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE3EC]">
                <span className="text-[#667085] font-medium">Asignatura:</span>
                <span className="font-bold text-[#172033] font-mono">
                  {lastConfirmedRecord.asignatura.sigla} - Grupo {lastConfirmedRecord.asignatura.grupo}
                </span>
              </div>
              <div className="pb-2 border-b border-[#DCE3EC]">
                <span className="text-[#667085] font-medium block">Materia:</span>
                <span className="font-semibold text-[#172033]">
                  {lastConfirmedRecord.asignatura.nombre}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE3EC]">
                <span className="text-[#667085] font-medium">Registro Universitario:</span>
                <span className="font-mono font-bold text-[#174EAF] bg-[#E8F0FC] px-2 py-0.5 rounded border border-[#DCE3EC]">
                  {lastConfirmedRecord.registro.registroUniversitario}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE3EC]">
                <span className="text-[#667085] font-medium">Estudiante:</span>
                <span className="font-semibold text-[#172033]">
                  {lastConfirmedRecord.estudiante.nombreCompleto}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE3EC]">
                <span className="text-[#667085] font-medium">Fecha de Clase:</span>
                <span className="font-medium text-[#172033]">
                  {lastConfirmedRecord.registro.fecha}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#DCE3EC]">
                <span className="text-[#667085] font-medium">Hora de Marcado:</span>
                <span className="font-mono font-bold text-[#174EAF]">
                  {lastConfirmedRecord.registro.horaMarcado}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085] font-medium">Estado Asignado:</span>
                <span className="font-bold text-[#174EAF] bg-[#E8F0FC] px-2.5 py-0.5 rounded-full border border-[#DCE3EC]">
                  PRESENTE
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveSubView('DASHBOARD')}
                className="px-6 py-2.5 bg-[#174EAF] hover:bg-[#103B88] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Volver al Panel del Estudiante
              </button>
            </div>
          </div>
        ) : todayRecord ? (
          /* Already marked today */
          <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-6 sm:p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 bg-[#E8F0FC] text-[#174EAF] font-bold text-xs rounded-full uppercase tracking-wider border border-[#DCE3EC]">
                Asistencia de Hoy Ya Registrada
              </span>
              <h3 className="text-xl font-bold text-[#172033]">
                Ya marcaste asistencia para la clase de hoy
              </h3>
              <p className="text-xs text-[#667085]">
                Fecha: <strong>{todayRecord.fecha}</strong> • Hora: <strong className="font-mono text-[#174EAF]">{todayRecord.horaMarcado}</strong>
              </p>
            </div>

            <div className="bg-white border border-[#DCE3EC] rounded-xl p-4 max-w-sm mx-auto text-xs text-[#667085] space-y-1.5 text-left shadow-2xs">
              <div className="flex justify-between">
                <span className="text-[#667085]">Estudiante:</span>
                <span className="font-semibold text-[#172033]">{currentStudent.nombreCompleto}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Registro:</span>
                <span className="font-mono font-bold text-[#172033]">{currentStudent.registroUniversitario}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Estado:</span>
                <span className="font-bold text-[#174EAF]">PRESENTE</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setActiveSubView('DASHBOARD')}
                className="px-5 py-2.5 bg-white hover:bg-[#E8F0FC] text-[#174EAF] border border-[#174EAF] font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Volver al Menú Principal
              </button>
            </div>
          </div>
        ) : (
          /* Ready to mark or not enabled */
          <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCE3EC]">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Registro de Asistencia — Clase de Hoy
                </h3>
                <p className="text-xs text-[#667085]">
                  Fecha: <span className="font-semibold text-[#172033]">{todayStr}</span>
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {isSubjectEnabled ? (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F0FC] text-[#174EAF] text-xs font-bold rounded-full border border-[#DCE3EC]">
                      <span className="w-2 h-2 rounded-full bg-[#174EAF] animate-pulse" />
                      Habilitada ({formatRemainingTime(remainingMs)})
                    </span>
                    <span className="block text-[10px] text-[#667085] font-medium mt-0.5">
                      Duración: {currentSession?.duracionMinutos} min
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-[#667085] text-xs font-bold rounded-full border border-[#DCE3EC]">
                    <Lock className="w-3.5 h-3.5 text-[#667085]" />
                    No Habilitada (Cerrada)
                  </span>
                )}
              </div>
            </div>

            {/* Error banner if any */}
            {markErrorMessage && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{markErrorMessage}</div>
              </div>
            )}

            {/* Action Box */}
            {isSubjectEnabled ? (
              <div className="max-w-md mx-auto text-center space-y-4 py-4">
                <p className="text-xs text-[#667085]">
                  Haga clic en el botón a continuación para registrar su asistencia como <strong>PRESENTE</strong> en la clase de hoy.
                </p>

                <button
                  id="btn-confirmar-marcar-asistencia"
                  type="button"
                  onClick={handleMarcarAsistencia}
                  className="w-full py-3.5 px-6 bg-[#174EAF] hover:bg-[#103B88] text-white font-bold text-sm rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[#174EAF] focus:ring-offset-2 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Marcar Presente</span>
                </button>

                <p className="text-[11px] text-[#667085]">
                  Se registrará automáticamente con la hora oficial del sistema.
                </p>
              </div>
            ) : (
              <div className="max-w-md mx-auto text-center space-y-3 py-6">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] mx-auto flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#172033]">
                  La asistencia no está habilitada en este momento
                </h4>
                <p className="text-xs text-[#667085]">
                  El docente debe habilitar la sesión de asistencia desde su panel durante el horario oficial de la clase.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: MAIN STUDENT DASHBOARD (3 MAIN CARDS)
  // ==========================================
  return (
    <div id="student-portal-dashboard" className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Subject & Student Information */}
      {renderStudentPortalHeader()}

      {/* DASHBOARD: 3 EQUAL PRINCIPAL ACCESS CARDS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#667085] uppercase tracking-wider">
          Opciones Principales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CARD 1: MIS ASISTENCIAS */}
          <div
            id="card-student-mis-asistencias"
            onClick={() => setActiveSubView('ASISTENCIAS')}
            className="bg-white rounded-2xl border border-[#DCE3EC] hover:border-[#174EAF] hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] group-hover:bg-[#174EAF] group-hover:text-white transition-colors flex items-center justify-center shadow-2xs">
                <CalendarCheck className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-[#172033] group-hover:text-[#174EAF] transition-colors">
                  Mis asistencias
                </h4>
                <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                  Consulta el historial completo de las fechas y horarios en que marcaste asistencia en esta materia.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#DCE3EC] flex items-center justify-between text-xs font-bold text-[#174EAF]">
              <span>Ver asistencias</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 2: MIS NOTAS */}
          <div
            id="card-student-mis-notas"
            onClick={() => setActiveSubView('NOTAS')}
            className="bg-white rounded-2xl border border-[#DCE3EC] hover:border-[#174EAF] hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] group-hover:bg-[#174EAF] group-hover:text-white transition-colors flex items-center justify-center shadow-2xs">
                <GraduationCap className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-[#172033] group-hover:text-[#174EAF] transition-colors">
                  Mis notas
                </h4>
                <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                  Revisa tus calificaciones del Primer Parcial, Segundo Parcial, Examen Final y tu Nota Final.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#DCE3EC] flex items-center justify-between text-xs font-bold text-[#174EAF]">
              <span>Ver calificaciones</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* CARD 3: MARCAR ASISTENCIA */}
          <div
            id="card-student-marcar-asistencia"
            onClick={() => setActiveSubView('MARCAR')}
            className="bg-white rounded-2xl border border-[#DCE3EC] hover:border-[#174EAF] hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F0FC] text-[#174EAF] group-hover:bg-[#174EAF] group-hover:text-white transition-colors flex items-center justify-center shadow-2xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-[#172033] group-hover:text-[#174EAF] transition-colors">
                    Marcar asistencia
                  </h4>
                  {isSubjectEnabled && (
                    <span className="w-2 h-2 rounded-full bg-[#174EAF] animate-pulse" title="Habilitada" />
                  )}
                </div>
                <p className="text-xs text-[#667085] mt-1.5 leading-relaxed">
                  Registra tu presencia en la clase de hoy cuando el docente haya habilitado la sesión.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#DCE3EC] flex items-center justify-between text-xs font-bold text-[#174EAF]">
              <span>Marcar ahora</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
