import { supabase } from '../lib/supabase';
import {
  Asignatura,
  Estudiante,
  RegistroAsistencia,
  SesionHabilitacion,
  NotaEstudiante,
  RegistroEnvioCorreo,
  DocenteUsuario,
  OfertaAcademicaItem,
} from '../types';

export const SUPABASE_SQL_SCHEMA = `
-- Script SQL para crear todas las tablas en Supabase (Copiar y pegar en SQL Editor de Supabase)

-- 1. Tabla de Asignaturas
CREATE TABLE IF NOT EXISTS public.asignaturas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  sigla TEXT NOT NULL,
  grupo TEXT NOT NULL,
  semestre INTEGER NOT NULL DEFAULT 1,
  año INTEGER NOT NULL DEFAULT 2026,
  modalidad TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  aula TEXT,
  color_tag TEXT,
  fecha_creacion BIGINT NOT NULL
);

-- 2. Tabla de Estudiantes
CREATE TABLE IF NOT EXISTS public.estudiantes (
  id TEXT PRIMARY KEY,
  asignatura_id TEXT NOT NULL,
  registro_universitario TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  correo_electronico TEXT DEFAULT '',
  fecha_importacion BIGINT NOT NULL
);

-- 3. Tabla de Asistencias
CREATE TABLE IF NOT EXISTS public.registros_asistencia (
  id TEXT PRIMARY KEY,
  asignatura_id TEXT NOT NULL,
  registro_universitario TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora_marcado TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'PRESENTE',
  timestamp BIGINT NOT NULL
);

-- 4. Tabla de Sesiones de Habilitación
CREATE TABLE IF NOT EXISTS public.sesiones_habilitacion (
  id TEXT PRIMARY KEY,
  asignatura_id TEXT NOT NULL,
  fecha TEXT NOT NULL,
  hora_inicio_habilitacion TEXT NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  creado_timestamp BIGINT NOT NULL,
  expira_timestamp BIGINT NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true,
  cerrado_manualmente BOOLEAN DEFAULT false
);

-- 5. Tabla de Notas
CREATE TABLE IF NOT EXISTS public.notas_estudiante (
  id TEXT PRIMARY KEY,
  asignatura_id TEXT NOT NULL,
  registro_universitario TEXT NOT NULL,
  nombre_completo TEXT NOT NULL,
  primer_parcial TEXT DEFAULT '',
  segundo_parcial TEXT DEFAULT '',
  examen_final TEXT DEFAULT '',
  nota_final TEXT DEFAULT '',
  fecha_actualizacion BIGINT NOT NULL
);

-- 6. Tabla de Correos
CREATE TABLE IF NOT EXISTS public.registros_envio_correo (
  id TEXT PRIMARY KEY,
  asignatura_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  asunto TEXT NOT NULL,
  destinatario_ru TEXT NOT NULL,
  destinatario_nombre TEXT NOT NULL,
  destinatario_correo TEXT NOT NULL,
  cuerpo_mensaje TEXT,
  fecha_envio BIGINT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'ENVIADO',
  error_motivo TEXT,
  nota_enviada TEXT
);

-- Habilitar RLS permitiendo lectura y escritura anónima para la aplicación
ALTER TABLE public.asignaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sesiones_habilitacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_estudiante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_envio_correo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on asignaturas" ON public.asignaturas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on estudiantes" ON public.estudiantes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on registros_asistencia" ON public.registros_asistencia FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on sesiones_habilitacion" ON public.sesiones_habilitacion FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on notas_estudiante" ON public.notas_estudiante FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on registros_envio_correo" ON public.registros_envio_correo FOR ALL USING (true) WITH CHECK (true);
`;

// Helper: Check connection
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { error } = await supabase.from('asignaturas').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist yet
        return {
          ok: true,
          message: 'Conectado a Supabase (tablas pendientes de creación vía SQL Editor)',
        };
      }
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Conectado exitosamente con Supabase PostgreSQL' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Error de red con Supabase' };
  }
}

