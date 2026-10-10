import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
  PieChart,
  Pie,
  LabelList,
} from 'recharts';
import { Asignatura, Estudiante, RegistroAsistencia, MODALIDADES } from '../types';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  PieChart as PieChartIcon,
  Award,
} from 'lucide-react';

export interface SubjectAttendanceStat {
  asignaturaId: string;
  nombre: string;
  sigla: string;
  grupo: string;
  siglaGrupo: string;
  modalidad: string;
  modalidadLabel: string;
  colorTag: string;
  totalEstudiantes: number;
  totalSesiones: number;
  totalAsistenciasPresentes: number;
  asistenciasEsperadas: number;
  porcentajeAsistencia: number; // 0 - 100
  estadoNivel: 'OPTIMO' | 'REGULAR' | 'RIESGO' | 'SIN_DATOS';
}

interface TeacherAttendanceChartsProps {
  asignaturas: Asignatura[];
  estudiantes: Estudiante[];
  registrosAsistencia: RegistroAsistencia[];
  onNavigateToReport?: (asignaturaId: string) => void;
}

export const TeacherAttendanceCharts: React.FC<TeacherAttendanceChartsProps> = ({
  asignaturas,
  estudiantes,
  registrosAsistencia,
  onNavigateToReport,
}) => {
  // Filters & display toggles
  const [selectedModalidadFilter, setSelectedModalidadFilter] = useState<string>('TODAS');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC' | 'ALFA'>('DESC');
  const [activeChartTab, setActiveChartTab] = useState<'BAR' | 'DISTRIBUTION'>('BAR');

  // Calculate statistics per subject
  const subjectStats: SubjectAttendanceStat[] = useMemo(() => {
    return asignaturas.map((asig) => {
      const subjectStudents = estudiantes.filter((e) => e.asignaturaId === asig.id);
      const totalEstudiantes = subjectStudents.length;

      const subjectRecords = registrosAsistencia.filter((r) => r.asignaturaId === asig.id);

      // Unique dates with records for this subject
      const uniqueDates = Array.from(
        new Set(subjectRecords.filter((r) => r.fecha).map((r) => r.fecha))
      );
      const totalSesiones = uniqueDates.length;

      // Count only 'PRESENTE' marks
      const totalAsistenciasPresentes = subjectRecords.filter(
        (r) => r.estado === 'PRESENTE'
      ).length;

      const asistenciasEsperadas = totalEstudiantes * totalSesiones;

      let porcentajeAsistencia = 0;
      if (asistenciasEsperadas > 0) {
        porcentajeAsistencia = Number(
          ((totalAsistenciasPresentes / asistenciasEsperadas) * 100).toFixed(1)
        );
      }

      let estadoNivel: SubjectAttendanceStat['estadoNivel'] = 'SIN_DATOS';
      if (totalSesiones === 0 || totalEstudiantes === 0) {
        estadoNivel = 'SIN_DATOS';
      } else if (porcentajeAsistencia >= 80) {
        estadoNivel = 'OPTIMO';
      } else if (porcentajeAsistencia >= 65) {
        estadoNivel = 'REGULAR';
      } else {
        estadoNivel = 'RIESGO';
      }

      const modInfo = MODALIDADES[asig.modalidad];
      const modalidadLabel = modInfo ? modInfo.label : asig.modalidad;

      return {
        asignaturaId: asig.id,
        nombre: asig.nombre,
        sigla: asig.sigla,
        grupo: asig.grupo,
        siglaGrupo: `${asig.sigla} (${asig.grupo})`,
        modalidad: asig.modalidad,
        modalidadLabel,
        colorTag: asig.colorTag || '#174EAF',
        totalEstudiantes,
        totalSesiones,
        totalAsistenciasPresentes,
        asistenciasEsperadas,
        porcentajeAsistencia,
        estadoNivel,
      };
    });
  }, [asignaturas, estudiantes, registrosAsistencia]);

  // Global KPIs
  const globalKPIs = useMemo(() => {
    const activeSubjectsWithData = subjectStats.filter(
      (s) => s.totalSesiones > 0 && s.totalEstudiantes > 0
    );

    let promedioGlobal = 0;
    if (activeSubjectsWithData.length > 0) {
      const sum = activeSubjectsWithData.reduce((acc, curr) => acc + curr.porcentajeAsistencia, 0);
      promedioGlobal = Number((sum / activeSubjectsWithData.length).toFixed(1));
    }

    const sortedByRate = [...activeSubjectsWithData].sort(
      (a, b) => b.porcentajeAsistencia - a.porcentajeAsistencia
    );

    const mejorMateria = sortedByRate[0] || null;
    const menorMateria =
      sortedByRate.length > 1 ? sortedByRate[sortedByRate.length - 1] : null;

    const totalSesionesGlobal = subjectStats.reduce((acc, curr) => acc + curr.totalSesiones, 0);
    const totalPresentesGlobal = subjectStats.reduce(
      (acc, curr) => acc + curr.totalAsistenciasPresentes,
      0
    );

    return {
      promedioGlobal,
      mejorMateria,
      menorMateria,
      totalSesionesGlobal,
      totalPresentesGlobal,
      materiasConDatos: activeSubjectsWithData.length,
    };
  }, [subjectStats]);

  // Filtered & sorted list for chart rendering
  const filteredStats = useMemo(() => {
    let list = subjectStats;
    if (selectedModalidadFilter !== 'TODAS') {
      list = list.filter((s) => s.modalidad === selectedModalidadFilter);
    }

    const copy = [...list];
    if (sortOrder === 'DESC') {
      copy.sort((a, b) => b.porcentajeAsistencia - a.porcentajeAsistencia);
    } else if (sortOrder === 'ASC') {
      copy.sort((a, b) => a.porcentajeAsistencia - b.porcentajeAsistencia);
    } else {
      copy.sort((a, b) => a.sigla.localeCompare(b.sigla));
    }
    return copy;
  }, [subjectStats, selectedModalidadFilter, sortOrder]);

  // Distribution data for PieChart
  const distributionData = useMemo(() => {
    let optimo = 0;
    let regular = 0;
    let riesgo = 0;
    let sinDatos = 0;

    subjectStats.forEach((s) => {
      if (s.estadoNivel === 'OPTIMO') optimo += 1;
      else if (s.estadoNivel === 'REGULAR') regular += 1;
      else if (s.estadoNivel === 'RIESGO') riesgo += 1;
      else sinDatos += 1;
    });

    const data = [
      { name: 'Óptimo (≥ 80%)', value: optimo, color: '#174EAF' },
      { name: 'Regular (65% - 79%)', value: regular, color: '#F59E0B' },
      { name: 'En Riesgo (< 65%)', value: riesgo, color: '#DC2626' },
    ];

    if (sinDatos > 0) {
      data.push({ name: 'Sin Clases / Pendiente', value: sinDatos, color: '#94A3B8' });
    }

    return data.filter((d) => d.value > 0);
  }, [subjectStats]);

  // Color helper based on percentage
  const getBarColor = (item: SubjectAttendanceStat) => {
    if (item.totalSesiones === 0 || item.totalEstudiantes === 0) return '#94A3B8';
    if (item.porcentajeAsistencia >= 80) return '#174EAF'; // UAGRM Blue
    if (item.porcentajeAsistencia >= 65) return '#F59E0B'; // Amber
    return '#DC2626'; // Alert Red
  };

  // Custom Recharts Tooltip
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: SubjectAttendanceStat = payload[0].payload;
      return (
        <div className="bg-white p-3.5 rounded-xl border border-[#DCE3EC] shadow-lg text-xs space-y-2 z-50 min-w-[210px]">
          <div className="border-b border-[#DCE3EC] pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-sm text-[#172033]">
                {data.sigla} - Gr. {data.grupo}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  data.estadoNivel === 'OPTIMO'
                    ? 'bg-blue-50 text-[#174EAF] border border-blue-200'
                    : data.estadoNivel === 'REGULAR'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : data.estadoNivel === 'RIESGO'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {data.estadoNivel === 'OPTIMO'
                  ? 'Óptimo'
                  : data.estadoNivel === 'REGULAR'
                  ? 'Regular'
                  : data.estadoNivel === 'RIESGO'
                  ? 'Atención'
                  : 'Sin registros'}
              </span>
            </div>
            <p className="text-[11px] text-[#667085] truncate font-medium mt-0.5">{data.nombre}</p>
          </div>

          <div className="space-y-1 text-[#172033]">
            <div className="flex justify-between items-center">
              <span className="text-[#667085]">Asistencia Promedio:</span>
              <span className="font-black text-[#174EAF] text-sm font-mono">
                {data.porcentajeAsistencia}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667085]">Estudiantes inscritos:</span>
              <span className="font-bold">{data.totalEstudiantes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667085]">Sesiones de clase:</span>
              <span className="font-bold">{data.totalSesiones}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667085]">Marcaciones efectivas:</span>
              <span className="font-bold">
                {data.totalAsistenciasPresentes} de {data.asistenciasEsperadas}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667085]">Modalidad:</span>
              <span className="font-medium text-[#667085]">{data.modalidadLabel}</span>
            </div>
          </div>

          {onNavigateToReport && (
            <div className="pt-2 border-t border-[#DCE3EC] text-[10px] text-[#174EAF] font-bold flex items-center justify-between">
              <span>Clic para abrir reporte</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="teacher-attendance-charts-container"
      className="bg-white rounded-2xl border border-[#DCE3EC] shadow-xs p-5 sm:p-6 space-y-6"
    >
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCE3EC] pb-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F0FC] text-[#174EAF] flex items-center justify-center font-bold flex-shrink-0 shadow-2xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-[#172033] tracking-tight">
                Rendimiento Grupal y Asistencia por Materia
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC]">
                Recharts Analytics
              </span>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              Porcentaje promedio de asistencia presencial computado en base a estudiantes y sesiones registradas.
            </p>
          </div>
        </div>

        {/* View toggle (Bar Chart vs Distribution) */}
        <div className="flex items-center gap-1.5 bg-[#F5F7FA] p-1 rounded-xl border border-[#DCE3EC] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveChartTab('BAR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChartTab === 'BAR'
                ? 'bg-white text-[#174EAF] shadow-2xs border border-[#DCE3EC]'
                : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Porcentaje por Materia</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('DISTRIBUTION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeChartTab === 'DISTRIBUTION'
                ? 'bg-white text-[#174EAF] shadow-2xs border border-[#DCE3EC]'
                : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Distribución Grupal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Promedio General */}
        <div className="bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Promedio General</span>
            <TrendingUp className="w-4 h-4 text-[#174EAF]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-[#172033] font-mono">
              {globalKPIs.promedioGlobal}%
            </span>
            <p className="text-[11px] text-[#667085] mt-0.5">
              {globalKPIs.materiasConDatos} materia(s) con sesiones
            </p>
          </div>
          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-2.5">
            <div
              className="bg-[#174EAF] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, globalKPIs.promedioGlobal))}%` }}
            />
          </div>
        </div>

        {/* Materia con Mayor Asistencia */}
        <div className="bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mayor Asistencia</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            {globalKPIs.mejorMateria ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                    {globalKPIs.mejorMateria.porcentajeAsistencia}%
                  </span>
                  <span className="text-xs font-bold text-[#172033]">
                    {globalKPIs.mejorMateria.sigla} ({globalKPIs.mejorMateria.grupo})
                  </span>
                </div>
                <p className="text-[11px] text-[#667085] truncate font-medium mt-0.5">
                  {globalKPIs.mejorMateria.nombre}
                </p>
              </>
            ) : (
              <p className="text-xs text-[#667085] italic mt-1">Sin datos registrados</p>
            )}
          </div>
          <div className="text-[10px] font-bold text-emerald-700 mt-2 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block self-start">
            Rendimiento Superior
          </div>
        </div>

        {/* Materia en Observación */}
        <div className="bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11px] font-bold uppercase tracking-wider">En Observación</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            {globalKPIs.menorMateria ? (
              <>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-xl sm:text-2xl font-black font-mono ${
                      globalKPIs.menorMateria.porcentajeAsistencia < 65
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {globalKPIs.menorMateria.porcentajeAsistencia}%
                  </span>
                  <span className="text-xs font-bold text-[#172033]">
                    {globalKPIs.menorMateria.sigla} ({globalKPIs.menorMateria.grupo})
                  </span>
                </div>
                <p className="text-[11px] text-[#667085] truncate font-medium mt-0.5">
                  {globalKPIs.menorMateria.nombre}
                </p>
              </>
            ) : (
              <p className="text-xs text-[#667085] italic mt-1">Todas al mismo nivel</p>
            )}
          </div>
          <div className="text-[10px] font-bold text-amber-700 mt-2 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block self-start">
            Seguimiento activo
          </div>
        </div>

        {/* Total Sesiones y Marcaciones */}
        <div className="bg-[#F8FAFC] border border-[#DCE3EC] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#667085]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sesiones & Registros</span>
            <Calendar className="w-4 h-4 text-[#174EAF]" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-[#172033] font-mono">
                {globalKPIs.totalPresentesGlobal}
              </span>
              <span className="text-xs font-semibold text-[#667085]">marcaciones</span>
            </div>
            <p className="text-[11px] text-[#667085] mt-0.5">
              En {globalKPIs.totalSesionesGlobal} fechas registradas
            </p>
          </div>
          <div className="text-[10px] font-bold text-[#174EAF] mt-2 bg-[#E8F0FC] px-2 py-0.5 rounded border border-[#DCE3EC] inline-block self-start">
            Control Presencial UAGRM
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {activeChartTab === 'BAR' ? (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-[#DCE3EC]">
            {/* Filter by modality */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#667085]" />
              <label htmlFor="select-modalidad-chart" className="text-xs font-bold text-[#172033]">
                Modalidad:
              </label>
              <select
                id="select-modalidad-chart"
                value={selectedModalidadFilter}
                onChange={(e) => setSelectedModalidadFilter(e.target.value)}
                className="text-xs bg-white border border-[#DCE3EC] rounded-lg px-2.5 py-1 text-[#172033] font-medium focus:ring-1 focus:ring-[#174EAF]"
              >
                <option value="TODAS">Todas las modalidades ({subjectStats.length})</option>
                <option value="LUN_MIE_VIE">Lun, Mié y Vie</option>
                <option value="MAR_JUE">Martes y Jueves</option>
                <option value="SABADO">Sábados</option>
              </select>
            </div>

            {/* Sort order */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#172033]">Ordenar:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSortOrder('DESC')}
                  className={`text-xs px-2 py-1 rounded-md cursor-pointer transition-colors ${
                    sortOrder === 'DESC'
                      ? 'bg-[#174EAF] text-white font-bold'
                      : 'bg-white text-[#667085] border border-[#DCE3EC]'
                  }`}
                >
                  Mayor %
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder('ASC')}
                  className={`text-xs px-2 py-1 rounded-md cursor-pointer transition-colors ${
                    sortOrder === 'ASC'
                      ? 'bg-[#174EAF] text-white font-bold'
                      : 'bg-white text-[#667085] border border-[#DCE3EC]'
                  }`}
                >
                  Menor %
                </button>
                <button
                  type="button"
                  onClick={() => setSortOrder('ALFA')}
                  className={`text-xs px-2 py-1 rounded-md cursor-pointer transition-colors ${
                    sortOrder === 'ALFA'
                      ? 'bg-[#174EAF] text-white font-bold'
                      : 'bg-white text-[#667085] border border-[#DCE3EC]'
                  }`}
                >
                  Sigla
                </button>
              </div>
            </div>

            {/* Threshold legend */}
            <div className="flex items-center gap-3 text-[11px] text-[#667085] flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#174EAF] inline-block" />
                <span>≥ 80% (Óptimo)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block" />
                <span>65-79% (Regular)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] inline-block" />
                <span>&lt; 65% (Alerta)</span>
              </span>
            </div>
          </div>

          {/* Recharts BarChart container */}
          <div
            id="recharts-barchart-wrapper"
            className="w-full min-h-[340px] pt-2"
            style={{ width: '100%', height: 340, minHeight: 340 }}
          >
            <ResponsiveContainer width="100%" height={320} minHeight={300}>
              <BarChart
                data={filteredStats}
                margin={{ top: 25, right: 20, left: -10, bottom: 25 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length && onNavigateToReport) {
                    const item = e.activePayload[0].payload as SubjectAttendanceStat;
                    onNavigateToReport(item.asignaturaId);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="siglaGrupo"
                  tick={{ fill: '#172033', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  unit="%"
                  tick={{ fill: '#667085', fontSize: 11 }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#F1F5F9', opacity: 0.7 }} />
                <ReferenceLine
                  y={80}
                  stroke="#174EAF"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Mínimo Óptimo (80%)',
                    fill: '#174EAF',
                    fontSize: 10,
                    fontWeight: 700,
                    position: 'insideTopRight',
                  }}
                />
                <Bar
                  dataKey="porcentajeAsistencia"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={55}
                  minPointSize={6}
                  isAnimationActive={true}
                  className="cursor-pointer"
                >
                  <LabelList
                    dataKey="porcentajeAsistencia"
                    position="top"
                    formatter={(val: any) => `${val}%`}
                    fill="#172033"
                    fontSize={11}
                    fontWeight={700}
                  />
                  {filteredStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Distribution View (Pie / Category Breakdown) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div
            id="recharts-piechart-wrapper"
            className="w-full min-h-[280px] flex items-center justify-center"
            style={{ width: '100%', height: 280, minHeight: 280 }}
          >
            <ResponsiveContainer width="100%" height={260} minHeight={240}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} materia(s)`, name]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    borderColor: '#DCE3EC',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
              Categorías de Rendimiento
            </h4>
            {distributionData.map((d, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-[#DCE3EC] flex items-center justify-between bg-[#F8FAFC]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <div>
                    <p className="text-xs font-bold text-[#172033]">{d.name}</p>
                    <p className="text-[11px] text-[#667085]">
                      {d.value} de {subjectStats.length} materias asignadas
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black font-mono text-[#172033]">
                  {((d.value / subjectStats.length) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Table with Quick Actions */}
      <div className="pt-2 border-t border-[#DCE3EC] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
            Detalle Rápido por Asignatura ({filteredStats.length})
          </h4>
          <span className="text-[11px] text-[#667085]">
            Haga clic en <strong>Ver Reporte</strong> para consultar la nómina completa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStats.map((item) => (
            <div
              key={item.asignaturaId}
              className="bg-[#F8FAFC] border border-[#DCE3EC] hover:border-[#174EAF] hover:shadow-2xs rounded-xl p-3.5 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-[#174EAF] bg-[#E8F0FC] px-2 py-0.5 rounded border border-[#DCE3EC]">
                    {item.sigla} - Gr. {item.grupo}
                  </span>
                  <span
                    className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                      item.porcentajeAsistencia >= 80
                        ? 'bg-blue-100 text-[#174EAF]'
                        : item.porcentajeAsistencia >= 65
                        ? 'bg-amber-100 text-amber-800'
                        : item.totalSesiones === 0
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.porcentajeAsistencia}%
                  </span>
                </div>
                <h5 className="font-bold text-xs text-[#172033] mt-2 line-clamp-1">
                  {item.nombre}
                </h5>
                <p className="text-[11px] text-[#667085] mt-0.5">{item.modalidadLabel}</p>

                <div className="grid grid-cols-3 gap-1 mt-2.5 pt-2 border-t border-[#E2E8F0] text-[10px] text-[#667085]">
                  <div>
                    <span className="block font-bold text-[#172033]">{item.totalEstudiantes}</span>
                    <span>Alumnos</span>
                  </div>
                  <div>
                    <span className="block font-bold text-[#172033]">{item.totalSesiones}</span>
                    <span>Sesiones</span>
                  </div>
                  <div>
                    <span className="block font-bold text-[#172033]">
                      {item.totalAsistenciasPresentes}
                    </span>
                    <span>Presentes</span>
                  </div>
                </div>
              </div>

              {onNavigateToReport && (
                <button
                  type="button"
                  onClick={() => onNavigateToReport(item.asignaturaId)}
                  className="mt-3 w-full py-1.5 px-2 bg-white hover:bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC] hover:border-[#174EAF] rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Ver Reporte de Asistencia</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
