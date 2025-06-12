import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="registro-container">
      <h2>Registro de Usuario</h2>
      <form [formGroup]="registroForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <input type="text" formControlName="nombre" placeholder="Nombre">
        </div>
        <div class="form-group">
          <input type="text" formControlName="apellido" placeholder="Apellido">
        </div>
        <div class="form-group">
          <input type="email" formControlName="correo" placeholder="Correo">
        </div>
        <div class="form-group">
          <input type="tel" formControlName="telefono" placeholder="Teléfono">
        </div>
        <div class="form-group">
          <input type="text" formControlName="direccion" placeholder="Dirección">
        </div>
        <div class="form-group">
          <input type="password" formControlName="contrasena" placeholder="Contraseña">
        </div>
        <div class="form-group">
          <select formControlName="rol">
            <option value="dueño">Dueño de Mascota</option>
            <option value="paseador">Paseador</option>
          </select>
        </div>
        <button type="submit" [disabled]="registroForm.invalid">Registrar</button>
      </form>
      <div *ngIf="error" class="error-message">{{error}}</div>
    </div>
  `,
  styleUrls: ['../auth.component.css']
})
export class RegistroComponent {
  registroForm: FormGroup;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      direccion: ['', Validators.required],
      contrasena: ['', Validators.required],
      rol: ['dueño']
    });
  }

  onSubmit() {
    if (this.registroForm.valid) {
      this.authService.registrar(this.registroForm.value).subscribe({
        next: () => this.router.navigate(['/auth']),
        error: (err) => this.error = err.message
      });
    }
  }
}
