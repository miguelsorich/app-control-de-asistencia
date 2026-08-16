import React, { useState, useEffect, useCallback } from 'react';
import {
  Asignatura,
  Estudiante,
  RegistroAsistencia,
  SesionHabilitacion,
  NotaEstudiante,
  RegistroEnvioCorreo,
} from './types';
import { INITIAL_SUBJECTS } from './data/initialSubjects';
import { INITIAL_STUDENTS } from './data/initialStudents';
import { INITIAL_ATTENDANCE } from './data/initialAttendance';
import { INITIAL_GRADES } from './data/initialGrades';
import { Header } from './components/Header';
import { SubjectFormModal } from './components/SubjectFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ImportStudentsModal } from './components/ImportStudentsModal';
import { StudentAttendanceView } from './components/StudentAttendanceView';
import { TeacherPortalView } from './components/TeacherPortalView';
import { MainAccessScreen } from './components/MainAccessScreen';
import { getTodayDateString, formatCurrentTimeWithSeconds } from './utils/scheduleValidators';
import {
  fetchAsignaturasFromSupabase,
  saveAsignaturaToSupabase,
  deleteAsignaturaFromSupabase,
  fetchEstudiantesFromSupabase,
  saveEstudiantesBatchToSupabase,
  fetchAsistenciasFromSupabase,
  saveAsistenciaToSupabase,
  fetchSesionesFromSupabase,
  saveSesionToSupabase,
  fetchNotasFromSupabase,
  saveNotasBatchToSupabase,
} from './services/supabaseSync';
import { supabase } from './lib/supabase';
import { CheckCircle2, GraduationCap } from 'lucide-react';

const STORAGE_KEY_SUBJECTS = 'uagrm_asistencia_asignaturas_v1';
const STORAGE_KEY_STUDENTS = 'uagrm_asistencia_estudiantes_v1';
const STORAGE_KEY_ATTENDANCE = 'uagrm_asistencia_registros_v1';
const STORAGE_KEY_SESIONES = 'uagrm_asistencia_sesiones_v1';
const STORAGE_KEY_GRADES = 'uagrm_asistencia_notas_v1';
const STORAGE_KEY_EMAIL_LOGS = 'uagrm_asistencia_correos_v1';

