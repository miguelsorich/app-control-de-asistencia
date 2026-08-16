import React from 'react';
import { UserCheck, LayoutGrid, Home } from 'lucide-react';
import { SupabaseSyncBadge } from './SupabaseSyncBadge';

interface HeaderProps {
  onOpenAddModal?: () => void;
  totalAsignaturas: number;
  totalEstudiantes: number;
  activeTab: 'MAIN' | 'DOCENTE' | 'ESTUDIANTE';
  onChangeTab: (tab: 'MAIN' | 'DOCENTE' | 'ESTUDIANTE') => void;
  activeSubjectName?: string | null;
  onNavigateHome?: () => void;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onChangeTab,
  onNavigateHome,
  onManualSync,
  isSyncing,
}) => {
  return (
    <header id="header-uagrm" className="bg-[#174EAF] text-white border-b border-[#103B88] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 sm:gap-4">
          {/* Logos & Title Container */}
          <div
            onClick={onNavigateHome || (() => onChangeTab('MAIN'))}
            className="flex items-center gap-3 sm:gap-4 cursor-pointer group"
            title="Ir a la pantalla principal de acceso"
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

          {/* Controls: Supabase Badge & Navigation Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 self-start lg:self-auto flex-wrap">
            <SupabaseSyncBadge onManualSync={onManualSync} isSyncing={isSyncing} />

            <div className="bg-[#103B88] p-1 rounded-xl border border-white/15 flex items-center gap-1">
              <button
                id="tab-nav-inicio"
                type="button"
                onClick={() => onChangeTab('MAIN')}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'MAIN'
                    ? 'bg-white text-[#174EAF] shadow-xs'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
                title="Pantalla principal de acceso"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Inicio</span>
              </button>

              <button
                id="tab-nav-estudiante"
                type="button"
                onClick={() => onChangeTab('ESTUDIANTE')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ESTUDIANTE'
                    ? 'bg-white text-[#174EAF] shadow-xs'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Portal Estudiante</span>
              </button>

              <button
                id="tab-nav-docente"
                type="button"
                onClick={() => onChangeTab('DOCENTE')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'DOCENTE'
                    ? 'bg-white text-[#174EAF] shadow-xs'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Portal Docente</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};


