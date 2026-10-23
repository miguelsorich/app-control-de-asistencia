import React, { useState, useEffect, useCallback } from 'react';
import {
  Asignatura,
  Estudiante,
  RegistroAsistencia,
  SesionHabilitacion,
  NotaEstudiante,
  RegistroEnvioCorreo,
  DocenteUsuario,
  OfertaAcademicaItem,
} from './types';
import { INITIAL_SUBJECTS } from './data/initialSubjects';
import { INITIAL_STUDENTS } from './data/initialStudents';
import { INITIAL_ATTENDANCE } from './data/initialAttendance';
import { INITIAL_GRADES } from './data/initialGrades';
import { INITIAL_DOCENTES } from './data/initialDocentes';
import { INITIAL_OFERTA_ACADEMICA } from './data/initialOfertaAcademica';
import { Header } from './components/Header';
import { SubjectFormModal } from './components/SubjectFormModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ImportStudentsModal } from './components/ImportStudentsModal';
import { StudentAttendanceView } from './components/StudentAttendanceView';
import { TeacherPortalView, DocenteSection } from './components/TeacherPortalView';
import { MainAccessScreen } from './components/MainAccessScreen';
import { AdminPortalView } from './components/AdminPortalView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { getTodayDateString, formatCurrentTimeWithSeconds } from './utils/scheduleValidators';
import {
  fetchAsignaturasFromSupabase,
  saveAsignaturaToSupabase,
  deleteAsignaturaFromSupabase,
  fetchEstudiantesFromSupabase,
  saveEstudiantesBatchToSupabase,
  fetchAsistenciasFromSupabase,
  saveAsistenciaToSupabase,
  saveAsistenciasBatchToSupabase,
  fetchSesionesFromSupabase,
  saveSesionToSupabase,
  fetchNotasFromSupabase,
  saveNotasBatchToSupabase,
  fetchDocentesFromSupabase,
  saveDocentesToSupabase,
  fetchOfertaAcademicaFromSupabase,
  saveOfertaAcademicaToSupabase,
} from './services/supabaseSync';
import { supabase } from './lib/supabase';
import { CheckCircle2, GraduationCap, Lock } from 'lucide-react';

const STORAGE_KEY_SUBJECTS = 'uagrm_asistencia_asignaturas_v1';
const STORAGE_KEY_STUDENTS = 'uagrm_asistencia_estudiantes_v1';
const STORAGE_KEY_ATTENDANCE = 'uagrm_asistencia_registros_v1';
const STORAGE_KEY_SESIONES = 'uagrm_asistencia_sesiones_v1';
const STORAGE_KEY_GRADES = 'uagrm_asistencia_notas_v1';
const STORAGE_KEY_EMAIL_LOGS = 'uagrm_asistencia_correos_v1';
const STORAGE_KEY_DOCENTES = 'uagrm_asistencia_docentes_v1';
const STORAGE_KEY_OFERTA = 'uagrm_asistencia_oferta_v1';
const STORAGE_KEY_ACTIVE_TEACHER = 'uagrm_docente_current_teacher';
const STORAGE_KEY_ADMIN_CREDS = 'uagrm_asistencia_admin_creds_v1';

