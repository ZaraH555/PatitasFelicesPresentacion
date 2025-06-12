import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  currentForm: 'login' | 'register' | 'recovery' = 'login';
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  recoveryForm!: FormGroup;
  error = '';

  private phonePattern = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      contrasena: ['', Validators.required],
      rol: ['dueño']
    });

    this.recoveryForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      const { correo, contrasena } = this.loginForm.value;
      this.authService.login(correo, contrasena).subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.router.navigate(['/mascotas']);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Login error:', err);
          this.error = err.message || 'Error al iniciar sesión';
        }
      });
    }
  }

  onRegister(): void {
    if (this.registerForm.valid) {
      this.authService.registrar(this.registerForm.value).subscribe({
        next: (response) => {
          console.log('Registration successful:', response);
          this.currentForm = 'login';
          this.loginForm.patchValue({
            correo: this.registerForm.value.correo
          });
          this.error = 'Registro exitoso. Por favor inicia sesión.';
        },
        error: (err: HttpErrorResponse) => {
          console.error('Registration error:', err);
          this.error = err.message || 'Error al registrarse';
        }
      });
    }
  }

  onRecovery(): void {
    if (this.recoveryForm.valid) {
      this.authService.solicitarRecuperacion(this.recoveryForm.value.correo).subscribe({
        next: () => {
          this.error = 'Se ha enviado un enlace de recuperación a tu correo';
          setTimeout(() => {
            this.currentForm = 'login';
            this.error = '';
          }, 3000);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Recovery error:', err);
          this.error = err.message || 'Error al solicitar recuperación';
        }
      });
    }
  }

  switchForm(form: 'login' | 'register' | 'recovery'): void {
    this.currentForm = form;
    this.error = '';

    if (form === 'login') {
      this.loginForm.reset();
    } else if (form === 'register') {
      this.registerForm.reset();
    } else if (form === 'recovery') {
      this.recoveryForm.reset();
    }
  }

  onFormSubmit(type: 'login' | 'register' | 'recovery'): void {
    switch(type) {
      case 'login':
        this.onLogin();
        break;
      case 'register':
        this.onRegister();
        break;
      case 'recovery':
        this.onRecovery();
        break;
    }
  }
}
