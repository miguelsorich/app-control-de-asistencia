import React, { useState, useMemo } from 'react';
import {
  Asignatura,
  Estudiante,
  RegistroAsistencia,
} from '../types';
import {
  History,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  ShieldCheck,
  Hash,
} from 'lucide-react';

interface AttendanceMarkingHistoryProps {
  asignaturas: Asignatura[];
  estudiantes: Estudiante[];
  registrosAsistencia: RegistroAsistencia[];
  isAdmin?: boolean;
  className?: string;
}

export const AttendanceMarkingHistory: React.FC<AttendanceMarkingHistoryProps> = ({
  asignaturas,
  estudiantes,
  registrosAsistencia,
  isAdmin = false,
  className = '',
}) => {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsignaturaId, setSelectedAsignaturaId] = useState<string>('TODAS');
  const [selectedFecha, setSelectedFecha] = useState<string>('TODAS');
  const [onlyDuplicates, setOnlyDuplicates] = useState<boolean>(false);

  // Pagination state (default: 20 per page as specified)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Quick lookup maps
  const asignaturasMap = useMemo(() => {
    const map = new Map<string, Asignatura>();
    asignaturas.forEach((a) => map.set(a.id, a));
    return map;
  }, [asignaturas]);

  const estudiantesMap = useMemo(() => {
    // Key by (asignaturaId + '_' + RU.toLowerCase()) and also fallback by RU.toLowerCase()
    const map = new Map<string, Estudiante>();
    estudiantes.forEach((e) => {
      const cleanRU = e.registroUniversitario.trim().toLowerCase();
      map.set(`${e.asignaturaId}_${cleanRU}`, e);
      if (!map.has(cleanRU)) {
        map.set(cleanRU, e);
      }
    });
    return map;
  }, [estudiantes]);

  // Analyze duplicates in global records
  // Key: `${asignaturaId}_${cleanRU}_${fecha}` -> count
  const occurrenceCountMap = useMemo(() => {
    const map = new Map<string, number>();
    registrosAsistencia.forEach((r) => {
      const cleanRU = (r.registroUniversitario || '').trim().toLowerCase();
      const key = `${r.asignaturaId}_${cleanRU}_${r.fecha}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [registrosAsistencia]);

  // Total duplicated records count
  const duplicateRecordsCount = useMemo(() => {
    let count = 0;
    const countedKeys = new Set<string>();
    registrosAsistencia.forEach((r) => {
      const cleanRU = (r.registroUniversitario || '').trim().toLowerCase();
      const key = `${r.asignaturaId}_${cleanRU}_${r.fecha}`;
      const occ = occurrenceCountMap.get(key) || 0;
      if (occ > 1 && !countedKeys.has(key)) {
        countedKeys.add(key);
        count += (occ - 1);
      }
    });
    return count;
  }, [registrosAsistencia, occurrenceCountMap]);

  // Unique available dates in the records for the date filter dropdown
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    registrosAsistencia.forEach((r) => {
      if (r.fecha) dates.add(r.fecha);
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [registrosAsistencia]);

  // Today markings count
  const todayMarkingsCount = useMemo(() => {
    return registrosAsistencia.filter((r) => r.fecha === todayStr).length;
  }, [registrosAsistencia, todayStr]);

  // Filtered and sorted records (most recent first)
  const filteredRecords = useMemo(() => {
    // Sort all records descending by timestamp (or fallback date + hora)
    const sorted = [...registrosAsistencia].sort((a, b) => {
      const tsA = a.timestamp || 0;
      const tsB = b.timestamp || 0;
      if (tsB !== tsA) return tsB - tsA;
      // Secondary fallback
      const dateCmp = (b.fecha || '').localeCompare(a.fecha || '');
      if (dateCmp !== 0) return dateCmp;
      return (b.horaMarcado || '').localeCompare(a.horaMarcado || '');
    });

    const term = searchTerm.trim().toLowerCase();

    return sorted.filter((r) => {
      const cleanRU = (r.registroUniversitario || '').trim().toLowerCase();
      const key = `${r.asignaturaId}_${cleanRU}_${r.fecha}`;
      const occurrences = occurrenceCountMap.get(key) || 1;

      // Duplicate filter
      if (onlyDuplicates && occurrences <= 1) {
        return false;
      }

      // Asignatura filter
      if (selectedAsignaturaId !== 'TODAS' && r.asignaturaId !== selectedAsignaturaId) {
        return false;
      }

      // Fecha filter
      if (selectedFecha !== 'TODAS' && r.fecha !== selectedFecha) {
        return false;
      }

      // Search term
      if (term) {
        const student =
          estudiantesMap.get(`${r.asignaturaId}_${cleanRU}`) ||
          estudiantesMap.get(cleanRU);
        const studentName = (student?.nombreCompleto || '').toLowerCase();
        const asig = asignaturasMap.get(r.asignaturaId);
        const asigName = (asig?.nombre || '').toLowerCase();
        const asigSigla = (asig?.sigla || '').toLowerCase();
        const asigGrupo = (asig?.grupo || '').toLowerCase();

        const matches =
          cleanRU.includes(term) ||
          studentName.includes(term) ||
          asigName.includes(term) ||
          asigSigla.includes(term) ||
          asigGrupo.includes(term) ||
          (r.fecha || '').includes(term) ||
          (r.horaMarcado || '').includes(term);

        if (!matches) return false;
      }

      return true;
    });
  }, [
    registrosAsistencia,
    searchTerm,
    selectedAsignaturaId,
    selectedFecha,
    onlyDuplicates,
    occurrenceCountMap,
    estudiantesMap,
    asignaturasMap,
  ]);

  // Pagination calculation
  const totalRecords = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice(startIndex, endIndex);
  }, [filteredRecords, startIndex, endIndex]);

  // Reset pagination when filters change
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleAsignaturaChange = (val: string) => {
    setSelectedAsignaturaId(val);
    setCurrentPage(1);
  };

  const handleFechaChange = (val: string) => {
    setSelectedFecha(val);
    setCurrentPage(1);
  };

  const handleOnlyDuplicatesToggle = () => {
    setOnlyDuplicates((prev) => !prev);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedAsignaturaId('TODAS');
    setSelectedFecha('TODAS');
    setOnlyDuplicates(false);
    setCurrentPage(1);
  };

  return (
    <div
      id="historial-de-marcaciones-component"
      className={`bg-white rounded-2xl border border-[#DCE3EC] shadow-xs overflow-hidden ${className}`}
    >
      {/* Component Header */}
      <div className="p-5 sm:p-6 border-b border-[#DCE3EC] bg-gradient-to-r from-white via-[#F8FAFC] to-[#EFF6FF]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#174EAF] text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-[#172033]">
                  Historial de Marcaciones
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC]">
                  {isAdmin ? 'Auditoría Global (Administrador)' : 'Mis Asignaturas'}
                </span>
                {duplicateRecordsCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>{duplicateRecordsCount} duplicados detectados</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Sin duplicados activos</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                {isAdmin
                  ? 'Muestra todas las marcaciones de asistencia registradas en la facultad en tiempo real para auditoría institucional, supervisión de docentes y detección de inconsistencias.'
                  : 'Muestra las marcaciones de asistencia de los estudiantes inscritos en tus asignaturas en orden cronológico inverso para auditoría y verificación en tiempo real.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-[#DCE3EC] shadow-2xs text-center">
              <p className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider">
                Total Global
              </p>
              <p className="text-sm font-black text-[#172033]">
                {registrosAsistencia.length.toLocaleString()}
              </p>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-xl border border-[#DCE3EC] shadow-2xs text-center">
              <p className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider">
                Marcadas Hoy
              </p>
              <p className="text-sm font-black text-[#174EAF]">
                {todayMarkingsCount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-xl border border-[#DCE3EC] shadow-2xs text-center">
              <p className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider">
                Por Página
              </p>
              <p className="text-sm font-black text-[#172033]">
                {pageSize}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-4 border-t border-[#DCE3EC]">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-historial-busqueda"
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por RU, Estudiante o Materia..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-[#DCE3EC] bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF] text-[#172033] placeholder:text-[#667085]"
            />
          </div>

          {/* Asignatura Select */}
          <div className="lg:col-span-3">
            <select
              id="select-historial-asignatura"
              value={selectedAsignaturaId}
              onChange={(e) => handleAsignaturaChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE3EC] bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF] text-[#172033]"
            >
              <option value="TODAS">Todas las Asignaturas ({asignaturas.length})</option>
              {asignaturas.map((asig) => (
                <option key={asig.id} value={asig.id}>
                  {asig.sigla} - {asig.grupo} ({asig.nombre})
                </option>
              ))}
            </select>
          </div>

          {/* Date Select */}
          <div className="lg:col-span-2.5">
            <select
              id="select-historial-fecha"
              value={selectedFecha}
              onChange={(e) => handleFechaChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DCE3EC] bg-white focus:outline-none focus:ring-2 focus:ring-[#174EAF] text-[#172033]"
            >
              <option value="TODAS">Todas las fechas ({availableDates.length})</option>
              {availableDates.map((fecha) => (
                <option key={fecha} value={fecha}>
                  {fecha === todayStr ? `Hoy (${fecha})` : fecha}
                </option>
              ))}
            </select>
          </div>

          {/* Duplicates Toggle & Reset */}
          <div className="lg:col-span-2.5 flex items-center gap-2">
            <button
              id="btn-toggle-solo-duplicados"
              type="button"
              onClick={handleOnlyDuplicatesToggle}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                onlyDuplicates
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-white text-[#667085] hover:text-[#172033] border-[#DCE3EC] hover:bg-[#F8FAFC]'
              }`}
              title="Filtrar solo marcaciones duplicadas del mismo alumno en la misma fecha"
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${onlyDuplicates ? 'text-amber-700' : 'text-[#667085]'}`} />
              <span>Solo Duplicados</span>
            </button>

            {(searchTerm || selectedAsignaturaId !== 'TODAS' || selectedFecha !== 'TODAS' || onlyDuplicates) && (
              <button
                id="btn-reset-historial-filtros"
                type="button"
                onClick={handleResetFilters}
                className="p-2 rounded-xl border border-[#DCE3EC] text-[#667085] hover:text-[#174EAF] hover:bg-[#E8F0FC] transition-colors cursor-pointer"
                title="Limpiar filtros"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#DCE3EC] text-[#667085] font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3.5 text-center w-12">#</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Fecha y Hora</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Registro (RU)</th>
              <th className="py-3 px-3.5">Estudiante</th>
              <th className="py-3 px-3.5">Asignatura</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Estado</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">Auditoría / Verificación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DCE3EC]">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#667085]">
                  <div className="max-w-xs mx-auto space-y-2">
                    {asignaturas.length === 0 ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center mx-auto">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-sm text-[#172033]">
                          Sin asignaturas asignadas
                        </p>
                        <p className="text-xs text-[#667085]">
                          Tu cuenta aún no tiene asignaturas asignadas. Agrega o selecciona materias para comenzar a registrar la asistencia de tus alumnos.
                        </p>
                      </>
                    ) : registrosAsistencia.length === 0 ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center mx-auto">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-sm text-[#172033]">
                          Sin marcaciones registradas
                        </p>
                        <p className="text-xs text-[#667085]">
                          Aún no existen marcaciones de asistencia de estudiantes registradas para tus asignaturas.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center mx-auto">
                          <Search className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-sm text-[#172033]">
                          No se encontraron registros
                        </p>
                        <p className="text-xs text-[#667085]">
                          No hay registros que coincidan con los filtros aplicados.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs font-bold text-[#174EAF] hover:underline cursor-pointer"
                        >
                          Restablecer filtros
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((registro, idx) => {
                const globalIndex = startIndex + idx + 1;
                const cleanRU = (registro.registroUniversitario || '').trim().toLowerCase();
                const student =
                  estudiantesMap.get(`${registro.asignaturaId}_${cleanRU}`) ||
                  estudiantesMap.get(cleanRU);
                const asig = asignaturasMap.get(registro.asignaturaId);

                const key = `${registro.asignaturaId}_${cleanRU}_${registro.fecha}`;
                const occurrences = occurrenceCountMap.get(key) || 1;
                const hasDuplicate = occurrences > 1;
                const isToday = registro.fecha === todayStr;

                return (
                  <tr
                    key={registro.id || `reg-${idx}-${registro.timestamp}`}
                    className={`hover:bg-[#F9FAFC] transition-colors ${
                      hasDuplicate ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    {/* Index Number */}
                    <td className="py-3 px-3.5 text-center font-mono text-[11px] text-[#667085] font-semibold">
                      {globalIndex}
                    </td>

                    {/* Date and Time */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#174EAF]" />
                          <span className="font-bold text-[#172033]">
                            {registro.fecha}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.2 bg-[#E8F0FC] text-[#174EAF] text-[10px] font-bold rounded">
                              Hoy
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[#667085] text-[11px] mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span className="font-mono">{registro.horaMarcado || '--:--:--'}</span>
                        </div>
                      </div>
                    </td>

                    {/* RU */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold bg-[#F5F7FA] text-[#172033] px-2 py-0.5 rounded border border-[#DCE3EC]">
                        {registro.registroUniversitario}
                      </span>
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-[#172033]">
                            {student?.nombreCompleto || 'Estudiante (Sin lista importada)'}
                          </p>
                          {student?.correoElectronico && (
                            <p className="text-[11px] text-[#667085] truncate max-w-[200px]">
                              {student.correoElectronico}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3 px-3.5">
                      {asig ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#174EAF]">
                              {asig.sigla}
                            </span>
                            <span className="text-[10px] font-bold bg-[#F5F7FA] text-[#667085] px-1.5 py-0.2 rounded border border-[#DCE3EC]">
                              Gr. {asig.grupo}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#667085] truncate max-w-[200px]">
                            {asig.nombre}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[#667085] italic">ID: {registro.asignaturaId}</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{registro.estado}</span>
                      </span>
                    </td>

                    {/* Duplicate / Audit Check */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      {hasDuplicate ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                          title={`El estudiante tiene ${occurrences} registros registrados en esta misma fecha`}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Repetido ({occurrences} veces en fecha)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F5F7FA] text-[#667085] border border-[#DCE3EC]">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          <span>Válido único</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-[#F8FAFC] border-t border-[#DCE3EC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Info */}
        <div className="text-[#667085] flex items-center gap-2">
          <span>
            Mostrando <strong>{totalRecords === 0 ? 0 : startIndex + 1}</strong> a{' '}
            <strong>{endIndex}</strong> de <strong>{totalRecords.toLocaleString()}</strong> registros de tus asignaturas
          </span>
          {onlyDuplicates && (
            <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded text-[10px]">
              (Filtrado por duplicados)
            </span>
          )}
        </div>

        {/* Page Size & Navigation Controls */}
        <div className="flex items-center gap-3">
          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-[#667085]">
            <span className="text-[11px]">Filas:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-[#DCE3EC] rounded-lg text-xs font-semibold text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#174EAF]"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              id="btn-historial-first-page"
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(1)}
              className="p-1.5 rounded-lg border border-[#DCE3EC] bg-white text-[#172033] hover:bg-[#E8F0FC] hover:text-[#174EAF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Primera página"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-historial-prev-page"
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#DCE3EC] bg-white text-[#172033] hover:bg-[#E8F0FC] hover:text-[#174EAF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2.5 py-1 text-xs font-bold text-[#172033] bg-white border border-[#DCE3EC] rounded-lg">
              {safePage} / {totalPages}
            </span>

            <button
              id="btn-historial-next-page"
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#DCE3EC] bg-white text-[#172033] hover:bg-[#E8F0FC] hover:text-[#174EAF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-historial-last-page"
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1.5 rounded-lg border border-[#DCE3EC] bg-white text-[#172033] hover:bg-[#E8F0FC] hover:text-[#174EAF] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Última página"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