// ---------------------------------------------
// ASIGNATURAS
// ---------------------------------------------
export async function fetchAsignaturasMetadataFromSupabase(): Promise<Record<string, { docenteId?: string; docenteNombre?: string; carrera?: string }> | null> {
  try {
    const { data, error } = await supabase
      .from('registros_envio_correo')
      .select('cuerpo_mensaje')
      .eq('id', 'SYSTEM_ASIGNATURAS_METADATA')
      .single();
    if (error || !data || !data.cuerpo_mensaje) return null;
    return JSON.parse(data.cuerpo_mensaje);
  } catch (e) {
    return null;
  }
}

export async function saveAsignaturasMetadataToSupabase(metadata: Record<string, { docenteId?: string; docenteNombre?: string; carrera?: string }>): Promise<boolean> {
  try {
    const { error } = await supabase.from('registros_envio_correo').upsert({
      id: 'SYSTEM_ASIGNATURAS_METADATA',
      asignatura_id: 'SYSTEM',
      tipo: 'SYSTEM_STATE',
      asunto: 'METADATA',
      destinatario_ru: 'SYSTEM',
      destinatario_nombre: 'ADMIN',
      destinatario_correo: 'admin@uagrm.edu.bo',
      cuerpo_mensaje: JSON.stringify(metadata),
      fecha_envio: Date.now(),
      estado: 'ENVIADO',
    });
    return !error;
  } catch (e) {
    return false;
  }
}

export async function fetchAsignaturasFromSupabase(): Promise<Asignatura[] | null> {
  try {
    const [asigResult, metaMap] = await Promise.all([
      supabase.from('asignaturas').select('*').order('fecha_creacion', { ascending: false }),
      fetchAsignaturasMetadataFromSupabase(),
    ]);

    const { data, error } = asigResult;
    if (error || !data) return null;

    return data.map((row: any) => {
      const meta = metaMap?.[row.id];
      const isInitialMiguel = ['asig-1', 'asig-2', 'asig-3', 'asig-4'].includes(row.id);

      return {
        id: row.id,
        nombre: row.nombre,
        sigla: row.sigla,
        grupo: row.grupo,
        semestre: row.semestre === 2 ? 2 : 1,
        año: Number(row.año || 2026),
        modalidad: row.modalidad,
        horaInicio: row.hora_inicio,
        horaFin: row.hora_fin,
        aula: row.aula || '',
        colorTag: row.color_tag || '',
        fechaCreacion: Number(row.fecha_creacion || Date.now()),
        docenteId: meta?.docenteId || (isInitialMiguel ? 'docente-6379' : undefined),
        docenteNombre: meta?.docenteNombre || (isInitialMiguel ? 'Lic. Miguel Antonio Sorich Rojas' : undefined),
        carrera: meta?.carrera || (isInitialMiguel ? 'Facultad de Ciencias Contables' : undefined),
      };
    });
  } catch (e) {
    console.warn('[Supabase] fetchAsignaturas failed:', e);
    return null;
  }
}

export async function saveAsignaturaToSupabase(asig: Asignatura): Promise<boolean> {
  try {
    const { error } = await supabase.from('asignaturas').upsert({
      id: asig.id,
      nombre: asig.nombre,
      sigla: asig.sigla,
      grupo: asig.grupo,
      semestre: asig.semestre,
      año: asig.año,
      modalidad: asig.modalidad,
      hora_inicio: asig.horaInicio,
      hora_fin: asig.horaFin,
      aula: asig.aula || '',
      color_tag: asig.colorTag || '',
      fecha_creacion: asig.fechaCreacion,
    });
    if (error) {
      console.warn('[Supabase] saveAsignatura error:', error.message);
      return false;
    }

    // Persist docenteId and other metadata
    if (asig.docenteId || asig.carrera) {
      fetchAsignaturasMetadataFromSupabase().then((existingMeta) => {
        const nextMeta = existingMeta ? { ...existingMeta } : {};
        nextMeta[asig.id] = {
          docenteId: asig.docenteId,
          docenteNombre: asig.docenteNombre,
          carrera: asig.carrera,
        };
        saveAsignaturasMetadataToSupabase(nextMeta);
      });
    }

    return true;
  } catch (e) {
    console.warn('[Supabase] saveAsignatura failed:', e);
    return false;
  }
}