export default function App() {
  // Primary Navigation State: Default to 'MAIN' (Vista General con acceso a Docentes y Estudiantes)
  const [activeMainTab, setActiveMainTab] = useState<'MAIN' | 'DOCENTE' | 'ESTUDIANTE' | 'ADMIN'>('MAIN');
  const [activeTeacherSection, setActiveTeacherSection] = useState<DocenteSection>('DASHBOARD');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // Admin Credentials (default username 'admin', password '0715')
  const [adminCredentials, setAdminCredentials] = useState<{ username: string; password: string }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADMIN_CREDS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { username: 'admin', password: '0715' };
  });

  // Docentes state (Solo datos reales; Lic. Miguel Antonio Sorich Rojas y docentes creados por el admin)
  const [docentes, setDocentes] = useState<DocenteUsuario[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DOCENTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filtrar cualquier docente ficticio de pruebas anteriores
          const cleaned = parsed.filter(
            (d) =>
              d.id === 'docente-6379' ||
              (!d.id.includes('test') && !d.nombreCompleto.toLowerCase().includes('ficticio'))
          );
          if (!cleaned.some((d) => d.id === 'docente-6379')) {
            cleaned.unshift(INITIAL_DOCENTES[0]);
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Error loading docentes:', e);
    }
    return INITIAL_DOCENTES;
  });

  // Oferta Académica state (Maestro de oferta)
  const [ofertaAcademica, setOfertaAcademica] = useState<OfertaAcademicaItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OFERTA);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error loading oferta:', e);
    }
    return INITIAL_OFERTA_ACADEMICA;
  });

  // Currently logged-in Teacher: Null by default so every teacher (including Lic. Miguel Antonio Sorich Rojas) must enter their credentials
  const [currentDocente, setCurrentDocente] = useState<DocenteUsuario | null>(null);

  // Referencias para el activador secreto de 3 clics en el pie de página
  const footerClickCountRef = React.useRef<number>(0);
  const footerClickTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Activación del modo docente / administrador (tras 3 clics)
  const handleUnlockDocente = useCallback(() => {
    setActiveMainTab('DOCENTE');
    setToastMessage('Acceso Docente / Administrador habilitado');
    setTimeout(() => {
      setToastMessage((prev) => (prev === 'Acceso Docente / Administrador habilitado' ? null : prev));
    }, 3000);
  }, []);

  // Apertura directa a la pestaña de Gráficos & Rendimiento con Recharts
  const handleOpenDocenteGraficos = useCallback(() => {
    setActiveTeacherSection('GRAFICOS');
    setActiveMainTab('DOCENTE');
    setToastMessage('Visualizando Resumen de Rendimiento con Recharts');
    setTimeout(() => {
      setToastMessage((prev) => (prev === 'Visualizando Resumen de Rendimiento con Recharts' ? null : prev));
    }, 3000);
  }, []);

  const handleSecretFooterClick = () => {
    footerClickCountRef.current += 1;
    if (footerClickTimerRef.current) {
      clearTimeout(footerClickTimerRef.current);
    }
    if (footerClickCountRef.current >= 3) {
      footerClickCountRef.current = 0;
      handleUnlockDocente();
    } else {
      footerClickTimerRef.current = setTimeout(() => {
        footerClickCountRef.current = 0;
      }, 2000);
    }
  };

  // Subjects State (Módulo 1): Las 4 asignaturas de Lic. Miguel Antonio Sorich Rojas + asignaturas de otros docentes
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>(() => {
    const map = new Map<string, Asignatura>();
    // Siempre asegurar las 4 materias del Lic. Miguel Antonio Sorich Rojas
    INITIAL_SUBJECTS.forEach((initSub) => {
      map.set(initSub.id, {
        ...initSub,
        docenteId: 'docente-6379',
        docenteNombre: 'Lic. Miguel Antonio Sorich Rojas',
      });
    });

    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: Asignatura) => {
            if (item && item.id) {
              const isInitialMiguel = INITIAL_SUBJECTS.some((s) => s.id === item.id);
              map.set(item.id, {
                ...item,
                semestre: item.semestre === 2 ? 2 : 1,
                año: item.año ? Number(item.año) : ((item as any).anio ? Number((item as any).anio) : 2026),
                docenteId: item.docenteId || (isInitialMiguel ? 'docente-6379' : undefined),
                docenteNombre: item.docenteNombre || (isInitialMiguel ? 'Lic. Miguel Antonio Sorich Rojas' : undefined),
              });
            }
          });
        }
      }
    } catch (e) {
      console.error('Error loading subjects from localStorage:', e);
    }
    return Array.from(map.values());
  });

  // Students State (Módulo 2): Nómina oficial asegurada para las asignaturas
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>(() => {
    const map = new Map<string, Estudiante>();
    INITIAL_STUDENTS.forEach((e) => map.set(e.id, e));
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((e: Estudiante) => {
            if (e && e.id) map.set(e.id, e);
          });
        }
      }
    } catch (e) {
      console.error('Error loading students from localStorage:', e);
    }
    return Array.from(map.values());
  });

  // Attendance Records State (Módulo 3): Recuperación y conservación permanente de asistencias de Lic. Miguel Antonio Sorich Rojas
  const [registrosAsistencia, setRegistrosAsistencia] = useState<RegistroAsistencia[]>(() => {
    const map = new Map<string, RegistroAsistencia>();
    // Recuperar todos los registros de asistencia oficiales
    INITIAL_ATTENDANCE.forEach((r) => map.set(r.id, r));

    try {
      const saved = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: RegistroAsistencia) => {
            if (r && r.id) {
              map.set(r.id, r);
            }
          });
        }
      }
    } catch (e) {
      console.error('Error loading attendance records from localStorage:', e);
    }
    return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
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

  // Grades State (Módulo 6): Recuperación y conservación permanente de notas de Lic. Miguel Antonio Sorich Rojas
  const [notas, setNotas] = useState<NotaEstudiante[]>(() => {
    const map = new Map<string, NotaEstudiante>();
    // Recuperar todas las calificaciones oficiales
    INITIAL_GRADES.forEach((n) => map.set(n.id, n));

    try {
      const saved = localStorage.getItem(STORAGE_KEY_GRADES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((n: NotaEstudiante) => {
            if (n && n.id) {
              map.set(n.id, n);
            }
          });
        }
      }
    } catch (e) {
      console.error('Error loading grades from localStorage:', e);
    }
    return Array.from(map.values());
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

  // Supabase Initial Load and Sync (Preservación permanente y sin pérdida de datos locales o creados por el administrador)
  const loadAllDataFromSupabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [
        remoteAsig,
        remoteEst,
        remoteAsis,
        remoteSes,
        remoteNot,
        remoteDoc,
        remoteOf,
      ] = await Promise.all([
        fetchAsignaturasFromSupabase(),
        fetchEstudiantesFromSupabase(),
        fetchAsistenciasFromSupabase(),
        fetchSesionesFromSupabase(),
        fetchNotasFromSupabase(),
        fetchDocentesFromSupabase(),
        fetchOfertaAcademicaFromSupabase(),
      ]);

      // 1. ASIGNATURAS: Merge remote with local and preserve Lic. Miguel Antonio Sorich Rojas's 4 subjects
      if (remoteAsig && remoteAsig.length > 0) {
        setAsignaturas((prevLocal) => {
          const map = new Map<string, Asignatura>();
          INITIAL_SUBJECTS.forEach((initSub) => {
            map.set(initSub.id, {
              ...initSub,
              docenteId: 'docente-6379',
              docenteNombre: 'Lic. Miguel Antonio Sorich Rojas',
            });
          });
          remoteAsig.forEach((s) => {
            const existing = map.get(s.id);
            map.set(s.id, {
              ...s,
              docenteId: s.docenteId || existing?.docenteId,
              docenteNombre: s.docenteNombre || existing?.docenteNombre,
              carrera: s.carrera || existing?.carrera,
            });
          });
          prevLocal.forEach((s) => {
            if (!map.has(s.id)) {
              map.set(s.id, s);
              saveAsignaturaToSupabase(s);
            } else {
              const current = map.get(s.id)!;
              if (!current.docenteId && s.docenteId) {
                map.set(s.id, {
                  ...current,
                  docenteId: s.docenteId,
                  docenteNombre: s.docenteNombre,
                });
              }
            }
          });
          return Array.from(map.values());
        });
      } else {
        // Seed initial subjects to Supabase
        for (const s of asignaturas) {
          saveAsignaturaToSupabase(s);
        }
      }

      // 2. DOCENTES: Cargar desde Supabase y sincronizar con docentes creados por el administrador
      if (remoteDoc && remoteDoc.length > 0) {
        setDocentes((prevLocal) => {
          const map = new Map<string, DocenteUsuario>();
          map.set(INITIAL_DOCENTES[0].id, INITIAL_DOCENTES[0]);
          remoteDoc.forEach((d) => map.set(d.id, d));
          prevLocal.forEach((d) => {
            if (!map.has(d.id)) {
              map.set(d.id, d);
            }
          });
          const merged = Array.from(map.values());
          saveDocentesToSupabase(merged);
          return merged;
        });
      } else {
        setDocentes((prevLocal) => {
          saveDocentesToSupabase(prevLocal);
          return prevLocal;
        });
      }

      // 3. OFERTA ACADÉMICA: Cargar desde Supabase y sincronizar catálogo maestro / importaciones
      if (remoteOf && remoteOf.length > 0) {
        setOfertaAcademica((prevLocal) => {
          const map = new Map<string, OfertaAcademicaItem>();
          INITIAL_OFERTA_ACADEMICA.forEach((o) => map.set(o.id, o));
          remoteOf.forEach((o) => map.set(o.id, o));
          prevLocal.forEach((o) => {
            if (!map.has(o.id)) {
              map.set(o.id, o);
            }
          });
          const merged = Array.from(map.values());
          saveOfertaAcademicaToSupabase(merged);
          return merged;
        });
      } else {
        setOfertaAcademica((prevLocal) => {
          saveOfertaAcademicaToSupabase(prevLocal);
          return prevLocal;
        });
      }

      if (remoteEst && remoteEst.length > 0) {
        setEstudiantes(remoteEst);
      } else {
        saveEstudiantesBatchToSupabase(estudiantes);
      }

      if (remoteAsis && remoteAsis.length > 0) {
        setRegistrosAsistencia((prevLocal) => {
          const map = new Map<string, RegistroAsistencia>();
          INITIAL_ATTENDANCE.forEach((r) => map.set(r.id, r));
          remoteAsis.forEach((r) => map.set(r.id, r));
          const unsynced: RegistroAsistencia[] = [];
          prevLocal.forEach((r) => {
            if (!map.has(r.id)) {
              map.set(r.id, r);
              unsynced.push(r);
            }
          });
          if (unsynced.length > 0) {
            saveAsistenciasBatchToSupabase(unsynced);
          }
          return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      } else {
        setRegistrosAsistencia((prevLocal) => {
          const map = new Map<string, RegistroAsistencia>();
          INITIAL_ATTENDANCE.forEach((r) => map.set(r.id, r));
          prevLocal.forEach((r) => map.set(r.id, r));
          const list = Array.from(map.values());
          if (list.length > 0) {
            saveAsistenciasBatchToSupabase(list);
          }
          return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        });
      }

      if (remoteSes && Object.keys(remoteSes).length > 0) {
        setSesionesHabilitacion(remoteSes);
      }

      if (remoteNot && remoteNot.length > 0) {
        setNotas((prevLocal) => {
          const map = new Map<string, NotaEstudiante>();
          INITIAL_GRADES.forEach((n) => map.set(n.id, n));
          remoteNot.forEach((n) => map.set(n.id, n));
          const unsynced: NotaEstudiante[] = [];
          prevLocal.forEach((n) => {
            if (!map.has(n.id)) {
              map.set(n.id, n);
              unsynced.push(n);
            }
          });
          if (unsynced.length > 0) {
            saveNotasBatchToSupabase(unsynced);
          }
          return Array.from(map.values());
        });
      } else {
        setNotas((prevLocal) => {
          const map = new Map<string, NotaEstudiante>();
          INITIAL_GRADES.forEach((n) => map.set(n.id, n));
          prevLocal.forEach((n) => map.set(n.id, n));
          const list = Array.from(map.values());
          if (list.length > 0) {
            saveNotasBatchToSupabase(list);
          }
          return list;
        });
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

  // Sincronización en tiempo real y periódica (Live Sync para habilitación y marcaciones en vivo)
  useEffect(() => {
    // 1. Canal Realtime de Supabase para eventos inmediatos
    const channel = supabase
      .channel('live-asistencia-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sesiones_habilitacion' },
        (payload) => {
          if (payload.new) {
            const row: any = payload.new;
            const updatedSesion: SesionHabilitacion = {
              id: row.id,
              asignaturaId: row.asignatura_id,
              fecha: row.fecha,
              horaInicioHabilitacion: row.hora_inicio_habilitacion,
              duracionMinutos: Number(row.duracion_minutos),
              creadoTimestamp: Number(row.creado_timestamp),
              expiraTimestamp: Number(row.expira_timestamp),
              activa: Boolean(row.activa),
              cerradoManualmente: Boolean(row.cerrado_manualmente),
            };
            setSesionesHabilitacion((prev) => {
              const current = prev[updatedSesion.asignaturaId];
              if (!current || updatedSesion.creadoTimestamp >= current.creadoTimestamp) {
                return {
                  ...prev,
                  [updatedSesion.asignaturaId]: updatedSesion,
                };
              }
              return prev;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registros_asistencia' },
        (payload) => {
          if (payload.new) {
            const row: any = payload.new;
            const newRecord: RegistroAsistencia = {
              id: row.id,
              asignaturaId: row.asignatura_id,
              registroUniversitario: row.registro_universitario,
              fecha: row.fecha,
              horaMarcado: row.hora_marcado,
              estado: row.estado as any,
              timestamp: Number(row.timestamp || Date.now()),
            };
            setRegistrosAsistencia((prev) => {
              if (prev.some((r) => r.id === newRecord.id)) {
                return prev.map((r) => (r.id === newRecord.id ? newRecord : r));
              }
              return [newRecord, ...prev];
            });
          }
        }
      )
      .subscribe();

    // 2. Intervalo de respaldo periódico cada 6 segundos para actualización automática sin recargar
    const pollingInterval = setInterval(async () => {
      try {
        const [remoteSes, remoteAsis] = await Promise.all([
          fetchSesionesFromSupabase(),
          fetchAsistenciasFromSupabase(),
        ]);

        if (remoteSes && Object.keys(remoteSes).length > 0) {
          setSesionesHabilitacion((prev) => {
            const hasChanged = Object.keys(remoteSes).some((k) => {
              const old = prev[k];
              const cur = remoteSes[k];
              if (!old) return true;
              return (
                old.id !== cur.id ||
                old.activa !== cur.activa ||
                old.cerradoManualmente !== cur.cerradoManualmente ||
                old.expiraTimestamp !== cur.expiraTimestamp
              );
            });
            return hasChanged ? remoteSes : prev;
          });
        }

        if (remoteAsis && remoteAsis.length > 0) {
          setRegistrosAsistencia((prevLocal) => {
            if (remoteAsis.length !== prevLocal.length) {
              const map = new Map<string, RegistroAsistencia>();
              remoteAsis.forEach((r) => map.set(r.id, r));
              prevLocal.forEach((r) => {
                if (!map.has(r.id)) map.set(r.id, r);
              });
              return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            }
            return prevLocal;
          });
        }
      } catch (err) {
        // Silently tolerate background poll hiccups
      }
    }, 6000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollingInterval);
    };
  }, []);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DOCENTES, JSON.stringify(docentes));
    } catch (e) {
      console.error('Error saving docentes to localStorage:', e);
    }
  }, [docentes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OFERTA, JSON.stringify(ofertaAcademica));
    } catch (e) {
      console.error('Error saving oferta to localStorage:', e);
    }
  }, [ofertaAcademica]);

  useEffect(() => {
    try {
      if (currentDocente) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_TEACHER, JSON.stringify(currentDocente));
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_TEACHER);
      }
    } catch (e) {
      console.error('Error saving currentDocente:', e);
    }
  }, [currentDocente]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  // ==========================================
  // ADMIN & OFERTA HANDLERS
  // ==========================================
  const handleOpenAdminLogin = () => {
    setIsAdminLoginOpen(true);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoginOpen(false);
    setActiveMainTab('ADMIN');
    showToast('Acceso Propietario / Administrador habilitado.');
  };

  const handleUpdateAdminCredentials = (newCreds: { username: string; password: string }) => {
    setAdminCredentials(newCreds);
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_CREDS, JSON.stringify(newCreds));
    } catch (e) {
      console.warn('Error saving admin creds', e);
    }
    showToast('Credenciales de Administrador actualizadas con éxito.');
  };

  const handleSaveDocente = (newDoc: DocenteUsuario) => {
    setDocentes((prev) => {
      const updated = [newDoc, ...prev.filter((d) => d.id !== newDoc.id)];
      saveDocentesToSupabase(updated);
      return updated;
    });
    showToast(`Docente "${newDoc.nombreCompleto}" registrado con éxito.`);
  };

  const handleUpdateDocente = (updatedDoc: DocenteUsuario) => {
    setDocentes((prev) => {
      const updated = prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d));
      saveDocentesToSupabase(updated);
      return updated;
    });
    if (currentDocente?.id === updatedDoc.id) {
      setCurrentDocente(updatedDoc);
    }
    showToast(`Credenciales del docente "${updatedDoc.nombreCompleto}" actualizadas.`);
  };

  const handleDeleteDocente = (docenteId: string) => {
    setDocentes((prev) => {
      const updated = prev.filter((d) => d.id !== docenteId);
      saveDocentesToSupabase(updated);
      return updated;
    });
    showToast('Docente eliminado del sistema.');
  };

  const handleSaveOfertaItem = (newItem: OfertaAcademicaItem) => {
    setOfertaAcademica((prev) => {
      const updated = [newItem, ...prev.filter((o) => o.id !== newItem.id)];
      saveOfertaAcademicaToSupabase(updated);
      return updated;
    });
    showToast(`Materia "${newItem.sigla} - ${newItem.nombre}" agregada al Maestro de Oferta.`);
  };

  const handleUpdateOfertaItem = (updatedItem: OfertaAcademicaItem) => {
    setOfertaAcademica((prev) => {
      const updated = prev.map((o) => (o.id === updatedItem.id ? updatedItem : o));
      saveOfertaAcademicaToSupabase(updated);
      return updated;
    });
    showToast(`Materia "${updatedItem.sigla} - ${updatedItem.nombre}" actualizada en la oferta.`);
  };

  const handleImportOfertaItems = (items: OfertaAcademicaItem[]) => {
    setOfertaAcademica((prev) => {
      const updated = [...items, ...prev];
      saveOfertaAcademicaToSupabase(updated);
      return updated;
    });
    showToast(`${items.length} asignaturas importadas al Maestro de Oferta.`);
  };

  const handleDeleteOfertaItem = (itemId: string) => {
    setOfertaAcademica((prev) => {
      const updated = prev.filter((o) => o.id !== itemId);
      saveOfertaAcademicaToSupabase(updated);
      return updated;
    });
    showToast('Asignatura retirada de la oferta académica.');
  };

  const handleResetOfertaDefault = () => {
    setOfertaAcademica(INITIAL_OFERTA_ACADEMICA);
    saveOfertaAcademicaToSupabase(INITIAL_OFERTA_ACADEMICA);
    showToast('Oferta académica restablecida con el catálogo oficial UAGRM.');
  };

  // When a teacher selects a subject from the academic offer catalog
  const handleSelectOfertaItem = (item: OfertaAcademicaItem) => {
    const teacherId = currentDocente?.id || 'docente-6379';
    const teacherName = currentDocente?.nombreCompleto || 'Lic. Miguel Antonio Sorich Rojas';

    const newSubject: Asignatura = {
      id: `asig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sigla: item.sigla,
      nombre: item.nombre,
      grupo: item.grupo,
      semestre: item.semestre,
      año: item.año || 2026,
      modalidad: item.modalidad,
      horaInicio: item.horaInicio,
      horaFin: item.horaFin,
      aula: item.aula,
      colorTag: item.colorTag || '#174EAF',
      fechaCreacion: Date.now(),
      docenteId: teacherId,
      docenteNombre: teacherName,
      origenOfertaId: item.id,
      carrera: item.carrera,
    };

    setAsignaturas((prev) => [newSubject, ...prev]);
    saveAsignaturaToSupabase(newSubject);
    showToast(`Asignatura "${item.sigla} (${item.grupo})" incorporada exitosamente a tu portal docente.`);
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
      const teacherId = currentDocente?.id || 'docente-6379';
      const teacherName = currentDocente?.nombreCompleto || 'Lic. Miguel Antonio Sorich Rojas';

      const newSubject: Asignatura = {
        id: newId,
        ...data,
        docenteId: teacherId,
        docenteNombre: teacherName,
        fechaCreacion: Date.now(),
      };
      setAsignaturas((prev) => [newSubject, ...prev]);
      saveAsignaturaToSupabase(newSubject);
      showToast(`Asignatura "${data.sigla} - ${data.nombre}" creada manualmente.`);
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
    setRegistrosAsistencia((prev) => {
      // Evitar duplicación en la misma fecha para el mismo estudiante y materia, conservando todas las fechas anteriores intactas
      const filtered = prev.filter(
        (r) =>
          !(
            r.id === nuevoRegistro.id ||
            (r.asignaturaId === nuevoRegistro.asignaturaId &&
              r.registroUniversitario.trim().toLowerCase() ===
                nuevoRegistro.registroUniversitario.trim().toLowerCase() &&
              r.fecha === nuevoRegistro.fecha)
          )
      );
      return [nuevoRegistro, ...filtered];
    });
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
        onChangeTab={(tab) => {
          setActiveMainTab(tab);
          if (tab === 'DOCENTE') {
            setActiveTeacherSection('DASHBOARD');
          }
        }}
        onNavigateHome={() => setActiveMainTab('ESTUDIANTE')}
        onUnlockDocente={handleUnlockDocente}
        onOpenDocenteGraficos={handleOpenDocenteGraficos}
        onOpenAdminLogin={handleOpenAdminLogin}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeMainTab === 'ADMIN' ? (
          /* ==========================================
             PANEL DE ADMINISTRADOR PROPIETARIO
             Gestión centralizada de docentes, oferta y supervisión
             ========================================== */
          <AdminPortalView
            docentes={docentes}
            onSaveDocente={handleSaveDocente}
            onUpdateDocente={handleUpdateDocente}
            onDeleteDocente={handleDeleteDocente}
            ofertaAcademica={ofertaAcademica}
            onSaveOfertaItem={handleSaveOfertaItem}
            onUpdateOfertaItem={handleUpdateOfertaItem}
            onImportOfertaItems={handleImportOfertaItems}
            onDeleteOfertaItem={handleDeleteOfertaItem}
            onResetOfertaDefault={handleResetOfertaDefault}
            asignaturas={asignaturas}
            estudiantes={estudiantes}
            registrosAsistencia={registrosAsistencia}
            adminCredentials={adminCredentials}
            onUpdateAdminCredentials={handleUpdateAdminCredentials}
            onExitAdmin={() => setActiveMainTab('MAIN')}
          />
        ) : activeMainTab === 'DOCENTE' ? (
          /* ==========================================
             PORTAL DOCENTE (MÓDULO 9)
             Acceso para docentes con sus asignaturas y gestión
             ========================================== */
          <TeacherPortalView
            asignaturas={asignaturas}
            estudiantes={estudiantes}
            registrosAsistencia={registrosAsistencia}
            sesionesHabilitacion={sesionesHabilitacion}
            notas={notas}
            docentes={docentes}
            ofertaAcademica={ofertaAcademica}
            currentDocente={currentDocente}
            onLoginDocente={setCurrentDocente}
            onLogoutDocente={() => setCurrentDocente(null)}
            onUpdateDocente={handleUpdateDocente}
            onSelectOfertaItem={handleSelectOfertaItem}
            initialSection={activeTeacherSection}
            onSectionChange={(sec) => setActiveTeacherSection(sec)}
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
            onVolverDocente={() => {
              setActiveMainTab('DOCENTE');
              setActiveTeacherSection('DASHBOARD');
            }}
            onLogoutToMain={() => setActiveMainTab('MAIN')}
          />
        ) : (
          /* ==========================================
             VISTA GENERAL (MAIN ACCESS SCREEN)
             Acceso a Docentes y Acceso a Estudiantes
             ========================================== */
          <MainAccessScreen
            onSelectEstudiante={() => setActiveMainTab('ESTUDIANTE')}
            onSelectDocente={() => {
              setActiveMainTab('DOCENTE');
              setActiveTeacherSection('DASHBOARD');
            }}
            totalAsignaturas={asignaturas.length}
            totalEstudiantes={estudiantes.length}
            onOpenAdminLogin={handleOpenAdminLogin}
          />
        )}
      </main>

      {/* Footer con zona discreta de candado para el administrador */}
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

          <div className="flex items-center gap-2.5">
            <p
              onClick={handleSecretFooterClick}
              className="text-[#667085] text-[11px] select-none cursor-default"
              title="Facultad de Ciencias Contables UAGRM"
            >
              Facultad de Ciencias Contables, Auditoría, Sistemas de Control de Gestión y Finanzas
            </p>

            {/* Ícono de Candado discreto en el pie de página */}
            <button
              id="btn-footer-admin-candado"
              type="button"
              onClick={handleOpenAdminLogin}
              className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Acceso de Gestión con Clave"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal (Protegido con clave configurable de administrador) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        adminPassword={adminCredentials.password}
      />

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
