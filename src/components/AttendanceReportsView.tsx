import React, { useState, useMemo } from 'react';
import { Asignatura, Estudiante, RegistroAsistencia, MODALIDADES } from '../types';
import { formatTimeRange } from '../utils/timeHelpers';
import {
  buildAttendanceReportData,
  exportReportToExcel,
  exportReportToCSV,
} from '../utils/reportExporter';
import {
  FileSpreadsheet,
  Download,
  Search,
  FileText,
  ChevronDown,
  Info,
} from 'lucide-react';

interface AttendanceReportsViewProps {
  asignaturas: Asignatura[];
  estudiantes: Estudiante[];
  registrosAsistencia: RegistroAsistencia[];
  initialSelectedSubjectId?: string | null;
  onSelectSubjectForView?: (asig: Asignatura) => void;
}

export const AttendanceReportsView: React.FC<AttendanceReportsViewProps> = ({
  asignaturas,
  estudiantes,
  registrosAsistencia,
  initialSelectedSubjectId,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (initialSelectedSubjectId && asignaturas.some((a) => a.id === initialSelectedSubjectId)) {
      return initialSelectedSubjectId;
    }
    return asignaturas[0]?.id || '';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const selectedSubject = asignaturas.find((a) => a.id === selectedSubjectId) || asignaturas[0];

  // Build report data for the selected subject
  const reportData = useMemo(() => {
    if (!selectedSubject) return null;
    return buildAttendanceReportData(selectedSubject, estudiantes, registrosAsistencia);
  }, [selectedSubject, estudiantes, registrosAsistencia]);

  // Filter students in the table by RU or Name search
  const filteredFilas = useMemo(() => {
    if (!reportData) return [];
    if (!searchTerm.trim()) return reportData.filas;
    const term = searchTerm.toLowerCase().trim();
    return reportData.filas.filter(
      (f) =>
        f.nombreCompleto.toLowerCase().includes(term) ||
        f.registroUniversitario.toLowerCase().includes(term)
    );
  }, [reportData, searchTerm]);

  const handleExportExcel = () => {
    if (!selectedSubject || !reportData) return;
    exportReportToExcel(selectedSubject, reportData);
    setIsExportDropdownOpen(false);
  };

  const handleExportCSV = () => {
    if (!selectedSubject || !reportData) return;
    exportReportToCSV(selectedSubject, reportData);
    setIsExportDropdownOpen(false);
  };

  return (
    <div id="attendance-reports-module" className="space-y-6 animate-in fade-in duration-200">
      {/* Module Title Banner */}
      <div className="bg-white rounded-2xl border border-[#DCE3EC] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#174EAF] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#172033]">
                Reportes Oficiales de Asistencia
              </h2>
              <span className="bg-[#E8F0FC] text-[#174EAF] text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#DCE3EC]">
                Consulta y Exportación
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Consulte y exporte el registro de asistencia de los estudiantes por asignatura en formato Excel o CSV.
            </p>
          </div>
        </div>

        {/* Export action button */}
        {selectedSubject && reportData && (
          <div className="relative self-start md:self-auto">
            <button
              id="btn-exportar-reporte-menu"
              type="button"
              onClick={() => setIsExportDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#174EAF] hover:bg-[#103B88] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar reporte</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {isExportDropdownOpen && (
              <div
                id="dropdown-export-options"
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-[#DCE3EC] shadow-lg py-1.5 z-30 animate-in fade-in duration-100"
              >
                <button
                  id="btn-export-excel"
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#172033] hover:bg-[#E8F0FC] hover:text-[#174EAF] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#174EAF]" />
                  <span>Exportar a Excel (.xlsx)</span>
                </button>
                <button
                  id="btn-export-csv"
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#172033] hover:bg-[#E8F0FC] hover:text-[#174EAF] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#174EAF]" />
                  <span>Exportar a CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subject Selector & Subject Details Header */}
      {selectedSubject ? (
        <div className="bg-white rounded-2xl border border-[#DCE3EC] p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Subject Dropdown Selector */}
            <div className="flex-1 max-w-md">
              <label
                htmlFor="select-report-subject"
                className="block text-xs font-bold text-[#172033] mb-1.5"
              >
                Seleccionar Asignatura para el Reporte:
              </label>
              <select
                id="select-report-subject"
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setIsExportDropdownOpen(false);
                }}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#DCE3EC] focus:outline-none focus:ring-2 focus:ring-[#174EAF] bg-white text-[#172033] cursor-pointer"
              >
                {asignaturas.map((asig) => (
                  <option key={asig.id} value={asig.id}>
                    {asig.sigla} - {asig.nombre} (Grupo {asig.grupo})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject details chips */}
            <div className="flex items-center gap-4 text-xs text-[#667085] flex-wrap bg-[#F5F7FA] p-3 rounded-xl border border-[#DCE3EC]">
              <div>
                <span className="text-[#667085] text-[11px] block font-medium">Materia:</span>
                <span className="font-bold text-[#172033]">
                  {selectedSubject.sigla} - {selectedSubject.nombre} (G{selectedSubject.grupo})
                </span>
              </div>
              <div className="h-6 w-px bg-[#DCE3EC] hidden sm:block" />
              <div>
                <span className="text-[#667085] text-[11px] block font-medium">Días de clase:</span>
                <span className="font-semibold text-[#172033]">
                  {MODALIDADES[selectedSubject.modalidad]?.label}
                </span>
              </div>
              <div className="h-6 w-px bg-[#DCE3EC] hidden sm:block" />
              <div>
                <span className="text-[#667085] text-[11px] block font-medium">Horario:</span>
                <span className="font-mono font-bold text-[#172033]">
                  {formatTimeRange(selectedSubject.horaInicio, selectedSubject.horaFin)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#DCE3EC] p-8 text-center text-xs text-[#667085]">
          No hay asignaturas disponibles para generar reportes.
        </div>
      )}

      {/* Report Table Card */}
      {selectedSubject && reportData && (
        <div className="bg-white rounded-2xl border border-[#DCE3EC] shadow-sm overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-[#DCE3EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F5F7FA]">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-report-students"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nombre o Registro..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#DCE3EC] focus:outline-none focus:ring-2 focus:ring-[#174EAF] bg-white text-[#172033]"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-[#667085] font-medium">
              <span>
                Total estudiantes: <strong className="text-[#172033]">{reportData.totalEstudiantes}</strong>
              </span>
              <span className="text-[#DCE3EC]">|</span>
              <span>
                Clases registradas: <strong className="text-[#172033]">{reportData.fechas.length}</strong>
              </span>
            </div>
          </div>

          {/* Table container with horizontal scroll */}
          {reportData.filas.length > 0 ? (
            <div className="overflow-x-auto">
              <table
                id="table-attendance-report"
                className="w-full text-xs text-left border-collapse min-w-[640px]"
              >
                <thead>
                  <tr className="bg-[#E8F0FC] text-[#172033] border-b border-[#DCE3EC] font-bold">
                    <th className="py-3 px-4 sticky left-0 bg-[#E8F0FC] z-10 w-36 shadow-[1px_0_0_0_#DCE3EC]">
                      Registro Universitario
                    </th>
                    <th className="py-3 px-4 min-w-[220px]">Nombre completo</th>

                    {/* Class date columns */}
                    {reportData.fechas.map((fecha) => (
                      <th
                        key={fecha}
                        className="py-3 px-3 text-center min-w-[70px] border-l border-[#DCE3EC] bg-[#E8F0FC]"
                        title={`Fecha: ${fecha}`}
                      >
                        <span className="font-mono text-[#172033]">
                          {reportData.fechasFormatted[fecha]}
                        </span>
                      </th>
                    ))}

                    {/* Total Column */}
                    <th className="py-3 px-4 text-center w-24 bg-[#E8F0FC] text-[#174EAF] border-l border-[#DCE3EC] font-black">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3EC] bg-white">
                  {filteredFilas.map((fila, idx) => (
                    <tr
                      key={fila.registroUniversitario}
                      className={`hover:bg-[#E8F0FC]/30 transition-colors ${
                        idx % 2 === 1 ? 'bg-[#F5F7FA]/40' : 'bg-white'
                      }`}
                    >
                      {/* Registro Universitario */}
                      <td className="py-2.5 px-4 font-mono font-bold text-[#174EAF] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#DCE3EC]">
                        {fila.registroUniversitario}
                      </td>

                      {/* Nombre completo */}
                      <td className="py-2.5 px-4 font-medium text-[#172033]">
                        {fila.nombreCompleto}
                      </td>

                      {/* Attendance values: 1 for Presente, 0 for Ausente */}
                      {reportData.fechas.map((fecha) => {
                        const val = fila.attendanceByDate[fecha] ?? 0;
                        return (
                          <td
                            key={fecha}
                            className={`py-2.5 px-3 text-center font-mono font-bold border-l border-[#DCE3EC] ${
                              val === 1
                                ? 'text-[#174EAF] bg-[#E8F0FC]/40'
                                : 'text-[#667085]/60 bg-[#F5F7FA]/40'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}

                      {/* Total Column */}
                      <td className="py-2.5 px-4 text-center font-mono font-black text-sm text-[#174EAF] bg-[#E8F0FC]/50 border-l border-[#DCE3EC]">
                        {fila.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#667085]">
              No hay estudiantes inscritos en esta asignatura.
            </div>
          )}

          {reportData.fechas.length === 0 && reportData.filas.length > 0 && (
            <div className="p-4 bg-[#E8F0FC]/50 border-t border-[#DCE3EC] text-xs text-[#174EAF] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#174EAF] flex-shrink-0 mt-0.5" />
              <span>
                Esta asignatura aún no tiene clases con registros de asistencia marcados. Cuando los estudiantes registren su asistencia en el Portal del Estudiante, las fechas aparecerán automáticamente ordenadas en columnas independientes.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
