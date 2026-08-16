import { Estudiante } from '../types';

export const INITIAL_STUDENTS: Estudiante[] = [
  {
    id: 'est-1',
    asignaturaId: 'asig-1', // Estructuras de Datos I
    registroUniversitario: '220014521',
    nombreCompleto: 'Alvarez Torrico Carlos Daniel',
    correoElectronico: 'carlos.alvarez@uagrm.edu.bo',
    fechaImportacion: Date.now() - 3600000 * 20,
  },
  {
    id: 'est-2',
    asignaturaId: 'asig-1', // Estructuras de Datos I
    registroUniversitario: '219087654',
    nombreCompleto: 'Balcazar Mendez Maria Elena',
    correoElectronico: 'maria.balcazar@uagrm.edu.bo',
    fechaImportacion: Date.now() - 3600000 * 20,
  },
  {
    id: 'est-3',
    asignaturaId: 'asig-1', // Estructuras de Datos I
    registroUniversitario: '221045123',
    nombreCompleto: 'Cabrera Justiniano Jorge Luis',
    correoElectronico: 'jorge.cabrera@uagrm.edu.bo',
    fechaImportacion: Date.now() - 3600000 * 20,
  },
  {
    id: 'est-4',
    asignaturaId: 'asig-1', // Estructuras de Datos I
    registroUniversitario: '220198765',
    nombreCompleto: 'Daza Hurtado Valeria Sofia',
    correoElectronico: 'valeria.daza@uagrm.edu.bo',
    fechaImportacion: Date.now() - 3600000 * 20,
  },
  {
    id: 'est-5',
    asignaturaId: 'asig-2', // Cálculo I (Note: same student 220014521 enrolled in another subject to demonstrate multi-subject enrollment)
    registroUniversitario: '220014521',
    nombreCompleto: 'Alvarez Torrico Carlos Daniel',
    correoElectronico: 'carlos.alvarez@uagrm.edu.bo',
    fechaImportacion: Date.now() - 3600000 * 15,
  },
  {
    id: 'est-6',
    asignaturaId: 'asig-2', // Cálculo I
    registroUniversitario: '218054321',
    nombreCompleto: 'Eguez Sandoval Fernando Andres',
    correoElectronico: 'fernando.eguez@uagrm.edu.bo',
    fechaImportacion: Date.now() - 3600000 * 15,
  },
  {
    id: 'est-7',
    asignaturaId: 'asig-2', // Cálculo I
    registroUniversitario: '221098342',
    nombreCompleto: 'Flores Gutierrez Gabriel Alejandro',
    correoElectronico: 'gabriel.flores@uagrm.edu.bo',
    fechaImportacion: Date.now() - 3600000 * 15,
  },
];
