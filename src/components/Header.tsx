import React, { useRef } from 'react';
import { UserCheck, ShieldCheck, ArrowLeft, BarChart3, Lock, Shield } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal?: () => void;
  totalAsignaturas: number;
  totalEstudiantes: number;
  activeTab: 'MAIN' | 'DOCENTE' | 'ESTUDIANTE' | 'ADMIN';
  onChangeTab: (tab: 'MAIN' | 'DOCENTE' | 'ESTUDIANTE' | 'ADMIN') => void;
  activeSubjectName?: string | null;
  onNavigateHome?: () => void;
  onUnlockDocente?: () => void;
  onOpenDocenteGraficos?: () => void;
  onOpenAdminLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onChangeTab,
  onUnlockDocente,
  onOpenDocenteGraficos,
  onOpenAdminLogin,
}) => {
  const clickCountRef = useRef<number>(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manejador secreto de 3 clics para acceder al portal docente
  const handleSecretTripleClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      if (onUnlockDocente) {
        onUnlockDocente();
      } else {
        onChangeTab('DOCENTE');
      }
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 2000);
    }
  };

  return (
    <header id="header-uagrm" className="bg-[#174EAF] text-white border-b border-[#103B88] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 sm:gap-4">
          {/* Logos & Title Container */}
          <div
            onClick={handleSecretTripleClick}
            className="flex items-center gap-3 sm:gap-4 cursor-pointer select-none group"
            title="Control de Asistencia UAGRM"
          >
            {/* Logos Group */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 bg-white/95 p-1.5 sm:p-2 rounded-xl shadow-xs border border-white/20 group-hover:bg-white transition-colors">
              <img
                src="/logo_digital_academy.png"
                alt="Digital Academy"
                className="h-9 sm:h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="h-7 sm:h-8 w-px bg-[#DCE3EC]" />
              <img
                src="/logo_facultad.png"
                alt="Facultad de Ciencias Contables UAGRM"
                className="h-9 sm:h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Titles */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                  Control de Asistencia UAGRM
                </h1>
                <span className="bg-[#103B88] text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md border border-white/20 tracking-wide">
                  Digital Academy
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-100/90 mt-0.5 leading-snug truncate">
                Facultad de Ciencias Contables, Auditoría, Sistemas de Control de Gestión y Finanzas
              </p>
            </div>
          </div>

          {/* Navigation Area */}
          <div className="flex items-center gap-2 sm:gap-2.5 self-start lg:self-auto flex-wrap">
            {activeTab === 'ADMIN' ? (
              /* Modo Administrador Propietario Activo */
              <div className="flex items-center gap-2">
                <div className="bg-[#172033] px-3 py-1.5 rounded-xl border border-amber-300/40 flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Administrador General</span>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeTab('MAIN')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/20 text-white hover:bg-white/30 transition-all shadow-xs cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Vista General</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeTab('DOCENTE')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#174EAF] hover:bg-blue-50 transition-all shadow-xs cursor-pointer"
                >
                  <span>Portal Docente</span>
                </button>
              </div>
            ) : activeTab === 'DOCENTE' ? (
              /* Modo Docente activo */
              <div className="flex items-center gap-2">
                <div className="bg-[#103B88] px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2 text-xs font-bold text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                  <span>Portal Docente</span>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeTab('MAIN')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#174EAF] hover:bg-blue-50 transition-all shadow-xs cursor-pointer"
                  title="Volver a la vista general con los dos portales"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Vista General</span>
                </button>
                <button
                  id="btn-nav-volver-estudiante"
                  type="button"
                  onClick={() => onChangeTab('ESTUDIANTE')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all shadow-xs cursor-pointer border border-white/20"
                  title="Ir al portal del estudiante"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-200" />
                  <span>Acceso Estudiantes</span>
                </button>
              </div>
            ) : activeTab === 'ESTUDIANTE' ? (
              /* Modo Estudiante activo */
              <div className="flex items-center gap-2">
                <div className="bg-[#103B88] px-3.5 py-1.5 sm:py-2 rounded-xl border border-white/20 flex items-center gap-2 text-xs font-bold text-white shadow-2xs">
                  <UserCheck className="w-4 h-4 text-blue-200" />
                  <span>Portal Estudiante</span>
                </div>

                <button
                  type="button"
                  onClick={() => onChangeTab('MAIN')}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-white text-[#174EAF] hover:bg-blue-50 transition-all shadow-xs cursor-pointer border border-white/40"
                  title="Volver a la Vista General"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Vista General</span>
                </button>

                <button
                  id="btn-nav-acceso-portal-docente"
                  type="button"
                  onClick={() => {
                    if (onUnlockDocente) {
                      onUnlockDocente();
                    } else {
                      onChangeTab('DOCENTE');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all shadow-xs cursor-pointer border border-white/20"
                  title="Acceso al Portal Docente"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#E8F0FC]" />
                  <span>Acceso Docentes</span>
                </button>
              </div>
            ) : (
              /* Modo MAIN (Vista General de Inicio) */
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-main-estudiante"
                  type="button"
                  onClick={() => onChangeTab('ESTUDIANTE')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-white text-[#174EAF] hover:bg-blue-50 transition-all shadow-xs cursor-pointer border border-white/40"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#174EAF]" />
                  <span>Acceso a Estudiantes</span>
                </button>

                <button
                  id="btn-nav-main-docente"
                  type="button"
                  onClick={() => {
                    if (onUnlockDocente) {
                      onUnlockDocente();
                    } else {
                      onChangeTab('DOCENTE');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-[#103B88] hover:bg-[#0c2f6d] text-white transition-all shadow-xs cursor-pointer border border-white/20"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                  <span>Acceso a Docentes</span>
                </button>
              </div>
            )}

            {/* Ícono de Candado Discreto para el Administrador Propietario (Clave: 0715) */}
            {onOpenAdminLogin && (
              <button
                id="btn-admin-candado"
                type="button"
                onClick={onOpenAdminLogin}
                className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer border border-white/20 shadow-xs flex items-center justify-center group"
                title="Acceso de Gestión con Clave"
              >
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};



