import { Injectable, inject, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Disponibilidad } from '../models/disponibilidad.model';

interface AuthResponse {
  usuario: Usuario;
  token: string;
}

interface RegistroUsuarioData {
  usuario: Partial<Usuario>;
  paseadorData?: {
    zona_servicio: string;
    tarifa: number;
  };
  disponibilidad?: Disponibilidad[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<Usuario | null>(null);
  public user$ = this.userSubject.asObservable();
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredUser();
    }
  }

  get userValue(): Usuario | null {
    return this.userSubject.value;
  }

  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        this.userSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }

  login(correo: string, contrasena: string): Observable<any> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { correo, contrasena })
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.usuario));
          this.userSubject.next(response.usuario);
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    this.userSubject.next(null);
    this.router.navigate(['/auth']);
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
  }

  registrar(usuario: Partial<Usuario>, paseadorData?: any, disponibilidad?: Disponibilidad[]): Observable<Usuario> {
    const registroData: RegistroUsuarioData = {
      usuario
    };

    if (usuario.rol === 'paseador' && paseadorData) {
      registroData.paseadorData = paseadorData;
      
      if (disponibilidad && disponibilidad.length > 0) {
        registroData.disponibilidad = disponibilidad;
      }
    }

    return this.http.post<Usuario>(`${this.apiUrl}/registro`, registroData).pipe(
      tap(user => {
        console.log('Usuario registrado:', user);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  restablecerContrasena(token: string, nuevaContrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/restablecer`, {
      token,
      nuevaContrasena
    }).pipe(
      catchError(this.handleError)
    );
  }

  solicitarRecuperacion(correo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/recuperar`, { correo }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error: ${error.status}, ${error.message}`;
    }
    console.error('Auth error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
