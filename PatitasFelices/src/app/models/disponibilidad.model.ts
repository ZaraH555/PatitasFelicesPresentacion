export interface Disponibilidad {
  id?: number;
  paseador_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
}

export type DiaSemana = 'lunes' | 'martes' | 'miércoles' | 'jueves' | 'viernes' | 'sábado' | 'domingo';

export const DIAS_SEMANA: DiaSemana[] = [
  'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'
];
