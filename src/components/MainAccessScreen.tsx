import React from 'react';
import { UserCheck, LayoutGrid, ChevronRight, GraduationCap, Lock } from 'lucide-react';

interface MainAccessScreenProps {
  onSelectEstudiante: () => void;
  onSelectDocente: () => void;
  totalAsignaturas?: number;
  totalEstudiantes?: number;
  onOpenAdminLogin?: () => void;
}

export const MainAccessScreen: React.FC<MainAccessScreenProps> = ({
  onSelectEstudiante,
  onSelectDocente,
  totalAsignaturas = 0,
  totalEstudiantes = 0,
  onOpenAdminLogin,
}) => {
  return (
    <div id="main-access-screen" className="max-w-4xl mx-auto py-4 sm:py-8 space-y-8 animate-in fade-in duration-300">
      {/* Banner / Academic Presentation */}
      <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-xs p-6 sm:p-8 text-center space-y-4">
        {/* Official Logos */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 pb-4 border-b border-[#DCE3EC]/80 flex-wrap">
          <div className="bg-[#F5F7FA] p-2 rounded-xl border border-[#DCE3EC] shadow-2xs">
            <img
              src="/logo_digital_academy.png"
              alt="Digital Academy"
              className="h-12 sm:h-14 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="h-10 w-px bg-[#DCE3EC] hidden sm:block" />
          <div className="bg-[#F5F7FA] p-2 rounded-xl border border-[#DCE3EC] shadow-2xs">
            <img
              src="/logo_facultad.png"
              alt="Facultad de Ciencias Contables UAGRM"
              className="h-12 sm:h-14 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-1.5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC] mb-1">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Sistema Académico Digital Academy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
            Control de Asistencia UAGRM
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
            Facultad de Ciencias Contables, Auditoría, Sistemas de Control de Gestión y Finanzas
          </p>
        </div>
      </div>

      {/* Main Two Access Cards */}
      <div>
        <div className="text-center mb-6">
          <h2 className="text-base sm:text-lg font-bold text-[#172033]">
            Selecciona tu portal de acceso
          </h2>
          <p className="text-xs text-[#667085]">
            Elige la opción correspondiente para ingresar al sistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Card 1: Portal Estudiante */}
          <div
            id="card-portal-estudiante"
            onClick={onSelectEstudiante}
            className="group bg-white rounded-2xl border-2 border-[#DCE3EC] hover:border-[#174EAF] shadow-xs hover:shadow-md transition-all duration-200 p-6 sm:p-7 cursor-pointer flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="space-y-4">
              {/* Header inside card */}
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-[#E8F0FC] text-[#174EAF] group-hover:bg-[#174EAF] group-hover:text-white transition-colors flex items-center justify-center shadow-2xs">
                  <UserCheck className="w-7 h-7" />
                </div>
                <span className="bg-[#E8F0FC] text-[#174EAF] text-xs font-bold px-3 py-1 rounded-full border border-[#DCE3EC]">
                  Alumnos
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#172033] group-hover:text-[#174EAF] transition-colors">
                  Portal Estudiante
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                  Acceso directo mediante tu <strong>Registro Universitario</strong> para marcar asistencia en clases habilitadas, revisar tu historial de asistencias y consultar tus calificaciones.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-1.5 pt-2 border-t border-[#DCE3EC]/60 text-xs text-[#667085]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#174EAF]" />
                  <span>Ingreso directo con tu <strong>Registro Universitario</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#174EAF]" />
                  <span>Marcar asistencia con código de sesión</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#174EAF]" />
                  <span>Consulta de notas (6 evaluaciones)</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              id="btn-acceso-estudiante-main"
              onClick={(e) => {
                e.stopPropagation();
                onSelectEstudiante();
              }}
              className="w-full py-3 px-4 bg-[#174EAF] group-hover:bg-[#103B88] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ingresar como Estudiante</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Card 2: Portal Docente */}
          <div
            id="card-portal-docente"
            onClick={onSelectDocente}
            className="group bg-white rounded-2xl border-2 border-[#DCE3EC] hover:border-[#174EAF] shadow-xs hover:shadow-md transition-all duration-200 p-6 sm:p-7 cursor-pointer flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="space-y-4">
              {/* Header inside card */}
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-[#E8F0FC] text-[#174EAF] group-hover:bg-[#174EAF] group-hover:text-white transition-colors flex items-center justify-center shadow-2xs">
                  <LayoutGrid className="w-7 h-7" />
                </div>
                <span className="bg-[#103B88] text-white text-xs font-bold px-3 py-1 rounded-full">
                  Docentes
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#172033] group-hover:text-[#174EAF] transition-colors">
                  Portal Docente
                </h3>
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed">
                  Acceso para docentes con su usuario y contraseña para gestión de materias, control en vivo de asistencias, reportes y notas.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-1.5 pt-2 border-t border-[#DCE3EC]/60 text-xs text-[#667085]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#103B88]" />
                  <span>Búsqueda en oferta académica o creación manual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#103B88]" />
                  <span>Habilitación de asistencia con temporizador y código</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#103B88]" />
                  <span>Reportes oficiales y modificación manual de calificaciones</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              id="btn-acceso-docente-main"
              onClick={(e) => {
                e.stopPropagation();
                onSelectDocente();
              }}
              className="w-full py-3 px-4 bg-[#103B88] group-hover:bg-[#174EAF] text-white font-bold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ingresar como Docente</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Candado discreto de acceso propietario al final */}
        {onOpenAdminLogin && (
          <div className="flex justify-center pt-6">
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer rounded-lg hover:bg-slate-100"
              title="Acceso de Gestión con Clave"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500/70" />
              <span>Acceso de Seguridad</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
