import React from 'react';
import { Asignatura, MODALIDADES, SesionHabilitacion } from '../types';
import { formatTimeRange } from '../utils/timeHelpers';
import { isSesionVigente, getTodayDateString } from '../utils/scheduleValidators';
import { Clock, Calendar, MapPin, Edit2, Trash2, Users, Upload, Timer, FileSpreadsheet, Mail } from 'lucide-react';

interface SubjectCardProps {
  asignatura: Asignatura;
  studentCount: number;
  session?: SesionHabilitacion;
  onEdit: (asignatura: Asignatura) => void;
  onDelete: (id: string, nombre: string) => void;
  onSelectSubject: (asignatura: Asignatura) => void;
  onImportStudents: (asignatura: Asignatura) => void;
  onOpenEnablement?: (asignatura: Asignatura) => void;
  onOpenReports?: (asignatura: Asignatura) => void;
  onOpenGrades?: (asignatura: Asignatura) => void;
  onOpenEmails?: (asignatura: Asignatura) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  asignatura,
  studentCount,
  session,
  onEdit,
  onDelete,
  onSelectSubject,
  onImportStudents,
  onOpenEnablement,
  onOpenReports,
  onOpenGrades,
  onOpenEmails,
}) => {
  const modConfig = MODALIDADES[asignatura.modalidad] || MODALIDADES.LUN_MIE_VIE;
  const isSessionActive = isSesionVigente(session, Date.now(), getTodayDateString());

  const getDurationHint = () => {
    if (modConfig.duracionClaseMinutos === 90) return '1h 30m c/u';
    if (modConfig.duracionClaseMinutos === 135) return '2h 15m c/u';
    return '4h 30m';
  };

  return (
    <div
      id={`card-asignatura-${asignatura.id}`}
      className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
    >
      {/* Top Bar with Sigla, Grupo and Actions */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#174EAF] text-white tracking-wide font-mono">
              {asignatura.sigla}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC]">
              <Users className="w-3 h-3 text-[#174EAF]" />
              Grupo {asignatura.grupo}
            </span>
            {asignatura.aula && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-[#667085] bg-[#F5F7FA] border border-[#DCE3EC]">
                <MapPin className="w-3 h-3 text-[#667085]" />
                {asignatura.aula}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
            <button
              id={`btn-edit-${asignatura.id}`}
              onClick={() => onEdit(asignatura)}
              className="p-1.5 text-[#667085] hover:text-[#174EAF] hover:bg-[#E8F0FC] rounded-lg transition-colors cursor-pointer"
              title="Editar asignatura"
              aria-label={`Editar ${asignatura.nombre}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              id={`btn-delete-${asignatura.id}`}
              onClick={() => onDelete(asignatura.id, asignatura.nombre)}
              className="p-1.5 text-[#667085] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Eliminar asignatura"
              aria-label={`Eliminar ${asignatura.nombre}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nombre de la Asignatura */}
        <h3
          onClick={() => onSelectSubject(asignatura)}
          className="text-lg font-bold text-[#172033] leading-snug line-clamp-2 min-h-[3.25rem] hover:text-[#174EAF] cursor-pointer transition-colors"
          title={`Ver lista de estudiantes de ${asignatura.nombre}`}
        >
          {asignatura.nombre}
        </h3>
      </div>

      {/* Detail Specifications */}
      <div className="px-5 py-3.5 bg-[#F5F7FA] border-t border-[#DCE3EC] flex flex-col gap-2.5 text-xs text-[#667085]">
        {/* Modalidad Semanal & Días */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-[#172033]">
              <Calendar className="w-3.5 h-3.5 text-[#174EAF]" />
              <span>Modalidad:</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-[#E8F0FC] text-[#174EAF] border-[#DCE3EC]">
              {modConfig.clasesPorSemana === 1
                ? '1 clase / semana'
                : `${modConfig.clasesPorSemana} clases / semana`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1 mt-0.5">
            {modConfig.dias.map((dia) => (
              <span
                key={dia}
                className="px-2 py-0.5 bg-white border border-[#DCE3EC] text-[#172033] rounded font-medium text-[11px]"
              >
                {dia}
              </span>
            ))}
            <span className="text-[11px] text-[#667085] self-center ml-1">
              ({getDurationHint()})
            </span>
          </div>
        </div>

        {/* Horario Establecido */}
        <div className="flex items-center justify-between pt-2 border-t border-[#DCE3EC]">
          <div className="flex items-center gap-1.5 font-medium text-[#172033]">
            <Clock className="w-3.5 h-3.5 text-[#667085]" />
            <span>Horario:</span>
          </div>
          <span className="font-bold text-[#172033] bg-white px-2.5 py-1 rounded-md border border-[#DCE3EC] shadow-2xs text-xs font-mono">
            {formatTimeRange(asignatura.horaInicio, asignatura.horaFin)}
          </span>
        </div>
      </div>

      {/* Module 2 & 4: Actions Footer */}
      <div className="p-3 bg-white border-t border-[#DCE3EC] flex items-center justify-between gap-2 flex-wrap">
        <button
          id={`btn-view-students-${asignatura.id}`}
          type="button"
          onClick={() => onSelectSubject(asignatura)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#174EAF] hover:text-[#103B88] bg-white hover:bg-[#E8F0FC] border border-[#174EAF] px-2.5 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
        >
          <Users className="w-3.5 h-3.5 text-[#174EAF]" />
          <span>
            {studentCount === 0
              ? '0 alumnos'
              : `${studentCount} alumno${studentCount === 1 ? '' : 's'}`}
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            id={`btn-import-students-${asignatura.id}`}
            type="button"
            onClick={() => onImportStudents(asignatura)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#172033] bg-white hover:bg-[#E8F0FC] border border-[#DCE3EC] px-2.5 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Importar lista de estudiantes (Excel/CSV)"
          >
            <Upload className="w-3 h-3 text-[#667085]" />
            <span>Importar</span>
          </button>

          {onOpenReports && (
            <button
              id={`btn-view-reports-${asignatura.id}`}
              type="button"
              onClick={() => onOpenReports(asignatura)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#174EAF] bg-[#E8F0FC] hover:bg-[#174EAF] hover:text-white border border-[#DCE3EC] px-2.5 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Ver reporte de asistencia (Módulo 5)"
            >
              <FileSpreadsheet className="w-3 h-3 text-[#174EAF]" />
              <span>Reporte</span>
            </button>
          )}

          {onOpenGrades && (
            <button
              id={`btn-view-grades-${asignatura.id}`}
              type="button"
              onClick={() => onOpenGrades(asignatura)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#174EAF] bg-[#E8F0FC] hover:bg-[#174EAF] hover:text-white border border-[#DCE3EC] px-2.5 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Importar y ver notas de la materia (Módulo 6)"
            >
              <FileSpreadsheet className="w-3 h-3 text-[#174EAF]" />
              <span>Notas</span>
            </button>
          )}

          {onOpenEmails && (
            <button
              id={`btn-view-emails-${asignatura.id}`}
              type="button"
              onClick={() => onOpenEmails(asignatura)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#172033] bg-white hover:bg-[#E8F0FC] border border-[#DCE3EC] px-2.5 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
              title="Enviar notas y avisos por correo (Módulo 7)"
            >
              <Mail className="w-3 h-3 text-[#667085]" />
              <span>Correos</span>
            </button>
          )}

          {onOpenEnablement && (
            <button
              id={`btn-enable-attendance-${asignatura.id}`}
              type="button"
              onClick={() => onOpenEnablement(asignatura)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer ${
                isSessionActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#174EAF] hover:bg-[#103B88] text-white'
              }`}
              title="Habilitar o cerrar asistencia (Módulo 4)"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>{isSessionActive ? 'Habilitada' : 'Habilitar'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
