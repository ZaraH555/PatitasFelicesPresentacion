import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-restablecer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <h2>Restablecer Contraseña</h2>
      <form [formGroup]="restablecerForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <input type="password" formControlName="nuevaContrasena" 
                 placeholder="Nueva contraseña">
        </div>
        <div class="form-group">
          <input type="password" formControlName="confirmarContrasena" 
                 placeholder="Confirmar contraseña">
        </div>
        <button type="submit" [disabled]="restablecerForm.invalid">
          Restablecer Contraseña
        </button>
      </form>
      <div *ngIf="error" class="error-message">{{error}}</div>
      <div *ngIf="success" class="success-message">{{success}}</div>
    </div>
  `,
  styleUrls: ['../auth.component.css']
})
export class RestablecerComponent implements OnInit {
  restablecerForm: FormGroup;
  error = '';
  success = '';
  token = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.restablecerForm = this.fb.group({
      nuevaContrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.token = this.route.snapshot.params['token'];
    if (!this.token) {
      this.router.navigate(['/auth']);
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('nuevaContrasena')?.value === g.get('confirmarContrasena')?.value
      ? null : {'mismatch': true};
  }

  onSubmit() {
    if (this.restablecerForm.valid) {
      this.authService.restablecerContrasena(
        this.token,
        this.restablecerForm.value.nuevaContrasena
      ).subscribe({
        next: () => {
          this.success = 'Contraseña actualizada correctamente';
          setTimeout(() => this.router.navigate(['/auth']), 2000);
        },
        error: (err) => {
          this.error = err.message || 'Error al restablecer contraseña';
        }
      });
    }
  }
}
