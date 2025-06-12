export type UserRole = 'administrador' | 'dueño' | 'paseador';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string;
  direccion?: string;
  rol: UserRole;
}