export async function deleteAsignaturaFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('asignaturas').delete().eq('id', id);
    if (error) {
      console.warn('[Supabase] deleteAsignatura error:', error.message);
      return false;
    }
    // Also clean child records
    await Promise.allSettled([
      supabase.from('estudiantes').delete().eq('asignatura_id', id),
      supabase.from('registros_asistencia').delete().eq('asignatura_id', id),
      supabase.from('sesiones_habilitacion').delete().eq('asignatura_id', id),
      supabase.from('notas_estudiante').delete().eq('asignatura_id', id),
    ]);
    return true;
  } catch (e) {
    console.warn('[Supabase] deleteAsignatura failed:', e);
    return false;
  }
}

// ---------------------------------------------
// ESTUDIANTES
// ---------------------------------------------
export async function fetchEstudiantesFromSupabase(): Promise<Estudiante[] | null> {
  try {
    let allRecords: any[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('estudiantes')
        .select('*')
        .order('fecha_importacion', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.warn('[Supabase] fetchEstudiantes page error:', error.message);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      allRecords.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }

    if (allRecords.length === 0) return null;
    return allRecords.map((row: any) => ({
      id: row.id,
      asignaturaId: row.asignatura_id,
      registroUniversitario: row.registro_universitario,
      nombreCompleto: row.nombre_completo,
      correoElectronico: row.correo_electronico || '',
      fechaImportacion: Number(row.fecha_importacion || Date.now()),
    }));
  } catch (e) {
    console.warn('[Supabase] fetchEstudiantes failed:', e);
    return null;
  }
}

export async function saveEstudiantesBatchToSupabase(estudiantes: Estudiante[]): Promise<boolean> {
  if (!estudiantes || estudiantes.length === 0) return true;
  try {
    const payload = estudiantes.map((e) => ({
      id: e.id,
      asignatura_id: e.asignaturaId,
      registro_universitario: e.registroUniversitario,
      nombre_completo: e.nombreCompleto,
      correo_electronico: e.correoElectronico || '',
      fecha_importacion: e.fechaImportacion,
    }));
    const { error } = await supabase.from('estudiantes').upsert(payload);
    if (error) {
      console.warn('[Supabase] saveEstudiantesBatch error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] saveEstudiantesBatch failed:', e);
    return false;
  }
}

// ---------------------------------------------
// ASISTENCIAS (CON PAGINACIÓN COMPLETA >1000 REGISTROS)
// ---------------------------------------------
export async function fetchAsistenciasFromSupabase(): Promise<RegistroAsistencia[] | null> {
  try {
    let allRecords: any[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('registros_asistencia')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) {
        console.warn('[Supabase] fetchAsistencias page error:', error.message);
        break;
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      allRecords.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    }

    if (allRecords.length === 0) return null;
    return allRecords.map((row: any) => ({
      id: row.id,
      asignaturaId: row.asignatura_id,
      registroUniversitario: row.registro_universitario,
      fecha: row.fecha,
      horaMarcado: row.hora_marcado,
      estado: row.estado as any,
      timestamp: Number(row.timestamp || Date.now()),
    }));
  } catch (e) {
    console.warn('[Supabase] fetchAsistencias failed:', e);
    return null;
  }
}

export async function saveAsistenciaToSupabase(asis: RegistroAsistencia): Promise<boolean> {
  try {
    const { error } = await supabase.from('registros_asistencia').upsert({
      id: asis.id,
      asignatura_id: asis.asignaturaId,
      registro_universitario: asis.registroUniversitario,
      fecha: asis.fecha,
      hora_marcado: asis.horaMarcado,
      estado: asis.estado,
      timestamp: asis.timestamp,
    });
    if (error) {
      console.warn('[Supabase] saveAsistencia error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] saveAsistencia failed:', e);
    return false;
  }
}

export async function saveAsistenciasBatchToSupabase(registros: RegistroAsistencia[]): Promise<boolean> {
  if (!registros || registros.length === 0) return true;
  try {
    const payload = registros.map((a) => ({
      id: a.id,
      asignatura_id: a.asignaturaId,
      registro_universitario: a.registroUniversitario,
      fecha: a.fecha,
      hora_marcado: a.horaMarcado,
      estado: a.estado,
      timestamp: a.timestamp,
    }));
    const { error } = await supabase.from('registros_asistencia').upsert(payload);
    if (error) {
      console.warn('[Supabase] saveAsistenciasBatch error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] saveAsistenciasBatch failed:', e);
    return false;
  }
}

// ---------------------------------------------
// SESIONES HABILITACION (ORDENADAS POR TIMESTAMP)
// ---------------------------------------------
export async function fetchSesionesFromSupabase(): Promise<Record<string, SesionHabilitacion> | null> {
  try {
    const { data, error } = await supabase
      .from('sesiones_habilitacion')
      .select('*')
      .order('creado_timestamp', { ascending: true });

    if (error || !data) return null;
    const map: Record<string, SesionHabilitacion> = {};
    for (const row of data) {
      // Al ordenar ascendente por creado_timestamp, la última fila procesada
      // para cada asignatura_id será siempre la más reciente creada.
      map[row.asignatura_id] = {
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
    }
    return map;
  } catch (e) {
    console.warn('[Supabase] fetchSesiones failed:', e);
    return null;
  }
}

export async function saveSesionToSupabase(sesion: SesionHabilitacion): Promise<boolean> {
  try {
    const { error } = await supabase.from('sesiones_habilitacion').upsert({
      id: sesion.id,
      asignatura_id: sesion.asignaturaId,
      fecha: sesion.fecha,
      hora_inicio_habilitacion: sesion.horaInicioHabilitacion,
      duracion_minutos: sesion.duracionMinutos,
      creado_timestamp: sesion.creadoTimestamp,
      expira_timestamp: sesion.expiraTimestamp,
      activa: sesion.activa,
      cerrado_manualmente: sesion.cerradoManualmente || false,
    });
    if (error) {
      console.warn('[Supabase] saveSesion error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] saveSesion failed:', e);
    return false;
  }
}

// ---------------------------------------------
// NOTAS
// ---------------------------------------------
export async function fetchNotasFromSupabase(): Promise<NotaEstudiante[] | null> {
  try {
    const { data, error } = await supabase.from('notas_estudiante').select('*');
    if (error || !data) return null;
    return data.map((row: any) => ({
      id: row.id,
      asignaturaId: row.asignatura_id,
      registroUniversitario: row.registro_universitario,
      nombreCompleto: row.nombre_completo,
      primerParcial: row.primer_parcial ?? '',
      segundoParcial: row.segundo_parcial ?? '',
      examenFinal: row.examen_final ?? '',
      notaFinal: row.nota_final ?? '',
      fechaActualizacion: Number(row.fecha_actualizacion || Date.now()),
    }));
  } catch (e) {
    console.warn('[Supabase] fetchNotas failed:', e);
    return null;
  }
}

export async function saveNotasBatchToSupabase(notas: NotaEstudiante[]): Promise<boolean> {
  if (!notas || notas.length === 0) return true;
  try {
    const payload = notas.map((n) => ({
      id: n.id,
      asignatura_id: n.asignaturaId,
      registro_universitario: n.registroUniversitario,
      nombre_completo: n.nombreCompleto,
      primer_parcial: String(n.primerParcial ?? ''),
      segundo_parcial: String(n.segundoParcial ?? ''),
      examen_final: String(n.examenFinal ?? ''),
      nota_final: String(n.notaFinal ?? ''),
      fecha_actualizacion: n.fechaActualizacion,
    }));
    const { error } = await supabase.from('notas_estudiante').upsert(payload);
    if (error) {
      console.warn('[Supabase] saveNotasBatch error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] saveNotasBatch failed:', e);
    return false;
  }
}

// ---------------------------------------------
// CORREOS
// ---------------------------------------------
export async function fetchCorreosFromSupabase(): Promise<RegistroEnvioCorreo[] | null> {
  try {
    const { data, error } = await supabase.from('registros_envio_correo').select('*');
    if (error || !data) return null;
    return data.map((row: any) => ({
      id: row.id,
      asignaturaId: row.asignatura_id,
      tipo: row.tipo as any,
      asunto: row.asunto,
      destinatarioRU: row.destinatario_ru,
      destinatarioNombre: row.destinatario_nombre,
      destinatarioCorreo: row.destinatario_correo,
      cuerpoMensaje: row.cuerpo_mensaje || '',
      fechaEnvio: Number(row.fecha_envio || Date.now()),
      estado: row.estado as any,
      errorMotivo: row.error_motivo,
      notaEnviada: row.nota_enviada,
    }));
  } catch (e) {
    console.warn('[Supabase] fetchCorreos failed:', e);
    return null;
  }
}

export async function saveCorreosBatchToSupabase(correos: RegistroEnvioCorreo[]): Promise<boolean> {
  if (!correos || correos.length === 0) return true;
  try {
    const payload = correos.map((c) => ({
      id: c.id,
      asignatura_id: c.asignaturaId,
      tipo: c.tipo,
      asunto: c.asunto,
      destinatario_ru: c.destinatarioRU,
      destinatario_nombre: c.destinatarioNombre,
      destinatario_correo: c.destinatarioCorreo,
      cuerpo_mensaje: c.cuerpoMensaje,
      fecha_envio: c.fechaEnvio,
      estado: c.estado,
      error_motivo: c.errorMotivo,
      nota_enviada: c.notaEnviada ? String(c.notaEnviada) : null,
    }));
    const { error } = await supabase.from('registros_envio_correo').upsert(payload);
    if (error) {
      console.warn('[Supabase] saveCorreosBatch error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] saveCorreosBatch failed:', e);
    return false;
  }
}

// ---------------------------------------------
// DOCENTES (PERSISTENCIA GLOBAL EN LA NUBE)
// ---------------------------------------------
export async function fetchDocentesFromSupabase(): Promise<DocenteUsuario[] | null> {
  try {
    const { data, error } = await supabase
      .from('registros_envio_correo')
      .select('cuerpo_mensaje')
      .eq('id', 'SYSTEM_DOCENTES_CATALOG')
      .single();
    if (error || !data || !data.cuerpo_mensaje) return null;
    const parsed = JSON.parse(data.cuerpo_mensaje);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.warn('[Supabase] fetchDocentes failed:', e);
    return null;
  }
}

export async function saveDocentesToSupabase(docentes: DocenteUsuario[]): Promise<boolean> {
  if (!docentes) return false;
  try {
    const { error } = await supabase.from('registros_envio_correo').upsert({
      id: 'SYSTEM_DOCENTES_CATALOG',
      asignatura_id: 'SYSTEM',
      tipo: 'SYSTEM_STATE',
      asunto: 'DOCENTES',
      destinatario_ru: 'SYSTEM',
      destinatario_nombre: 'ADMIN',
      destinatario_correo: 'admin@uagrm.edu.bo',
      cuerpo_mensaje: JSON.stringify(docentes),
      fecha_envio: Date.now(),
      estado: 'ENVIADO',
    });
    if (error) {
      console.warn('[Supabase] saveDocentes error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] saveDocentes failed:', e);
    return false;
  }
}

// ---------------------------------------------
// OFERTA ACADÉMICA (PERSISTENCIA GLOBAL EN LA NUBE)
// ---------------------------------------------
export async function fetchOfertaAcademicaFromSupabase(): Promise<OfertaAcademicaItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('registros_envio_correo')
      .select('cuerpo_mensaje')
      .eq('id', 'SYSTEM_OFERTA_CATALOG')
      .single();
    if (error || !data || !data.cuerpo_mensaje) return null;
    const parsed = JSON.parse(data.cuerpo_mensaje);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.warn('[Supabase] fetchOfertaAcademica failed:', e);
    return null;
  }
}

export async function saveOfertaAcademicaToSupabase(oferta: OfertaAcademicaItem[]): Promise<boolean> {
  if (!oferta) return false;
  try {
    const { error } = await supabase.from('registros_envio_correo').upsert({
      id: 'SYSTEM_OFERTA_CATALOG',
      asignatura_id: 'SYSTEM',
      tipo: 'SYSTEM_STATE',
      asunto: 'OFERTA',
      destinatario_ru: 'SYSTEM',
      destinatario_nombre: 'ADMIN',
      destinatario_correo: 'admin@uagrm.edu.bo',
      cuerpo_mensaje: JSON.stringify(oferta),
      fecha_envio: Date.now(),
      estado: 'ENVIADO',
    });
    if (error) {
      console.warn('[Supabase] saveOfertaAcademica error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] saveOfertaAcademica failed:', e);
    return false;
  }
}