export default function App() {
  // Primary Navigation State (Módulo 10: Pantalla principal de acceso)
  const [activeMainTab, setActiveMainTab] = useState<'MAIN' | 'DOCENTE' | 'ESTUDIANTE'>('MAIN');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Subjects State (Módulo 1)
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => ({
            ...item,
            semestre: item.semestre === 2 ? 2 : 1,
            año: item.año ? Number(item.año) : (item.anio ? Number(item.anio) : 2026),
          }));
        }
      }
    } catch (e) {
      console.error('Error loading subjects from localStorage:', e);
    }
    return INITIAL_SUBJECTS;
  });

  // Students State (Módulo 2)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading students from localStorage:', e);
    }
    return INITIAL_STUDENTS;
  });

  // Attendance Records State (Módulo 3)
  const [registrosAsistencia, setRegistrosAsistencia] = useState<RegistroAsistencia[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading attendance records from localStorage:', e);
    }
    return INITIAL_ATTENDANCE;
  });

  // Attendance Enablement Sessions State (Módulo 4)
  const [sesionesHabilitacion, setSesionesHabilitacion] = useState<
    Record<string, SesionHabilitacion>
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESIONES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading sesiones from localStorage:', e);
    }
    return {};
  });

  // Grades State (Módulo 6)
  const [notas, setNotas] = useState<NotaEstudiante[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GRADES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading grades from localStorage:', e);
    }
    return INITIAL_GRADES;
  });

  // Subject Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Asignatura | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSubjectTarget, setImportSubjectTarget] = useState<Asignatura | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Supabase Initial Load and Sync
  const loadAllDataFromSupabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [remoteAsig, remoteEst, remoteAsis, remoteSes, remoteNot] = await Promise.all([
        fetchAsignaturasFromSupabase(),
        fetchEstudiantesFromSupabase(),
        fetchAsistenciasFromSupabase(),
        fetchSesionesFromSupabase(),
        fetchNotasFromSupabase(),
      ]);

      if (remoteAsig && remoteAsig.length > 0) {
        setAsignaturas(remoteAsig);
      } else {
        // Seed initial subjects to Supabase
        for (const s of asignaturas) {
          saveAsignaturaToSupabase(s);
        }
      }

      if (remoteEst && remoteEst.length > 0) {
        setEstudiantes(remoteEst);
      } else {
        saveEstudiantesBatchToSupabase(estudiantes);
      }

      if (remoteAsis && remoteAsis.length > 0) {
        setRegistrosAsistencia(remoteAsis);
      }

      if (remoteSes && Object.keys(remoteSes).length > 0) {
        setSesionesHabilitacion(remoteSes);
      }

      if (remoteNot && remoteNot.length > 0) {
        setNotas(remoteNot);
      } else {
        saveNotasBatchToSupabase(notas);
      }
    } catch (e) {
      console.warn('[Supabase] Initial sync info:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadAllDataFromSupabase();
  }, [loadAllDataFromSupabase]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(asignaturas));
    } catch (e) {
      console.error('Error saving subjects to localStorage:', e);
    }
  }, [asignaturas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(estudiantes));
    } catch (e) {
      console.error('Error saving students to localStorage:', e);
    }
  }, [estudiantes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ATTENDANCE, JSON.stringify(registrosAsistencia));
    } catch (e) {
      console.error('Error saving attendance to localStorage:', e);
    }
  }, [registrosAsistencia]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_SESIONES,
        JSON.stringify(sesionesHabilitacion)
      );
    } catch (e) {
      console.error('Error saving sesiones to localStorage:', e);
    }
  }, [sesionesHabilitacion]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GRADES, JSON.stringify(notas));
    } catch (e) {
      console.error('Error saving grades to localStorage:', e);
    }
  }, [notas]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  // Subject Actions (Módulo 1)
  const handleOpenAddModal = () => {
    setEditingSubject(null);
    setIsFormModalOpen(true);
  };

  const handleEditSubject = (asig: Asignatura) => {
    setEditingSubject(asig);
    setIsFormModalOpen(true);
  };

  const handleSaveSubject = (
    data: Omit<Asignatura, 'id' | 'fechaCreacion'> & { id?: string }
  ) => {
    if (data.id) {
      let updatedItem: Asignatura | null = null;
      setAsignaturas((prev) =>
        prev.map((item) => {
          if (item.id === data.id) {
            updatedItem = {
              ...item,
              ...data,
            };
            return updatedItem;
          }
          return item;
        })
      );
      if (updatedItem) {
        saveAsignaturaToSupabase(updatedItem);
      }
      showToast(`Asignatura "${data.sigla} - ${data.nombre}" guardada correctamente.`);
    } else {
      const newId = `asig-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const newSubject: Asignatura = {
        id: newId,
        ...data,
        fechaCreacion: Date.now(),
      };
      setAsignaturas((prev) => [newSubject, ...prev]);
      saveAsignaturaToSupabase(newSubject);
      showToast(`Asignatura "${data.sigla} - ${data.nombre}" agregada correctamente.`);
    }
  };

  const handleDeleteSubjectClick = (id: string, nombre: string) => {
    setDeleteTarget({ id, nombre });
  };

  const handleConfirmDeleteSubject = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setAsignaturas((prev) => prev.filter((item) => item.id !== targetId));
    setEstudiantes((prev) => prev.filter((est) => est.asignaturaId !== targetId));
    setRegistrosAsistencia((prev) =>
      prev.filter((r) => r.asignaturaId !== targetId)
    );
    setSesionesHabilitacion((prev) => {
      const copy = { ...prev };
      delete copy[targetId];
      return copy;
    });
    deleteAsignaturaFromSupabase(targetId);
    showToast(`Asignatura "${deleteTarget.nombre}" eliminada.`);
    setDeleteTarget(null);
  };

  // Student Actions (Módulo 2)
  const handleOpenImportModalForSubject = (asig: Asignatura) => {
    setImportSubjectTarget(asig);
    setIsImportModalOpen(true);
  };

  const handleImportComplete = (newStudents: Estudiante[]) => {
    if (newStudents.length > 0) {
      setEstudiantes((prev) => [...prev, ...newStudents]);
      saveEstudiantesBatchToSupabase(newStudents);
      showToast(
        `Se agregaron ${newStudents.length} estudiante${
          newStudents.length === 1 ? '' : 's'
        } a la asignatura.`
      );
    }
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    setEstudiantes((prev) => prev.filter((e) => e.id !== studentId));
    supabase
      .from('estudiantes')
      .delete()
      .eq('id', studentId)
      .then(({ error }) => {
        if (error) console.warn('[Supabase] delete student error:', error.message);
      });
    showToast(`Estudiante "${studentName}" eliminado.`);
  };

  // Attendance Registration (Módulo 3)
  const handleRegistrarAsistencia = (nuevoRegistro: RegistroAsistencia) => {
    setRegistrosAsistencia((prev) => [nuevoRegistro, ...prev]);
    saveAsistenciaToSupabase(nuevoRegistro);
    showToast(`Asistencia registrada: PRESENTE (RU: ${nuevoRegistro.registroUniversitario})`);
  };

  // Attendance Enablement Actions (Módulo 4)
  const handleHabilitarAsistencia = (asignaturaId: string, duracionMinutos: number) => {
    const now = new Date();
    const todayStr = getTodayDateString(now);
    const timeStr = formatCurrentTimeWithSeconds(now);
    const expiraTimestamp = Date.now() + duracionMinutos * 60 * 1000;

    const nuevaSesion: SesionHabilitacion = {
      id: `sesion-${Date.now()}-${asignaturaId}`,
      asignaturaId,
      fecha: todayStr,
      horaInicioHabilitacion: timeStr,
      duracionMinutos,
      creadoTimestamp: Date.now(),
      expiraTimestamp,
      activa: true,
      cerradoManualmente: false,
    };

    setSesionesHabilitacion((prev) => ({
      ...prev,
      [asignaturaId]: nuevaSesion,
    }));
    saveSesionToSupabase(nuevaSesion);

    const asig = asignaturas.find((a) => a.id === asignaturaId);
    showToast(`Asistencia habilitada para ${asig?.sigla || 'la materia'} (${duracionMinutos} min).`);
  };

  const handleCerrarAsistencia = (asignaturaId: string) => {
    setSesionesHabilitacion((prev) => {
      const existing = prev[asignaturaId];
      if (!existing) return prev;
      const updated: SesionHabilitacion = {
        ...existing,
        activa: false,
        cerradoManualmente: true,
      };
      saveSesionToSupabase(updated);
      return {
        ...prev,
        [asignaturaId]: updated,
      };
    });
    const asig = asignaturas.find((a) => a.id === asignaturaId);
    showToast(`Asistencia de ${asig?.sigla || 'la materia'} cerrada.`);
  };

  // Grades Actions (Módulo 6)
  const handleSaveGrades = (updatedGrades: NotaEstudiante[]) => {
    setNotas(updatedGrades);
    saveNotasBatchToSupabase(updatedGrades);
    showToast('Notas de la asignatura actualizadas correctamente.');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] flex flex-col font-sans">
      {/* Header with Navigation between Inicio, Portal Estudiante and Portal Docente */}
      <Header
        totalAsignaturas={asignaturas.length}
        totalEstudiantes={estudiantes.length}
        activeTab={activeMainTab}
        onChangeTab={(tab) => setActiveMainTab(tab)}
        onNavigateHome={() => setActiveMainTab('MAIN')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeMainTab === 'MAIN' ? (
          /* ==========================================
             MÓDULO 10: PANTALLA PRINCIPAL DE ACCESO
             Punto de entrada inicial del sistema
             ========================================== */
          <MainAccessScreen
            onSelectEstudiante={() => setActiveMainTab('ESTUDIANTE')}
            onSelectDocente={() => setActiveMainTab('DOCENTE')}
            totalAsignaturas={asignaturas.length}
            totalEstudiantes={estudiantes.length}
          />
        ) : activeMainTab === 'ESTUDIANTE' ? (
          /* ==========================================
             PORTAL DEL ESTUDIANTE (MÓDULOS 3, 6 Y 8)
             ========================================== */
          <StudentAttendanceView
            asignaturas={asignaturas}
            estudiantes={estudiantes}
            registrosAsistencia={registrosAsistencia}
            sesionesHabilitacion={sesionesHabilitacion}
            notas={notas}
            onRegistrarAsistencia={handleRegistrarAsistencia}
            onVolverPrincipal={() => setActiveMainTab('MAIN')}
            onVolverDocente={() => setActiveMainTab('DOCENTE')}
            onLogoutToMain={() => setActiveMainTab('MAIN')}
          />
        ) : (
          /* ==========================================
             PORTAL DOCENTE / ADMINISTRADOR (MÓDULO 9)
             Acceso Docente: Miguel Antonio Sorich Rojas (6379)
             Centraliza:
             1. Gestión de asignaturas
             2. Estudiantes
             3. Habilitar asistencia
             4. Reportes de asistencia
             5. Importación de notas
             ========================================== */
          <TeacherPortalView
            asignaturas={asignaturas}
            estudiantes={estudiantes}
            registrosAsistencia={registrosAsistencia}
            sesionesHabilitacion={sesionesHabilitacion}
            notas={notas}
            onOpenAddSubjectModal={handleOpenAddModal}
            onEditSubject={handleEditSubject}
            onDeleteSubject={handleDeleteSubjectClick}
            onOpenImportModalForSubject={handleOpenImportModalForSubject}
            onDeleteStudent={handleDeleteStudent}
            onHabilitarAsistencia={handleHabilitarAsistencia}
            onCerrarAsistencia={handleCerrarAsistencia}
            onSaveGrades={handleSaveGrades}
            onVolverPrincipal={() => setActiveMainTab('MAIN')}
            onLogoutToMain={() => setActiveMainTab('MAIN')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#DCE3EC] py-4 mt-12 text-center text-xs text-[#667085]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#172033] font-medium">
            <div className="flex items-center gap-1.5 bg-[#F5F7FA] p-1 rounded-lg border border-[#DCE3EC]">
              <img
                src="/logo_digital_academy.png"
                alt="Digital Academy"
                className="h-5 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="text-[#DCE3EC]">|</span>
              <img
                src="/logo_facultad.png"
                alt="Facultad UAGRM"
                className="h-5 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span>Control de Asistencia UAGRM — Digital Academy</span>
          </div>
          <p className="text-[#667085] text-[11px]">
            Facultad de Ciencias Contables, Auditoría, Sistemas de Control de Gestión y Finanzas • Docente: Miguel Antonio Sorich Rojas (Cód. 6379)
          </p>
        </div>
      </footer>

      {/* Form Modal (Add / Edit Subject) */}
      <SubjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveSubject}
        initialData={editingSubject}
      />

      {/* Import Students Modal */}
      <ImportStudentsModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportSubjectTarget(null);
        }}
        asignatura={importSubjectTarget}
        existingStudentsInSubject={
          importSubjectTarget
            ? estudiantes.filter((e) => e.asignaturaId === importSubjectTarget.id)
            : []
        }
        onImportComplete={handleImportComplete}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDeleteSubject}
        subjectName={deleteTarget?.nombre || ''}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed bottom-6 right-6 z-50 bg-[#172033] text-white text-xs px-4 py-3 rounded-xl shadow-xl border border-[#DCE3EC]/20 flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
