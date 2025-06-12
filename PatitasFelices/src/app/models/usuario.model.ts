export type UserRole = 'administrador' | 'dueño' | 'paseador';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'dueño' | 'paseador' | 'administrador';
  verificado?: boolean;
}
