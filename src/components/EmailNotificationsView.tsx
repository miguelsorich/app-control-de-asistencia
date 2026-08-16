import React, { useState, useMemo } from 'react';
import {
  Asignatura,
  Estudiante,
  NotaEstudiante,
  ResultadoEnvioResumen,
  RegistroEnvioCorreo,
} from '../types';
import {
  prepareGradeEmailsForSubject,
  sendIndividualGradeEmails,
  sendGeneralAnnouncementEmails,
  PreparedGradeEmail,
} from '../utils/emailService';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Users,
  BookOpen,
  Calendar,
  ChevronDown,
  Eye,
  ShieldCheck,
  FileSpreadsheet,
  Megaphone,
  UserX,
  MailCheck,
  RefreshCw,
  Info,
} from 'lucide-react';

interface EmailNotificationsViewProps {
  asignaturas: Asignatura[];
  estudiantes: Estudiante[];
  notas: NotaEstudiante[];
  onLogSentEmails?: (logs: RegistroEnvioCorreo[]) => void;
  initialSelectedSubjectId?: string | null;
}

export const EmailNotificationsView: React.FC<EmailNotificationsViewProps> = ({
  asignaturas,
  estudiantes,
  notas,
  onLogSentEmails,
  initialSelectedSubjectId,
}) => {
  // Active subject selection
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (
      initialSelectedSubjectId &&
      asignaturas.some((a) => a.id === initialSelectedSubjectId)
    ) {
      return initialSelectedSubjectId;
    }
    return asignaturas.length > 0 ? asignaturas[0].id : '';
  });

  // Active sub-tab: 'NOTAS' or 'AVISOS'
  const [activeSubTab, setActiveSubTab] = useState<'NOTAS' | 'AVISOS'>('NOTAS');

  // Selected subject object
  const selectedSubject = useMemo(() => {
    return asignaturas.find((a) => a.id === selectedSubjectId) || null;
  }, [asignaturas, selectedSubjectId]);

  // Students in selected subject
  const subjectStudents = useMemo(() => {
    if (!selectedSubjectId) return [];
    return estudiantes.filter((e) => e.asignaturaId === selectedSubjectId);
  }, [estudiantes, selectedSubjectId]);

  // Prepared Grade Emails for selected subject
  const preparedGradeEmails: PreparedGradeEmail[] = useMemo(() => {
    if (!selectedSubject) return [];
    return prepareGradeEmailsForSubject(selectedSubject, subjectStudents, notas);
  }, [selectedSubject, subjectStudents, notas]);

  // State for sending grades
  const [isSendingGrades, setIsSendingGrades] = useState(false);
  const [gradeSendResult, setGradeSendResult] = useState<ResultadoEnvioResumen | null>(null);
  const [selectedStudentPreviewIndex, setSelectedStudentPreviewIndex] = useState<number>(0);

  // State for Announcement (Aviso General)
  const [announcementSubject, setAnnouncementSubject] = useState<string>('');
  const [announcementMessage, setAnnouncementMessage] = useState<string>('');
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [announcementSendResult, setAnnouncementSendResult] = useState<ResultadoEnvioResumen | null>(null);

  // Quick stats for Grades tab
  const readyToSendCount = preparedGradeEmails.filter((p) => p.isReady).length;
  const missingEmailCount = preparedGradeEmails.filter((p) => p.motivoNoListo === 'FALTA_CORREO').length;
  const missingGradeCount = preparedGradeEmails.filter((p) => p.motivoNoListo === 'FALTA_NOTA').length;

  // Selected preview student item
  const activePreviewGradeItem = preparedGradeEmails[selectedStudentPreviewIndex] || preparedGradeEmails[0] || null;

  // Handle Sending Individual Grade Emails
  const handleSendGrades = async () => {
    if (!selectedSubject || readyToSendCount === 0 || isSendingGrades) return;

    setIsSendingGrades(true);
    setGradeSendResult(null);

    try {
      const { resumen, logs } = await sendIndividualGradeEmails(
        selectedSubject,
        preparedGradeEmails
      );

      setGradeSendResult(resumen);
      if (onLogSentEmails) {
        onLogSentEmails(logs);
      }
    } catch (err) {
      console.error('Error sending grade emails:', err);
    } finally {
      setIsSendingGrades(false);
    }
  };

  // Handle Sending Announcement (Avisos Generales)
  const handleSendAnnouncement = async () => {
    if (
      !selectedSubject ||
      !announcementSubject.trim() ||
      !announcementMessage.trim() ||
      subjectStudents.length === 0 ||
      isSendingAnnouncement
    ) {
      return;
    }

    setIsSendingAnnouncement(true);
    setAnnouncementSendResult(null);

    try {
      const { resumen, logs } = await sendGeneralAnnouncementEmails(
        selectedSubject,
        subjectStudents,
        announcementSubject.trim(),
        announcementMessage.trim()
      );

      setAnnouncementSendResult(resumen);
      if (onLogSentEmails) {
        onLogSentEmails(logs);
      }
    } catch (err) {
      console.error('Error sending announcement emails:', err);
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  return (
    <div id="modulo-envio-correos" className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Subject Selector Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DCE3EC] shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-[#E8F0FC] text-[#174EAF] border border-[#DCE3EC]">
                Módulo 7
              </span>
              <h1 className="text-xl font-black text-[#172033] flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#174EAF]" />
                Envío Oficial de Notas y Avisos
              </h1>
            </div>
            <p className="text-xs text-[#667085]">
              Envíe notas individuales o comunicados generales a los estudiantes de la asignatura seleccionada.
            </p>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center bg-[#F5F7FA] p-1 rounded-xl border border-[#DCE3EC]">
            <button
              id="subtab-enviar-notas"
              type="button"
              onClick={() => {
                setActiveSubTab('NOTAS');
                setGradeSendResult(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'NOTAS'
                  ? 'bg-[#174EAF] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#172033] hover:bg-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Enviar Notas</span>
            </button>

            <button
              id="subtab-enviar-aviso"
              type="button"
              onClick={() => {
                setActiveSubTab('AVISOS');
                setAnnouncementSendResult(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'AVISOS'
                  ? 'bg-[#174EAF] text-white shadow-xs'
                  : 'text-[#667085] hover:text-[#172033] hover:bg-white'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Enviar Aviso</span>
            </button>
          </div>
        </div>

        {/* Subject Selector and Quick Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#DCE3EC]">
          <div className="space-y-1">
            <label
              htmlFor="select-subject-emails"
              className="block text-xs font-bold text-[#172033] uppercase tracking-wider"
            >
              Asignatura
            </label>
            <div className="relative">
              <select
                id="select-subject-emails"
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setGradeSendResult(null);
                  setAnnouncementSendResult(null);
                  setSelectedStudentPreviewIndex(0);
                }}
                className="w-full appearance-none bg-white hover:bg-[#F5F7FA] border border-[#DCE3EC] text-[#172033] text-xs font-semibold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-hidden focus:ring-2 focus:ring-[#174EAF] transition-colors cursor-pointer"
              >
                {asignaturas.length === 0 ? (
                  <option value="">No hay asignaturas registradas</option>
                ) : (
                  asignaturas.map((asig) => (
                    <option key={asig.id} value={asig.id}>
                      {asig.sigla} - {asig.nombre} (Grupo {asig.grupo} · Semestre {asig.semestre || 1}/{asig.año || 2026})
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-[#667085] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {selectedSubject ? (
            <div className="md:col-span-2 flex flex-wrap items-center gap-3 bg-[#F5F7FA] rounded-xl p-3 border border-[#DCE3EC] text-xs text-[#667085]">
              <div className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-[#174EAF]" />
                <span className="font-bold text-[#172033]">{selectedSubject.sigla}</span> — Grupo {selectedSubject.grupo}
              </div>
              <span className="text-[#DCE3EC]">|</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#174EAF]" />
                <span className="font-semibold text-[#172033]">Semestre {selectedSubject.semestre || 1} · {selectedSubject.año || 2026}</span>
              </div>
              <span className="text-[#DCE3EC]">|</span>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#667085]" />
                <span>{subjectStudents.length} estudiantes inscritos</span>
              </div>
            </div>
          ) : (
            <div className="md:col-span-2 flex items-center text-xs text-[#667085] italic">
              Seleccione una asignatura para habilitar el envío de correos.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 1: ENVÍO INDIVIDUAL DE NOTAS                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'NOTAS' && (
        <div id="seccion-envio-notas" className="space-y-6">
          {/* Post-Sending Result Alert */}
          {gradeSendResult && (
            <div
              id="banner-resultado-envio-notas"
              className="bg-[#E8F0FC] border border-[#174EAF]/30 rounded-2xl p-5 space-y-3 animate-in fade-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#174EAF] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-[#174EAF]">
                      Resultado del Envío Individual de Notas
                    </h4>
                    <p className="text-xs text-[#172033] mt-0.5">
                      Proceso finalizado para la asignatura {selectedSubject?.sigla}. Cada estudiante recibe exclusivamente su propia nota.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setGradeSendResult(null)}
                  className="text-xs text-[#174EAF] hover:text-[#103B88] font-bold px-2.5 py-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  Cerrar resumen
                </button>
              </div>

              {/* Metric Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white border border-[#DCE3EC] p-3 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
                    Correos Enviados
                  </span>
                  <span className="text-2xl font-black text-[#174EAF] mt-1 block">
                    {gradeSendResult.enviadosExitosos}
                  </span>
                  <span className="text-[11px] text-[#667085]">recibieron su nota individual</span>
                </div>

                <div className="bg-white border border-[#DCE3EC] p-3 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
                    No Enviados
                  </span>
                  <span
                    className={`text-2xl font-black mt-1 block ${
                      gradeSendResult.noEnviadosCount > 0 ? 'text-amber-600' : 'text-[#667085]'
                    }`}
                  >
                    {gradeSendResult.noEnviadosCount}
                  </span>
                  <span className="text-[11px] text-[#667085]">por falta de correo o nota</span>
                </div>

                <div className="bg-white border border-[#DCE3EC] p-3 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
                    Total Procesados
                  </span>
                  <span className="text-2xl font-black text-[#172033] mt-1 block">
                    {gradeSendResult.totalProcesados}
                  </span>
                  <span className="text-[11px] text-[#667085]">estudiantes en la lista</span>
                </div>
              </div>

              {/* Problem Details */}
              {gradeSendResult.detallesNoEnviados.length > 0 && (
                <div className="bg-white border border-[#DCE3EC] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <UserX className="w-4 h-4 text-amber-600" />
                    <span>Estudiantes que no pudieron recibir su nota ({gradeSendResult.detallesNoEnviados.length}):</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-[#DCE3EC] bg-[#F5F7FA] rounded-lg border border-[#DCE3EC] text-xs">
                    {gradeSendResult.detallesNoEnviados.map((item, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-[#174EAF] mr-2">{item.registro}</span>
                          <span className="text-[#172033]">{item.nombre}</span>
                        </div>
                        <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                          {item.descripcion}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verification & Action Bar */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DCE3EC] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#174EAF]" />
                  Previsualización y Validación de Envío
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Revise los datos antes de enviar. Cada correo se enviará de forma <strong>estrictamente individual</strong>.
                </p>
              </div>

              {/* Main Button: Enviar notas por correo */}
              <button
                id="btn-enviar-notas-correo"
                type="button"
                disabled={readyToSendCount === 0 || isSendingGrades}
                onClick={handleSendGrades}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                  readyToSendCount === 0 || isSendingGrades
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#174EAF] hover:bg-[#103B88] text-white'
                }`}
              >
                {isSendingGrades ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando correos individuales...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar notas por correo ({readyToSendCount})</span>
                  </>
                )}
              </button>
            </div>

            {/* Validation Metrics Status Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-3 bg-[#E8F0FC] border border-[#DCE3EC] rounded-xl p-3">
                <div className="p-2 rounded-lg bg-white text-[#174EAF] shadow-2xs">
                  <MailCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#174EAF] uppercase tracking-wider block">
                    Listos para Enviar
                  </span>
                  <span className="text-base font-bold text-[#172033]">
                    {readyToSendCount} estudiantes
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#F5F7FA] border border-[#DCE3EC] rounded-xl p-3">
                <div className="p-2 rounded-lg bg-white text-amber-600 shadow-2xs">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
                    Sin Nota Importada
                  </span>
                  <span className="text-base font-bold text-[#172033]">
                    {missingGradeCount} estudiantes
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#F5F7FA] border border-[#DCE3EC] rounded-xl p-3">
                <div className="p-2 rounded-lg bg-white text-[#667085] shadow-2xs">
                  <UserX className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
                    Sin Correo Electrónico
                  </span>
                  <span className="text-base font-bold text-[#172033]">
                    {missingEmailCount} estudiantes
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid layout: Table on Left / Live Email Card Preview on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Table of Students Preview */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-5 space-y-3 overflow-hidden">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Listado de Destinatarios ({preparedGradeEmails.length})
                </h4>
                <span className="text-[11px] text-[#667085]">
                  Haga clic en una fila para previsualizar su correo
                </span>
              </div>

              {preparedGradeEmails.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#667085] italic">
                  No hay estudiantes registrados en esta asignatura.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#DCE3EC]">
                  <table id="tabla-previsualizacion-notas-correo" className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#E8F0FC] border-b border-[#DCE3EC] text-[#172033] font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-3">Estudiante</th>
                        <th className="py-2.5 px-3">Correo</th>
                        <th className="py-2.5 px-3 text-center">Nota</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE3EC] bg-white">
                      {preparedGradeEmails.map((item, idx) => {
                        const isSelected = idx === selectedStudentPreviewIndex;
                        return (
                          <tr
                            key={item.estudiante.id}
                            id={`fila-envio-estudiante-${item.estudiante.registroUniversitario}`}
                            onClick={() => setSelectedStudentPreviewIndex(idx)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#E8F0FC]/60 font-medium'
                                : 'hover:bg-[#F5F7FA]'
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-[#172033]">
                                {item.estudiante.nombreCompleto}
                              </div>
                              <div className="font-mono text-[11px] text-[#667085]">
                                RU: {item.estudiante.registroUniversitario}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-[#667085] font-mono text-[11px] truncate max-w-[150px]">
                              {item.estudiante.correoElectronico || (
                                <span className="text-red-500 italic">Sin correo</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.notaObj ? (
                                <span className="font-mono font-bold text-[#174EAF] bg-[#E8F0FC] px-2 py-0.5 rounded border border-[#DCE3EC] text-xs">
                                  {item.notaObj.nota}
                                </span>
                              ) : (
                                <span className="text-[#667085]/60 italic text-[11px]">
                                  Sin nota
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.isReady ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#174EAF] bg-[#E8F0FC] border border-[#DCE3EC] px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Listo
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"
                                  title={item.motivoTexto}
                                >
                                  <AlertCircle className="w-3 h-3" />
                                  {item.motivoNoListo === 'FALTA_NOTA' ? 'Sin Nota' : 'Sin Correo'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Live Individual Email Mock Preview */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#DCE3EC] pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#174EAF]" />
                  <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Vista Previa del Correo Individual
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-[#174EAF] bg-[#E8F0FC] px-2 py-0.5 rounded border border-[#DCE3EC]">
                  Formato Digital Academy
                </span>
              </div>

              {activePreviewGradeItem ? (
                <div className="space-y-3">
                  {/* Email Headers Box */}
                  <div className="bg-[#F5F7FA] rounded-xl p-3 border border-[#DCE3EC] text-xs space-y-1.5 font-mono">
                    <div className="flex items-start">
                      <span className="w-20 text-[#667085] font-sans font-bold">Para:</span>
                      <span className="text-[#172033] font-bold truncate">
                        {activePreviewGradeItem.estudiante.nombreCompleto} &lt;
                        {activePreviewGradeItem.estudiante.correoElectronico || 'sin-correo@uagrm.edu.bo'}
                        &gt;
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-20 text-[#667085] font-sans font-bold">Asunto:</span>
                      <span className="text-[#174EAF] font-bold">
                        {activePreviewGradeItem.asunto}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-20 text-[#667085] font-sans font-bold">Privacidad:</span>
                      <span className="text-[#174EAF] font-sans text-[11px]">
                        Entrega 100% individual (sin copias ni listados ajenos)
                      </span>
                    </div>
                  </div>

                  {/* Email Body Content */}
                  <div className="bg-white rounded-xl p-4 border border-[#DCE3EC] shadow-2xs font-sans text-xs text-[#172033] space-y-3">
                    <p className="font-semibold text-[#172033]">
                      Hola {activePreviewGradeItem.estudiante.nombreCompleto}:
                    </p>
                    <p className="text-[#667085] leading-relaxed">
                      Tu nota correspondiente a la asignatura{' '}
                      <strong className="text-[#172033]">{selectedSubject?.nombre}</strong> es:
                    </p>
                    <div className="py-2 text-center">
                      <span className="inline-block text-2xl font-black text-[#174EAF] bg-[#E8F0FC] border border-[#DCE3EC] px-6 py-2 rounded-xl shadow-xs">
                        {activePreviewGradeItem.notaObj?.nota ?? '[SIN NOTA REGISTRADA]'}
                      </span>
                    </div>
                    <p className="text-[#667085]">Saludos cordiales.</p>
                  </div>

                  {!activePreviewGradeItem.isReady && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Atención:</strong>
                        <span>{activePreviewGradeItem.motivoTexto}. Este estudiante no será procesado al enviar.</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-[#667085] italic">
                  Seleccione una asignatura para previsualizar los correos.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN 2: ENVÍO DE AVISO GENERAL                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'AVISOS' && (
        <div id="seccion-envio-avisos" className="space-y-6">
          {/* Post-Sending Result Alert */}
          {announcementSendResult && (
            <div
              id="banner-resultado-envio-aviso"
              className="bg-[#E8F0FC] border border-[#174EAF]/30 rounded-2xl p-5 space-y-3 animate-in fade-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#174EAF] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-[#174EAF]">
                      Aviso Enviado Correctamente
                    </h4>
                    <p className="text-xs text-[#172033] mt-0.5">
                      El comunicado fue entregado con copia oculta individual (CCO) para garantizar la privacidad de los estudiantes.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAnnouncementSendResult(null)}
                  className="text-xs text-[#174EAF] hover:text-[#103B88] font-bold px-2.5 py-1 rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  Cerrar resumen
                </button>
              </div>

              {/* Metric Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white border border-[#DCE3EC] p-3 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
                    Correos Enviados
                  </span>
                  <span className="text-2xl font-black text-[#174EAF] mt-1 block">
                    {announcementSendResult.enviadosExitosos}
                  </span>
                  <span className="text-[11px] text-[#667085]">destinatarios alcanzados</span>
                </div>

                <div className="bg-white border border-[#DCE3EC] p-3 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
                    No Enviados
                  </span>
                  <span
                    className={`text-2xl font-black mt-1 block ${
                      announcementSendResult.noEnviadosCount > 0 ? 'text-amber-600' : 'text-[#667085]'
                    }`}
                  >
                    {announcementSendResult.noEnviadosCount}
                  </span>
                  <span className="text-[11px] text-[#667085]">por falta de correo</span>
                </div>

                <div className="bg-white border border-[#DCE3EC] p-3 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">
                    Total Estudiantes
                  </span>
                  <span className="text-2xl font-black text-[#172033] mt-1 block">
                    {announcementSendResult.totalProcesados}
                  </span>
                  <span className="text-[11px] text-[#667085]">en la asignatura</span>
                </div>
              </div>
            </div>
          )}

          {/* Grid: Form on Left / Preview on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Announcement Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-5 sm:p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#174EAF]" />
                  Redactar Comunicado General
                </h3>
                <p className="text-xs text-[#667085]">
                  El aviso se enviará a todos los estudiantes inscritos en la materia <strong>{selectedSubject?.sigla}</strong>.
                </p>
              </div>

              {/* Privacy Notice Banner */}
              <div className="bg-[#E8F0FC] border border-[#DCE3EC] rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#172033]">
                <ShieldCheck className="w-4 h-4 text-[#174EAF] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-[#174EAF]">
                    Privacidad garantizada entre estudiantes:
                  </strong>
                  <span className="text-[#667085]">
                    Los estudiantes no verán las direcciones de correo electrónico de otros compañeros. No se incluye lista pública de destinatarios.
                  </span>
                </div>
              </div>

              {/* Subject Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="input-asunto-aviso"
                  className="block text-xs font-bold text-[#172033] uppercase tracking-wider"
                >
                  Asunto del Correo <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-asunto-aviso"
                  type="text"
                  value={announcementSubject}
                  onChange={(e) => setAnnouncementSubject(e.target.value)}
                  placeholder={`Ej: Aviso importante - ${selectedSubject?.sigla || 'Clases'}`}
                  className="w-full bg-white border border-[#DCE3EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#174EAF] transition-colors"
                />
              </div>

              {/* Message Textarea */}
              <div className="space-y-1.5">
                <label
                  htmlFor="input-mensaje-aviso"
                  className="block text-xs font-bold text-[#172033] uppercase tracking-wider"
                >
                  Mensaje <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="input-mensaje-aviso"
                  rows={7}
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Estimados estudiantes:&#10;&#10;Se les comunica que la próxima clase se llevará a cabo en el aula de cómputo...&#10;&#10;Atentamente,&#10;Docente de la Asignatura"
                  className="w-full bg-white border border-[#DCE3EC] rounded-xl p-3.5 text-xs text-[#172033] leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-[#174EAF] transition-colors"
                />
                <div className="flex items-center justify-between text-[11px] text-[#667085]">
                  <span>Destinatarios estimados: {subjectStudents.filter((s) => s.correoElectronico).length} estudiantes con correo</span>
                  <span>{announcementMessage.length} caracteres</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  id="btn-enviar-aviso-general"
                  type="button"
                  disabled={
                    !announcementSubject.trim() ||
                    !announcementMessage.trim() ||
                    subjectStudents.length === 0 ||
                    isSendingAnnouncement
                  }
                  onClick={handleSendAnnouncement}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                    !announcementSubject.trim() ||
                    !announcementMessage.trim() ||
                    subjectStudents.length === 0 ||
                    isSendingAnnouncement
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-[#174EAF] hover:bg-[#103B88] text-white'
                  }`}
                >
                  {isSendingAnnouncement ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando comunicado a los estudiantes...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar aviso a los estudiantes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Announcement Mock Preview */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#DCE3EC] shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#DCE3EC] pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#174EAF]" />
                  <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Vista Previa del Aviso
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-[#174EAF] bg-[#E8F0FC] px-2 py-0.5 rounded border border-[#DCE3EC]">
                  Copia Oculta (CCO)
                </span>
              </div>

              <div className="space-y-3">
                {/* Headers */}
                <div className="bg-[#F5F7FA] rounded-xl p-3 border border-[#DCE3EC] text-xs space-y-1.5 font-mono">
                  <div className="flex items-start">
                    <span className="w-20 text-[#667085] font-sans font-bold">De:</span>
                    <span className="text-[#172033] font-bold">Docente UAGRM &lt;docente@uagrm.edu.bo&gt;</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-20 text-[#667085] font-sans font-bold">Para:</span>
                    <span className="text-[#667085] font-sans">Estudiantes de {selectedSubject?.sigla} (individual)</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-20 text-[#667085] font-sans font-bold">Asunto:</span>
                    <span className="text-[#174EAF] font-bold">
                      {announcementSubject.trim() || '(Sin asunto redactado)'}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="bg-white rounded-xl p-4 border border-[#DCE3EC] shadow-2xs font-sans text-xs text-[#172033] min-h-[160px] whitespace-pre-wrap leading-relaxed">
                  {announcementMessage.trim() ? (
                    announcementMessage
                  ) : (
                    <span className="text-[#667085]/60 italic">
                      Aquí se mostrará la previsualización del mensaje a medida que lo redacte...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-[#667085] bg-[#F5F7FA] p-2.5 rounded-lg border border-[#DCE3EC]">
                  <Info className="w-3.5 h-3.5 text-[#174EAF] flex-shrink-0" />
                  <span>
                    El mensaje se enviará a los {subjectStudents.length} estudiantes inscritos en {selectedSubject?.sigla}.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
