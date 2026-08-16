import React, { useState } from 'react';
import { Asignatura, Estudiante, MODALIDADES } from '../../src/types';
import { formatTimeRange } from '../utils/timeHelpers';
import {
  ArrowLeft,
  Upload,
  Search,
  Users,
  Clock,
  Calendar,
  MapPin,
  Mail,
  Trash2,
} from 'lucide-react';

interface SubjectStudentsViewProps {
  asignatura: Asignatura;
  estudiantes: Estudiante[];
  onBackToSubjects: () => void;
  onOpenImportModal: () => void;
  onDeleteStudent: (studentId: string, studentName: string) => void;
}

export const SubjectStudentsView: React.FC<SubjectStudentsViewProps> = ({
  asignatura,
  estudiantes,
  onBackToSubjects,
  onOpenImportModal,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const modConfig = MODALIDADES[asignatura.modalidad] || MODALIDADES.LUN_MIE_VIE;

  const filteredEstudiantes = estudiantes.filter((est) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      est.registroUniversitario.toLowerCase().includes(term) ||
      est.nombreCompleto.toLowerCase().includes(term) ||
      est.correoElectronico.toLowerCase().includes(term)
    );
  });

  return (
    <div id="subject-students-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          id="btn-back-to-subjects"
          type="button"
          onClick={onBackToSubjects}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#174EAF] hover:text-[#103B88] bg-white hover:bg-[#E8F0FC] border border-[#174EAF] px-3.5 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Asignaturas</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="btn-import-students-top"
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#174EAF] hover:bg-[#103B88] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Estudiantes (Excel / CSV)</span>
          </button>
        </div>
      </div>

      {/* Selected Subject Banner Card */}
      <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#174EAF] text-white text-xs font-extrabold px-3 py-1 rounded-lg font-mono tracking-wider">
                {asignatura.sigla}
              </span>
              <span className="bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC] text-xs font-bold px-2.5 py-1 rounded-lg">
                Grupo {asignatura.grupo}
              </span>
              <span className="bg-[#F5F7FA] text-[#172033] border border-[#DCE3EC] text-xs font-semibold px-2.5 py-1 rounded-lg">
                Semestre {asignatura.semestre || 1} · {asignatura.año || 2026}
              </span>
              {asignatura.aula && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#667085] bg-[#F5F7FA] border border-[#DCE3EC]">
                  <MapPin className="w-3.5 h-3.5 text-[#667085]" />
                  {asignatura.aula}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[#172033] leading-tight">
              {asignatura.nombre}
            </h1>

            <div className="flex items-center gap-4 text-xs text-[#667085] flex-wrap pt-1">
              <div className="flex items-center gap-1.5 font-medium text-[#172033]">
                <Calendar className="w-3.5 h-3.5 text-[#174EAF]" />
                <span className="font-bold text-[#172033]">{modConfig.label}</span>
                <span className="text-[#667085]">({modConfig.clasesPorSemana} clases/sem)</span>
              </div>

              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#667085]" />
                <span className="font-bold text-[#172033] bg-[#E8F0FC] px-2 py-0.5 rounded border border-[#DCE3EC]">
                  {formatTimeRange(asignatura.horaInicio, asignatura.horaFin)}
                </span>
              </div>
            </div>
          </div>

          {/* Student count summary metric */}
          <div className="flex items-center gap-4 bg-white border border-[#DCE3EC] rounded-xl p-4 lg:min-w-[240px] justify-between shadow-2xs">
            <div className="w-12 h-12 rounded-xl bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-[#667085] uppercase tracking-wider">
                Total Estudiantes
              </p>
              <p className="text-2xl font-black text-[#172033] mt-0.5">
                {estudiantes.length}
              </p>
              <p className="text-[11px] text-[#667085]">Inscritos en el grupo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student List Section */}
      <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#DCE3EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F5F7FA]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-students"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Registro Universitario, Nombre o Correo..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-[#DCE3EC] focus:outline-none focus:ring-2 focus:ring-[#174EAF] bg-white text-[#172033]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#667085] hover:text-[#172033] cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#667085] font-medium">
            <span>
              Mostrando {filteredEstudiantes.length} de {estudiantes.length} estudiantes
            </span>
          </div>
        </div>

        {/* Student Table */}
        {filteredEstudiantes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#E8F0FC] text-[#172033] font-bold border-b border-[#DCE3EC] uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center text-[#667085]">#</th>
                  <th className="py-3 px-4">Registro Universitario</th>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4">Correo Electrónico</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE3EC] bg-white">
                {filteredEstudiantes.map((est, index) => (
                  <tr
                    key={est.id}
                    id={`student-row-${est.id}`}
                    className="hover:bg-[#E8F0FC]/30 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center text-[#667085] font-mono text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#172033]">
                      <span className="bg-[#E8F0FC] text-[#174EAF] group-hover:bg-white px-2 py-0.5 rounded border border-[#DCE3EC]">
                        {est.registroUniversitario}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#172033]">
                      {est.nombreCompleto}
                    </td>
                    <td className="py-3 px-4 text-[#667085]">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#667085] flex-shrink-0" />
                        <span className="font-mono text-[11px]">
                          {est.correoElectronico}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onDeleteStudent(est.id, est.nombreCompleto)
                        }
                        className="p-1 text-[#667085] hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Eliminar de esta asignatura"
                        aria-label={`Eliminar a ${est.nombreCompleto}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty Students State */
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center mb-3">
              <Users className="w-7 h-7" />
            </div>
            {searchTerm ? (
              <>
                <h3 className="text-base font-bold text-[#172033]">
                  No se encontraron estudiantes
                </h3>
                <p className="text-xs text-[#667085] mt-1 max-w-sm">
                  Ningún estudiante coincide con el criterio de búsqueda "{searchTerm}".
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-3 px-3.5 py-1.5 text-xs font-bold text-[#174EAF] hover:text-[#103B88] bg-white hover:bg-[#E8F0FC] border border-[#174EAF] rounded-lg transition-colors cursor-pointer"
                >
                  Limpiar búsqueda
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-[#172033]">
                  Aún no hay estudiantes en esta asignatura
                </h3>
                <p className="text-xs text-[#667085] mt-1 max-w-sm">
                  Utilice la opción de importación para cargar su lista oficial de estudiantes desde un archivo Excel (.xlsx) o CSV.
                </p>
                <button
                  id="btn-import-first-students"
                  onClick={onOpenImportModal}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#174EAF] hover:bg-[#103B88] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importar Estudiantes (Excel / CSV)</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
