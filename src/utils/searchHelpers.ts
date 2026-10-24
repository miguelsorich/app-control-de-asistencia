import { OfertaAcademicaItem } from '../types';

/**
 * Normaliza una cadena eliminando acentos (diacríticos), convirtiendo a minúsculas y limpiando espacios.
 */
export function normalizeText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Extrae sólo caracteres alfanuméricos en minúsculas (sin acentos, espacios ni signos).
 * Muy útil para comparar siglas como "CPA-500", "CPA 500", "cpa500".
 */
export function cleanAlphaNum(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Determina si un elemento del Maestro de Oferta coincide con la búsqueda y filtros dados.
 * Soporta búsqueda multi-campo (Sigla, Grupo, Nombre, Docente, Código Docente, Carrera, Aula, Horario, Días, Semestre/NSA),
 * búsqueda por tokens de múltiples palabras (ej. "ADM A", "CPA500 MI", "Azogue 3000"),
 * e indiferencia ante tildes/espacios/guiones (ej. "CPA 500" coincide con "CPA500").
 */
export function matchOfertaItem(
  item: OfertaAcademicaItem,
  searchTerm: string,
  filterCarrera?: string,
  filterSemestre?: string
): boolean {
  // 1. Filtro de Carrera
  if (filterCarrera && filterCarrera !== 'TODAS') {
    const itemCarrera = normalizeText(item.carrera);
    const filterCarreraNorm = normalizeText(filterCarrera);
    if (!itemCarrera.includes(filterCarreraNorm)) {
      return false;
    }
  }

  // 2. Filtro de Semestre
  if (filterSemestre && filterSemestre !== 'TODOS') {
    const sem = String(item.semestre ?? '');
    const nsa = String(item.nsa ?? '');
    if (sem !== filterSemestre && nsa !== filterSemestre) {
      return false;
    }
  }

  // 3. Filtro de Búsqueda de Texto
  const rawTerm = searchTerm ? searchTerm.trim() : '';
  if (!rawTerm) return true;

  const cleanTerm = cleanAlphaNum(rawTerm);
  const normalizedTerm = normalizeText(rawTerm);

  const siglaClean = cleanAlphaNum(item.sigla);
  const grupoClean = cleanAlphaNum(item.grupo);
  const docIdClean = cleanAlphaNum(item.docenteAsignadoId);
  const aulaClean = cleanAlphaNum(item.aula);

  // Coincidencias alfanuméricas directas y prioritarias
  if (cleanTerm) {
    // Si busca "cpa500" o "cpa 500" o "cpa-500", coincide con sigla
    if (siglaClean.includes(cleanTerm)) return true;
    // Si busca "cpa500b" o "cpa 500 b", coincide con sigla + grupo
    if ((siglaClean + grupoClean).includes(cleanTerm)) return true;
    // Si busca código docente "3000" o "7381"
    if (docIdClean && docIdClean.includes(cleanTerm)) return true;
    // Si busca aula "21318" o "21411"
    if (aulaClean && aulaClean.includes(cleanTerm)) return true;
  }

  // Búsqueda multi-token desglosada por palabras
  const tokens = normalizedTerm.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  // Blob completo con todas las propiedades normalizadas del ítem
  const searchableBlob = normalizeText(
    [
      item.sigla,
      siglaClean,
      item.grupo,
      `grp ${item.grupo}`,
      `grupo ${item.grupo}`,
      item.nombre,
      item.carrera,
      item.docenteAsignadoNombre,
      item.docenteAsignadoId,
      item.aula,
      `aula ${item.aula}`,
      item.diasTexto,
      item.modalidad,
      item.horarioTexto,
      `${item.horaInicio || ''}-${item.horaFin || ''}`,
      item.nsa,
      item.semestre,
      `semestre ${item.semestre}`,
      `nsa ${item.nsa}`,
    ].join(' ')
  );

  // Todos los tokens deben estar presentes en el elemento
  return tokens.every((tok) => {
    // Probar token normalizado en el blob
    if (searchableBlob.includes(tok)) return true;
    // Probar token alfanumérico limpio en sigla o grupo
    const cleanTok = cleanAlphaNum(tok);
    if (cleanTok && (siglaClean.includes(cleanTok) || grupoClean === cleanTok)) {
      return true;
    }
    return false;
  });
}
