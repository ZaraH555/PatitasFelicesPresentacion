import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DIAS_SEMANA, DiaSemana } from '../models/disponibilidad.model';

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
  diasSemana = DIAS_SEMANA;
  showPaseadorFields = false;

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
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      rol: ['dueño'],
      paseadorData: this.fb.group({
        zona_servicio: [''],
        tarifa: [0]
      }),
      disponibilidad: this.fb.array([])
    });

    this.recoveryForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]]
    });

    // Subscribe to role changes to show/hide paseador fields
    this.registerForm.get('rol')?.valueChanges.subscribe(rol => {
      this.showPaseadorFields = rol === 'paseador';
      
      if (this.showPaseadorFields) {
        this.registerForm.get('paseadorData.zona_servicio')?.setValidators(Validators.required);
        this.registerForm.get('paseadorData.tarifa')?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        this.registerForm.get('paseadorData.zona_servicio')?.clearValidators();
        this.registerForm.get('paseadorData.tarifa')?.clearValidators();
      }
      
      this.registerForm.get('paseadorData.zona_servicio')?.updateValueAndValidity();
      this.registerForm.get('paseadorData.tarifa')?.updateValueAndValidity();
    });
  }

  get disponibilidadArray() {
    return this.registerForm.get('disponibilidad') as FormArray;
  }

  addDisponibilidad() {
    const disponibilidadGroup = this.fb.group({
      dia_semana: ['lunes', Validators.required],
      hora_inicio: ['08:00', Validators.required],
      hora_fin: ['18:00', Validators.required]
    });
    
    this.disponibilidadArray.push(disponibilidadGroup);
  }

  removeDisponibilidad(index: number) {
    this.disponibilidadArray.removeAt(index);
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
      const formValue = this.registerForm.value;
      const userData = {
        nombre: formValue.nombre,
        apellido: formValue.apellido,
        correo: formValue.correo,
        telefono: formValue.telefono,
        direccion: formValue.direccion,
        contrasena: formValue.contrasena,
        rol: formValue.rol
      };

      let paseadorData = null;
      let disponibilidad = null;

      if (formValue.rol === 'paseador') {
        paseadorData = formValue.paseadorData;
        disponibilidad = formValue.disponibilidad;
      }

      this.authService.registrar(userData, paseadorData, disponibilidad).subscribe({
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
    } else {
      // Mark all form controls as touched to display validation errors
      this.markFormGroupTouched(this.registerForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
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
      this.registerForm.reset({
        rol: 'dueño'
      });
      // Clear disponibilidad array
      while (this.disponibilidadArray.length) {
        this.disponibilidadArray.removeAt(0);
      }
      this.showPaseadorFields = false;
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
