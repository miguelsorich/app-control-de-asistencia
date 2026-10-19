import { DocenteUsuario } from '../types';

export const INITIAL_DOCENTES: DocenteUsuario[] = [
  {
    id: 'docente-6379',
    codigoDocente: '6379',
    nombreCompleto: 'Lic. Miguel Antonio Sorich Rojas',
    correo: 'miguelsorich@gmail.com',
    contrasena: '6379',
    carrera: 'Facultad de Ciencias Contables',
    telefono: '70852033',
    activo: true,
    fechaCreacion: Date.now() - 3600000 * 24 * 60,
  },
];
