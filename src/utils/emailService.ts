import { Estudiante, NotaEstudiante, Asignatura, ResultadoEnvioResumen, RegistroEnvioCorreo } from '../types';

export function formatGradeEmailContent(
  asignaturaNombre: string,
  estudianteNombre: string,
  nota: number | string
) {
  const subject = `Nota - ${asignaturaNombre}`;
  const body = `Hola ${estudianteNombre}:

Tu nota correspondiente a la asignatura ${asignaturaNombre} es:

${nota}

Saludos.`;

  return { subject, body };
}

export function isValidEmail(email?: string): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

export interface PreparedGradeEmail {
  estudiante: Estudiante;
  notaObj?: NotaEstudiante;
  isReady: boolean;
  motivoNoListo?: 'FALTA_CORREO' | 'FALTA_NOTA' | 'CORREO_INVALIDO';
  motivoTexto?: string;
  asunto: string;
  mensaje: string;
}

export function prepareGradeEmailsForSubject(
  asignatura: Asignatura,
  students: Estudiante[],
  grades: NotaEstudiante[]
): PreparedGradeEmail[] {
  // Map of RU to grade
  const gradeMap = new Map<string, NotaEstudiante>();
  grades
    .filter((g) => g.asignaturaId === asignatura.id)
    .forEach((g) => {
      gradeMap.set(g.registroUniversitario.trim().toLowerCase(), g);
    });

  return students.map((student) => {
    const normRU = student.registroUniversitario.trim().toLowerCase();
    const gradeObj = gradeMap.get(normRU);
    const hasEmail = Boolean(student.correoElectronico && student.correoElectronico.trim() !== '');
    const hasValidFormat = hasEmail && isValidEmail(student.correoElectronico);
    const hasGrade = Boolean(gradeObj && gradeObj.nota !== undefined && gradeObj.nota !== '');

    let isReady = false;
    let motivoNoListo: 'FALTA_CORREO' | 'FALTA_NOTA' | 'CORREO_INVALIDO' | undefined = undefined;
    let motivoTexto: string | undefined = undefined;

    if (!hasEmail) {
      motivoNoListo = 'FALTA_CORREO';
      motivoTexto = 'Sin correo electrónico registrado';
    } else if (!hasValidFormat) {
      motivoNoListo = 'CORREO_INVALIDO';
      motivoTexto = 'Formato de correo no válido';
    } else if (!hasGrade) {
      motivoNoListo = 'FALTA_NOTA';
      motivoTexto = 'Sin nota importada en esta asignatura';
    } else {
      isReady = true;
    }

    const { subject, body } = formatGradeEmailContent(
      asignatura.nombre,
      student.nombreCompleto,
      gradeObj ? gradeObj.nota : '[Sin Nota]'
    );

    return {
      estudiante: student,
      notaObj: gradeObj,
      isReady,
      motivoNoListo,
      motivoTexto,
      asunto: subject,
      mensaje: body,
    };
  });
}

