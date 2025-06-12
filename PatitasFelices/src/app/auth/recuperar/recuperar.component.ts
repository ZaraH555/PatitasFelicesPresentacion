import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="recuperar-container">
      <h2>Recuperar Contraseña</h2>
      <div *ngIf="!enviado">
        <form [formGroup]="recuperarForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <input type="email" formControlName="correo" placeholder="Correo electrónico"
                   [class.is-invalid]="recuperarForm.get('correo')?.invalid && recuperarForm.get('correo')?.touched">
            <div class="form-error" *ngIf="recuperarForm.get('correo')?.errors?.['required'] && recuperarForm.get('correo')?.touched">
              El correo es requerido
            </div>
            <div class="form-error" *ngIf="recuperarForm.get('correo')?.errors?.['email'] && recuperarForm.get('correo')?.touched">
              Ingrese un correo válido
            </div>
          </div>
          <button type="submit" [disabled]="recuperarForm.invalid || isLoading">
            {{isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}}
          </button>
        </form>
      </div>
      <div *ngIf="enviado" class="success-message">
        <p>{{mensaje}}</p>
        <p>Por favor, revisa tu correo electrónico y sigue las instrucciones.</p>
        <a routerLink="/auth">Volver al inicio de sesión</a>
      </div>
      <div *ngIf="error" class="error-message">{{error}}</div>
    </div>
  `,
  styleUrls: ['../auth.component.css']
})
export class RecuperarComponent {
  recuperarForm: FormGroup;
  mensaje = '';
  error = '';
  enviado = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.recuperarForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.recuperarForm.valid) {
      this.isLoading = true;
      this.authService.solicitarRecuperacion(this.recuperarForm.value.correo).subscribe({
        next: () => {
          this.mensaje = 'Se ha enviado un enlace de recuperación a tu correo';
          this.enviado = true;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = err.message;
          this.isLoading = false;
        }
      });
    }
  }
}
