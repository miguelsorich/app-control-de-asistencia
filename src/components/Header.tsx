import React, { useRef } from 'react';
import { UserCheck, ShieldCheck, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal?: () => void;
  totalAsignaturas: number;
  totalEstudiantes: number;
  activeTab: 'MAIN' | 'DOCENTE' | 'ESTUDIANTE';
  onChangeTab: (tab: 'MAIN' | 'DOCENTE' | 'ESTUDIANTE') => void;
  activeSubjectName?: string | null;
  onNavigateHome?: () => void;
  onUnlockDocente?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onChangeTab,
  onUnlockDocente,
}) => {
  const clickCountRef = useRef<number>(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manejador secreto de 3 clics para acceder al portal docente / administrador
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
          {/* Logos & Title Container - Zona con detector secreto de 3 clics */}
          <div
            onClick={handleSecretTripleClick}
            className="flex items-center gap-3 sm:gap-4 cursor-pointer select-none group"
            title="Control de Asistencia UAGRM"
          >
            {/* Logos Group */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 bg-white/95 p-1.5 sm:p-2 rounded-xl shadow-xs border border-white/20 group-hover:bg-white transition-colors">
              {/* Logo Digital Academy */}
              <img
                src="/logo_digital_academy.png"
                alt="Digital Academy"
                className="h-9 sm:h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              {/* Divider */}
              <div className="h-7 sm:h-8 w-px bg-[#DCE3EC]" />
              {/* Logo Facultad */}
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

          {/* Navigation Area: Para los estudiantes solo se muestra la identidad del Portal Estudiante */}
          <div className="flex items-center gap-2 sm:gap-3 self-start lg:self-auto flex-wrap">
            {activeTab === 'DOCENTE' ? (
              /* Modo Docente / Administrador activo (Desbloqueado tras los 3 clics) */
              <div className="flex items-center gap-2">
                <div className="bg-[#103B88] px-3 py-1.5 rounded-xl border border-amber-300/40 flex items-center gap-2 text-xs font-bold text-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Panel</span> Docente / Admin
                </div>
                <button
                  id="btn-nav-volver-estudiante"
                  type="button"
                  onClick={() => onChangeTab('ESTUDIANTE')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#174EAF] hover:bg-blue-50 transition-all shadow-xs cursor-pointer"
                  title="Volver a la vista del estudiante"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Vista Estudiante</span>
                </button>
              </div>
            ) : (
              /* Vista oficial del Estudiante: Limpia, sin enlaces ni pestañas del portal docente */
              <div className="bg-[#103B88] px-3.5 py-1.5 sm:py-2 rounded-xl border border-white/20 flex items-center gap-2 text-xs font-bold text-white shadow-2xs">
                <UserCheck className="w-4 h-4 text-blue-200" />
                <span>Portal Estudiante</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};



