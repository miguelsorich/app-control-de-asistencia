export type ModalidadSemanal = 'LUN_MIE_VIE' | 'MAR_JUE' | 'SABADO';

export interface ModalidadConfig {
  id: ModalidadSemanal;
  label: string;
  shortLabel: string;
  dias: string[];
  clasesPorSemana: number;
  duracionClaseMinutos: number;
  duracionTexto: string;
}

export const MODALIDADES: Record<ModalidadSemanal, ModalidadConfig> = {
  LUN_MIE_VIE: {
    id: 'LUN_MIE_VIE',
    label: 'Lunes, miércoles y viernes',
    shortLabel: 'Lun - Mié - Vie',
    dias: ['Lunes', 'Miércoles', 'Viernes'],
    clasesPorSemana: 3,
    duracionClaseMinutos: 90,
    duracionTexto: '1h 30m por clase (3 clases/sem)',
  },
  MAR_JUE: {
    id: 'MAR_JUE',
    label: 'Martes y jueves',
    shortLabel: 'Mar - Jue',
    dias: ['Martes', 'Jueves'],
    clasesPorSemana: 2,
    duracionClaseMinutos: 135,
    duracionTexto: '2h 15m por clase (2 clases/sem)',
  },
  SABADO: {
    id: 'SABADO',
    label: 'Sábado',
    shortLabel: 'Sábado',
    dias: ['Sábado'],
    clasesPorSemana: 1,
    duracionClaseMinutos: 270,
    duracionTexto: '4h 30m por clase (1 clase/sem)',
  },
};

export type SemestreAsignatura = 1 | 2;

export interface Asignatura {
  id: string;
  nombre: string;
  sigla: string;
  grupo: string;
  semestre: SemestreAsignatura;
  año: number;
  modalidad: ModalidadSemanal;
  horaInicio: string; // HH:MM
  horaFin: string; // HH:MM
  aula?: string; // opcional para mayor claridad
  colorTag?: string; // color temático sutil para identificar la materia
  fechaCreacion: number;
}

export interface Estudiante {
  id: string;
  asignaturaId: string;
  registroUniversitario: string;
  nombreCompleto: string;
  correoElectronico: string;
  fechaImportacion: number;
}

export interface ImportSummaryResult {
  totalLeidos: number;
  nuevosAgregados: number;
  yaExistentesOmitidos: number;
  invalidosOmitidos: number;
  estudiantesNuevos: Estudiante[];
  duplicadosEncontrados: {
    registro: string;
    nombre: string;
  }[];
  erroresDetalle?: string[];
}

export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE';

export interface RegistroAsistencia {
  id: string;
  asignaturaId: string;
  registroUniversitario: string;
  fecha: string; // YYYY-MM-DD
  horaMarcado: string; // HH:MM:SS
  estado: EstadoAsistencia; // 'PRESENTE'
  timestamp: number;
}

export interface SesionHabilitacion {
  id: string;
  asignaturaId: string;
  fecha: string; // YYYY-MM-DD
  horaInicioHabilitacion: string; // HH:MM:SS
  duracionMinutos: number;
  creadoTimestamp: number;
  expiraTimestamp: number;
  activa: boolean;
  cerradoManualmente?: boolean;
}

export interface SesionAsistenciaConfig {
  asignaturaId: string;
  habilitada: boolean;
  fechaClase: string; // YYYY-MM-DD
  tema?: string;
}

export interface NotaEstudiante {
  id: string;
  asignaturaId: string;
  registroUniversitario: string;
  nombreCompleto: string;
  primerParcial: number | string;
  segundoParcial: number | string;
  examenFinal: number | string;
  notaFinal: number | string;
  // Deprecated/fallback field if needed
  nota?: number | string;
  fechaActualizacion: number;
}

export interface ImportGradesSummary {
  totalLeidos: number;
  importadosCorrectamente: number; // nuevos procesados correctamente
  actualizados: number; // actualizados
  noEncontradosCount: number;
  noEncontrados: {
    registro: string;
    nombre: string;
    primerParcial?: string | number;
    segundoParcial?: string | number;
    examenFinal?: string | number;
    notaFinal?: string | number;
  }[];
  notasValidas: NotaEstudiante[];
  erroresDetalle?: string[];
}

export type TipoEnvioCorreo = 'NOTAS_INDIVIDUALES' | 'AVISO_GENERAL';

export interface RegistroEnvioCorreo {
  id: string;
  asignaturaId: string;
  tipo: TipoEnvioCorreo;
  asunto: string;
  destinatarioRU: string;
  destinatarioNombre: string;
  destinatarioCorreo: string;
  cuerpoMensaje: string;
  fechaEnvio: number;
  estado: 'ENVIADO' | 'FALLIDO';
  errorMotivo?: string;
  notaEnviada?: number | string;
}

export interface ResultadoEnvioResumen {
  tipo: TipoEnvioCorreo;
  totalProcesados: number;
  enviadosExitosos: number;
  noEnviadosCount: number;
  fecha: number;
  detallesNoEnviados: {
    registro: string;
    nombre: string;
    correo?: string;
    motivo: 'FALTA_CORREO' | 'FALTA_NOTA' | 'CORREO_INVALIDO';
    descripcion: string;
  }[];
  detallesEnviados: {
    registro: string;
    nombre: string;
    correo: string;
    nota?: number | string;
  }[];
}