export async function sendIndividualGradeEmails(
  asignatura: Asignatura,
  preparedList: PreparedGradeEmail[]
): Promise<{ resumen: ResultadoEnvioResumen; logs: RegistroEnvioCorreo[] }> {
  // Simulate dispatch network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  const timestamp = Date.now();
  const logs: RegistroEnvioCorreo[] = [];
  const detallesEnviados: ResultadoEnvioResumen['detallesEnviados'] = [];
  const detallesNoEnviados: ResultadoEnvioResumen['detallesNoEnviados'] = [];

  preparedList.forEach((item) => {
    if (item.isReady && item.notaObj) {
      logs.push({
        id: `log-${timestamp}-${item.estudiante.id}`,
        asignaturaId: asignatura.id,
        tipo: 'NOTAS_INDIVIDUALES',
        asunto: item.asunto,
        destinatarioRU: item.estudiante.registroUniversitario,
        destinatarioNombre: item.estudiante.nombreCompleto,
        destinatarioCorreo: item.estudiante.correoElectronico!,
        cuerpoMensaje: item.mensaje,
        fechaEnvio: timestamp,
        estado: 'ENVIADO',
        notaEnviada: item.notaObj.nota,
      });

      detallesEnviados.push({
        registro: item.estudiante.registroUniversitario,
        nombre: item.estudiante.nombreCompleto,
        correo: item.estudiante.correoElectronico!,
        nota: item.notaObj.nota,
      });
    } else {
      logs.push({
        id: `log-${timestamp}-${item.estudiante.id}`,
        asignaturaId: asignatura.id,
        tipo: 'NOTAS_INDIVIDUALES',
        asunto: item.asunto,
        destinatarioRU: item.estudiante.registroUniversitario,
        destinatarioNombre: item.estudiante.nombreCompleto,
        destinatarioCorreo: item.estudiante.correoElectronico || '',
        cuerpoMensaje: item.mensaje,
        fechaEnvio: timestamp,
        estado: 'FALLIDO',
        errorMotivo: item.motivoTexto,
        notaEnviada: item.notaObj?.nota,
      });

      detallesNoEnviados.push({
        registro: item.estudiante.registroUniversitario,
        nombre: item.estudiante.nombreCompleto,
        correo: item.estudiante.correoElectronico,
        motivo: item.motivoNoListo || 'FALTA_CORREO',
        descripcion: item.motivoTexto || 'No se pudo enviar',
      });
    }
  });

  const resumen: ResultadoEnvioResumen = {
    tipo: 'NOTAS_INDIVIDUALES',
    totalProcesados: preparedList.length,
    enviadosExitosos: detallesEnviados.length,
    noEnviadosCount: detallesNoEnviados.length,
    fecha: timestamp,
    detallesEnviados,
    detallesNoEnviados,
  };

  return { resumen, logs };
}

export async function sendGeneralAnnouncementEmails(
  asignatura: Asignatura,
  students: Estudiante[],
  asunto: string,
  mensaje: string
): Promise<{ resumen: ResultadoEnvioResumen; logs: RegistroEnvioCorreo[] }> {
  // Simulate dispatch network latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  const timestamp = Date.now();
  const logs: RegistroEnvioCorreo[] = [];
  const detallesEnviados: ResultadoEnvioResumen['detallesEnviados'] = [];
  const detallesNoEnviados: ResultadoEnvioResumen['detallesNoEnviados'] = [];

  students.forEach((student) => {
    const hasEmail = Boolean(student.correoElectronico && student.correoElectronico.trim() !== '');
    const valid = hasEmail && isValidEmail(student.correoElectronico);

    if (valid) {
      logs.push({
        id: `log-aviso-${timestamp}-${student.id}`,
        asignaturaId: asignatura.id,
        tipo: 'AVISO_GENERAL',
        asunto,
        destinatarioRU: student.registroUniversitario,
        destinatarioNombre: student.nombreCompleto,
        destinatarioCorreo: student.correoElectronico!,
        cuerpoMensaje: mensaje,
        fechaEnvio: timestamp,
        estado: 'ENVIADO',
      });

      detallesEnviados.push({
        registro: student.registroUniversitario,
        nombre: student.nombreCompleto,
        correo: student.correoElectronico!,
      });
    } else {
      logs.push({
        id: `log-aviso-${timestamp}-${student.id}`,
        asignaturaId: asignatura.id,
        tipo: 'AVISO_GENERAL',
        asunto,
        destinatarioRU: student.registroUniversitario,
        destinatarioNombre: student.nombreCompleto,
        destinatarioCorreo: student.correoElectronico || '',
        cuerpoMensaje: mensaje,
        fechaEnvio: timestamp,
        estado: 'FALLIDO',
        errorMotivo: !hasEmail ? 'Sin correo registrado' : 'Formato de correo inválido',
      });

      detallesNoEnviados.push({
        registro: student.registroUniversitario,
        nombre: student.nombreCompleto,
        correo: student.correoElectronico,
        motivo: !hasEmail ? 'FALTA_CORREO' : 'CORREO_INVALIDO',
        descripcion: !hasEmail ? 'Sin correo registrado' : 'Formato de correo inválido',
      });
    }
  });

  const resumen: ResultadoEnvioResumen = {
    tipo: 'AVISO_GENERAL',
    totalProcesados: students.length,
    enviadosExitosos: detallesEnviados.length,
    noEnviadosCount: detallesNoEnviados.length,
    fecha: timestamp,
    detallesEnviados,
    detallesNoEnviados,
  };

  return { resumen, logs };
}
