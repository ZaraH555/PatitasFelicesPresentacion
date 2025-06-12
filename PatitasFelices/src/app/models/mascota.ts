export type TamanoMascota = 'pequeño' | 'mediano' | 'grande';

export interface Mascota {
  id: number;
  nombre: string;
  raza: string;
  tamano: 'pequeño' | 'mediano' | 'grande';
  edad: number;
  tipoEdad: 'años' | 'meses';  // Add this field
  notas?: string;
  imagen_url?: string;
}

export interface MascotaFormData extends Omit<Mascota, 'id' | 'imagen' | 'imagen_url'> {
  imagen?: File;
  tipoEdad: 'años' | 'meses';
}

export interface MascotaResponse extends Mascota {
  mensaje?: string;
  error?: string;
}
