import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

interface AuthResponse {
  usuario: Usuario;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSubject = new BehaviorSubject<Usuario | null>(null);
  public user$ = this.userSubject.asObservable();
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadStoredUser();
    }
  }

  get userValue(): Usuario | null {
    return this.userSubject.value;
  }

  private loadStoredUser(): void {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.userSubject.next(user);
        // this.startRefreshTokenTimer();
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    }
  }

  // private startRefreshTokenTimer() {
  //   const token = this.getToken();
  //   if (token) {
  //     const jwtToken = JSON.parse(atob(token.split('.')[1]));
  //     const expires = new Date(jwtToken.exp * 1000);
  //     const timeout = expires.getTime() - Date.now() - (5 * 60 * 1000);
  //     this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
  //   }
  // }

  // private stopRefreshTokenTimer() {
  //   if (this.refreshTokenTimeout) {
  //     clearTimeout(this.refreshTokenTimeout);
  //   }
  // }

  // private setStoredUser(user: Usuario | null): void {
  //   if (isBrowser()) {
  //     if (user) {
  //       localStorage.setItem('user', JSON.stringify(user));
  //     } else {
  //       localStorage.removeItem('user');
  //     }
  //   }
  // }

  login(correo: string, contrasena: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { correo, contrasena })
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.usuario));
          this.userSubject.next(response.usuario);
          
          switch (response.usuario.rol) {
            case 'administrador':
              this.router.navigate(['/admin']);
              break;
            case 'paseador':
              this.router.navigate(['/paseador']);
              break;
            case 'dueño':
              this.router.navigate(['/mascotas']);
              break;
            default:
              this.router.navigate(['/mascotas']);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  // refreshToken(): Observable<any> {
  //   return this.http.post<any>(`${environment.apiUrl}/auth/refresh-token`, {})
  //     .pipe(
  //       tap(response => {
  //         if (response.token) {
  //           localStorage.setItem('token', response.token);
  //           this.startRefreshTokenTimer();
  //         }
  //       }),
  //       catchError(this.handleError)
  //     );
  // }
  

  getDashboardRoute(rol: string): string {
    switch (rol) {
      case 'administrador': return '/admin';
      case 'paseador': return '/paseador';
      default: return '/dashboard';
    }
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    this.userSubject.next(null);
    // this.stopRefreshTokenTimer();
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('token');
  }

  registrar(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registro`, usuario).pipe(
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
