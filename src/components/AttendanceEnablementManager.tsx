import React, { useState, useEffect } from 'react';
import { Asignatura, Estudiante, RegistroAsistencia, SesionHabilitacion, MODALIDADES } from '../types';
import { formatTimeRange } from '../utils/timeHelpers';
import {
  validarHorarioHabilitacion,
  isSesionVigente,
  formatRemainingTime,
  getTodayDateString,
  formatCurrentTimeWithSeconds,
  DIAS_SEMANA_NOMBRES,
} from '../utils/scheduleValidators';
import {
  Clock,
  Calendar,
  AlertTriangle,
  Play,
  Square,
  Users,
  Search,
  CheckCircle2,
  Lock,
  Timer,
  Info,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface AttendanceEnablementManagerProps {
  asignaturas: Asignatura[];
  estudiantes: Estudiante[];
  registrosAsistencia: RegistroAsistencia[];
  sesionesHabilitacion: Record<string, SesionHabilitacion>;
  onHabilitarAsistencia: (asignaturaId: string, duracionMinutos: number) => void;
  onCerrarAsistencia: (asignaturaId: string) => void;
  onSelectSubjectForView?: (asig: Asignatura) => void;
  initialSelectedSubjectId?: string | null;
}

export const AttendanceEnablementManager: React.FC<AttendanceEnablementManagerProps> = ({
  asignaturas,
  estudiantes,
  registrosAsistencia,
  sesionesHabilitacion,
  onHabilitarAsistencia,
  onCerrarAsistencia,
  initialSelectedSubjectId,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (initialSelectedSubjectId && asignaturas.some((a) => a.id === initialSelectedSubjectId)) {
      return initialSelectedSubjectId;
    }
    return asignaturas[0]?.id || '';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState<number>(15);
  const [customDuracionInput, setCustomDuracionInput] = useState<string>('15');
  const [isTestSimulationMode, setIsTestSimulationMode] = useState<boolean>(false);
  const [currentClock, setCurrentClock] = useState<Date>(new Date());
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Update clock every second for live timers and exact second counting
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedSubject = asignaturas.find((a) => a.id === selectedSubjectId) || asignaturas[0];

  // Helper for simulation: if test simulation is active, use subject's valid day and start time
  const getSimulatedDate = (asig: Asignatura): Date => {
    const now = new Date();
    // find a valid day number for this modality
    const validDay = asig.modalidad === 'LUN_MIE_VIE' ? 1 : asig.modalidad === 'MAR_JUE' ? 2 : 6;
    const currentDay = now.getDay();
    const diff = (validDay - currentDay + 7) % 7;
    const simulated = new Date(now);
    simulated.setDate(now.getDate() + diff);

    // set time to start of class
    if (asig.horaInicio && asig.horaInicio.includes(':')) {
      const [h, m] = asig.horaInicio.split(':');
      simulated.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    }
    return simulated;
  };

  const validationDate = isTestSimulationMode && selectedSubject ? getSimulatedDate(selectedSubject) : currentClock;
  const validationResult = selectedSubject
    ? validarHorarioHabilitacion(selectedSubject, validationDate)
    : null;

  const currentSession = selectedSubject ? sesionesHabilitacion[selectedSubject.id] : null;
  const todayStr = getTodayDateString(currentClock);
  const sessionIsActive = isSesionVigente(currentSession, currentClock.getTime(), todayStr);

  const remainingMs = currentSession && sessionIsActive
    ? Math.max(0, currentSession.expiraTimestamp - currentClock.getTime())
    : 0;

  // Registered students for this subject today
  const registeredStudentsCount = selectedSubject
    ? registrosAsistencia.filter(
        (r) => r.asignaturaId === selectedSubject.id && r.fecha === todayStr
      ).length
    : 0;

  const totalSubjectStudents = selectedSubject
    ? estudiantes.filter((e) => e.asignaturaId === selectedSubject.id).length
    : 0;

  const handleSelectDurationPreset = (minutes: number) => {
    setDuracionMinutos(minutes);
    setCustomDuracionInput(String(minutes));
  };

  const handleCustomDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomDuracionInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 300) {
      setDuracionMinutos(parsed);
    }
  };

  const handleHabilitar = () => {
    if (!selectedSubject) return;

    if (!isTestSimulationMode && validationResult && !validationResult.puedeHabilitar) {
      setActionNotice(
        `No se puede habilitar la asistencia: ${validationResult.motivoInvalidez}`
      );
      setTimeout(() => setActionNotice(null), 5000);
      return;
    }

    if (duracionMinutos <= 0) {
      setActionNotice('Por favor ingrese una duración válida en minutos.');
      return;
    }

    onHabilitarAsistencia(selectedSubject.id, duracionMinutos);
    setActionNotice(
      `¡Asistencia habilitada exitosamente para ${selectedSubject.sigla} por ${duracionMinutos} minutos!`
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleCerrar = () => {
    if (!selectedSubject) return;
    onCerrarAsistencia(selectedSubject.id);
    setActionNotice(`Asistencia de ${selectedSubject.sigla} cerrada manualmente.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const filteredSubjects = asignaturas.filter((a) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      a.nombre.toLowerCase().includes(term) ||
      a.sigla.toLowerCase().includes(term) ||
      a.grupo.toLowerCase().includes(term)
    );
  });

  return (
    <div id="attendance-enablement-module" className="space-y-6 animate-in fade-in duration-200">
      {/* Module Title Banner */}
      <div className="bg-white rounded-2xl border border-[#DCE3EC] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#174EAF] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#172033]">
                Habilitación de Asistencia Docente
              </h2>
              <span className="bg-[#E8F0FC] text-[#174EAF] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#DCE3EC]">
                Control Oficial
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Habilite la asistencia para la clase de hoy con una duración configurable o ciérrela cuando finalice.
            </p>
          </div>
        </div>

        {/* Current Server Date/Time Display */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-[#F5F7FA] border border-[#DCE3EC] px-3 py-1.5 rounded-xl text-xs">
          <Clock className="w-3.5 h-3.5 text-[#174EAF]" />
          <span className="text-[#667085] font-medium">Hora actual:</span>
          <span className="font-mono font-bold text-[#172033]">
            {formatCurrentTimeWithSeconds(currentClock)}
          </span>
          <span className="text-[#DCE3EC]">|</span>
          <span className="font-semibold text-[#172033]">
            {DIAS_SEMANA_NOMBRES[currentClock.getDay()]}, {todayStr}
          </span>
        </div>
      </div>

      {/* Notice Banner if any action executed */}
      {actionNotice && (
        <div
          id="action-notice-banner"
          className="p-4 bg-[#E8F0FC] border border-[#174EAF]/30 rounded-xl text-xs text-[#174EAF] flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-150 font-medium"
        >
          <Info className="w-4 h-4 text-[#174EAF] flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{actionNotice}</div>
        </div>
      )}

      {/* Main 2-Column Layout: Subject Selector & Enablement Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Subject List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-[#DCE3EC] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#174EAF]" />
                <span>Seleccionar Asignatura</span>
              </h3>
              <span className="text-xs font-medium text-[#667085]">
                {asignaturas.length} materias
              </span>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-enablement-subjects"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por sigla, nombre o grupo..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#DCE3EC] focus:outline-none focus:ring-2 focus:ring-[#174EAF] bg-white text-[#172033]"
              />
            </div>
          </div>

          {/* Subject Items List */}
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredSubjects.map((asig) => {
              const session = sesionesHabilitacion[asig.id];
              const isActive = isSesionVigente(session, currentClock.getTime(), todayStr);
              const isSelected = selectedSubject?.id === asig.id;
              const modConfig = MODALIDADES[asig.modalidad] || MODALIDADES.LUN_MIE_VIE;

              return (
                <div
                  key={asig.id}
                  id={`subject-item-${asig.id}`}
                  onClick={() => setSelectedSubjectId(asig.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#E8F0FC]/70 border-[#174EAF] shadow-xs'
                      : 'bg-white border-[#DCE3EC] hover:border-[#174EAF]/50 hover:bg-[#F5F7FA]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs bg-[#174EAF] text-white px-2 py-0.5 rounded-lg">
                          {asig.sigla}
                        </span>
                        <span className="text-[11px] font-semibold text-[#172033] bg-[#E8F0FC] px-1.5 py-0.5 rounded border border-[#DCE3EC]">
                          G{asig.grupo}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#172033] mt-1 line-clamp-1">
                        {asig.nombre}
                      </h4>
                    </div>

                    {/* Status Badge */}
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC] flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#174EAF] animate-pulse" />
                        Habilitada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F7FA] text-[#667085] border border-[#DCE3EC] flex-shrink-0">
                        <Lock className="w-2.5 h-2.5 text-[#667085]" />
                        Cerrada
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#667085] pt-1 border-t border-[#DCE3EC]/60">
                    <span>{modConfig.shortLabel}</span>
                    <span className="font-mono font-semibold text-[#172033]">
                      {asig.horaInicio} - {asig.horaFin}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Subject Control Panel */}
        <div className="lg:col-span-7 space-y-4">
          {selectedSubject ? (
            <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-5 sm:p-6 space-y-6">
              {/* Subject Details Header */}
              <div className="pb-4 border-b border-[#DCE3EC] flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#174EAF] text-white text-xs font-bold px-2.5 py-0.5 rounded-lg font-mono">
                      {selectedSubject.sigla}
                    </span>
                    <span className="bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC] text-xs font-bold px-2 py-0.5 rounded-lg">
                      Grupo {selectedSubject.grupo}
                    </span>
                    {selectedSubject.aula && (
                      <span className="text-xs text-[#667085] bg-[#F5F7FA] px-2 py-0.5 rounded-lg border border-[#DCE3EC]">
                        Aula {selectedSubject.aula}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#172033] mt-1.5">
                    {selectedSubject.nombre}
                  </h3>
                </div>

                {/* Main Status Badge */}
                <div>
                  {sessionIsActive ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F0FC] border border-[#174EAF]/30 rounded-xl text-[#174EAF]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#174EAF] animate-pulse" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider">Habilitada</p>
                        <p className="text-[10px] text-[#174EAF] font-mono font-bold">
                          {formatRemainingTime(remainingMs)} restantes
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F7FA] border border-[#DCE3EC] rounded-xl text-[#667085]">
                      <Lock className="w-3.5 h-3.5 text-[#667085]" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider">Cerrada</p>
                        <p className="text-[10px] text-[#667085]">Sin sesión activa</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Class Schedule Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F5F7FA] p-4 rounded-xl border border-[#DCE3EC] text-xs">
                <div>
                  <span className="text-[#667085] font-medium block">Días de clase definidos:</span>
                  <p className="font-bold text-[#172033] mt-0.5">
                    {MODALIDADES[selectedSubject.modalidad]?.label}
                  </p>
                  <p className="text-[11px] text-[#667085] mt-0.5">
                    {MODALIDADES[selectedSubject.modalidad]?.dias.join(', ')}
                  </p>
                </div>
                <div>
                  <span className="text-[#667085] font-medium block">Horario de clase:</span>
                  <p className="font-mono font-bold text-[#172033] mt-0.5">
                    {formatTimeRange(selectedSubject.horaInicio, selectedSubject.horaFin)}
                  </p>
                  <p className="text-[11px] text-[#667085] mt-0.5">
                    Duración: {MODALIDADES[selectedSubject.modalidad]?.duracionTexto}
                  </p>
                </div>
              </div>

              {/* Live Status Content & Controls */}
              {sessionIsActive ? (
                /* ACTIVE SESSION STATE */
                <div
                  id="panel-active-session"
                  className="bg-[#E8F0FC]/60 border border-[#174EAF]/30 rounded-2xl p-5 space-y-4 text-center sm:text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#174EAF] text-white font-bold text-xs rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>Asistencia Abierta para la Clase de Hoy</span>
                      </div>
                      <p className="text-xs text-[#667085]">
                        Los estudiantes inscritos pueden ingresar al Portal del Estudiante y marcar su asistencia.
                      </p>
                    </div>

                    {/* Big Countdown Timer */}
                    <div className="bg-white px-4 py-2.5 rounded-xl border border-[#174EAF]/30 shadow-2xs text-center">
                      <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                        Tiempo Restante
                      </span>
                      <span className="text-2xl font-black font-mono text-[#174EAF]">
                        {formatRemainingTime(remainingMs)}
                      </span>
                    </div>
                  </div>

                  {/* Session Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-[#DCE3EC] text-xs">
                    <div>
                      <span className="text-[#667085] text-[11px]">Duración definida:</span>
                      <p className="font-bold text-[#172033]">
                        {currentSession?.duracionMinutos} minutos
                      </p>
                    </div>
                    <div>
                      <span className="text-[#667085] text-[11px]">Hora de inicio:</span>
                      <p className="font-mono font-bold text-[#172033]">
                        {currentSession?.horaInicioHabilitacion}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#667085] text-[11px]">Estudiantes marcados:</span>
                      <p className="font-bold text-[#174EAF] flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>
                          {registeredStudentsCount} de {totalSubjectStudents}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Manual Close Action */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-[#667085] text-left">
                      Al presionar cerrar, la sesión caducará inmediatamente y ningún estudiante podrá registrar asistencia.
                    </p>
                    <button
                      id="btn-cerrar-asistencia-manual"
                      type="button"
                      onClick={handleCerrar}
                      className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>Cerrar Asistencia</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* INACTIVE / READY TO ENABLE STATE */
                <div id="panel-enable-session" className="space-y-5">
                  {/* Schedule & Day Validation Banner */}
                  {validationResult && (
                    <div
                      id="validation-status-box"
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        validationResult.puedeHabilitar
                          ? 'bg-[#E8F0FC] border-[#174EAF]/30 text-[#172033]'
                          : 'bg-[#F5F7FA] border-[#DCE3EC] text-[#172033]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {validationResult.puedeHabilitar ? (
                          <CheckCircle2 className="w-4 h-4 text-[#174EAF] flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-[#667085] flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold text-xs text-[#172033]">
                            {validationResult.puedeHabilitar
                              ? 'Fecha y Horario Válidos para esta Asignatura'
                              : 'No corresponde al día u horario establecido'}
                          </p>
                          <p className="text-[#667085] mt-0.5">
                            {validationResult.puedeHabilitar
                              ? `Hoy es ${validationResult.diaActualNombre} (${validationResult.horaActualStr}) y coincide con el día y horario programado (${validationResult.horarioPermitido}).`
                              : validationResult.motivoInvalidez}
                          </p>
                        </div>
                      </div>

                      {/* Simulation toggle helper for easy testing outside real class hours */}
                      <div className="pt-2 border-t border-[#DCE3EC] flex items-center justify-between">
                        <span className="text-[11px] text-[#667085]">
                          {isTestSimulationMode
                            ? 'Simulación de horario activa (Modo prueba)'
                            : 'Validación en tiempo real activa'}
                        </span>
                        <button
                          id="btn-toggle-test-mode"
                          type="button"
                          onClick={() => setIsTestSimulationMode((prev) => !prev)}
                          className="text-[11px] font-semibold text-[#174EAF] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {isTestSimulationMode ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-[#174EAF]" />
                              <span>Desactivar modo prueba</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-[#667085]" />
                              <span>Simular día/hora de clase para pruebas</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Duration Selection */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-[#172033]">
                      Definir Duración de la Habilitación (en minutos):
                    </label>

                    {/* Quick Preset Buttons */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[5, 10, 15, 20, 30, 45].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleSelectDurationPreset(mins)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            duracionMinutos === mins
                              ? 'bg-[#174EAF] text-white shadow-xs'
                              : 'bg-white text-[#172033] hover:bg-[#E8F0FC] border border-[#DCE3EC]'
                          }`}
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>

                    {/* Custom Minutes Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-[#667085] font-medium">
                        O escribir duración personalizada:
                      </span>
                      <div className="flex items-center gap-1.5 max-w-[130px]">
                        <input
                          id="input-custom-duracion"
                          type="number"
                          min="1"
                          max="240"
                          value={customDuracionInput}
                          onChange={handleCustomDurationChange}
                          className="w-16 px-2.5 py-1 text-xs font-bold font-mono text-center rounded-lg border border-[#DCE3EC] focus:outline-none focus:ring-2 focus:ring-[#174EAF] bg-white text-[#172033]"
                        />
                        <span className="text-xs font-semibold text-[#667085]">minutos</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-3 border-t border-[#DCE3EC]">
                    <button
                      id="btn-habilitar-asistencia-principal"
                      type="button"
                      onClick={handleHabilitar}
                      disabled={!isTestSimulationMode && validationResult && !validationResult.puedeHabilitar}
                      className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                        !isTestSimulationMode && validationResult && !validationResult.puedeHabilitar
                          ? 'bg-slate-100 text-[#667085] border border-[#DCE3EC] cursor-not-allowed'
                          : 'bg-[#174EAF] hover:bg-[#103B88] text-white'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Habilitar Asistencia ({duracionMinutos} min)</span>
                    </button>

                    {!isTestSimulationMode && validationResult && !validationResult.puedeHabilitar && (
                      <p className="text-[11px] text-[#667085] text-center mt-2">
                        La habilitación requiere corresponder al día y horario de la clase (o active el interruptor de modo prueba arriba).
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#DCE3EC] p-8 text-center text-[#667085] text-xs">
              Seleccione una asignatura del panel izquierdo para configurar su asistencia.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
