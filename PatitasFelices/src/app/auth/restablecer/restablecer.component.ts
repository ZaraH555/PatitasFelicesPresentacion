import { Component, OnInit, OnDestroy } from '@angular/core';
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
      
      <div *ngIf="success" class="success-notification">
        <div class="success-icon">✓</div>
        <div class="success-message">
          <h3>¡Contraseña Actualizada!</h3>
          <p>{{success}}</p>
          <p class="redirect-message">Serás redirigido en {{countdown}} segundos...</p>
        </div>
      </div>

      <form *ngIf="!success" [formGroup]="restablecerForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <input type="password" formControlName="nuevaContrasena" 
                 placeholder="Nueva contraseña">
          <div *ngIf="restablecerForm.get('nuevaContrasena')?.invalid && restablecerForm.get('nuevaContrasena')?.touched" 
               class="validation-error">
            La contraseña debe tener al menos 6 caracteres
          </div>
        </div>
        <div class="form-group">
          <input type="password" formControlName="confirmarContrasena" 
                 placeholder="Confirmar contraseña">
          <div *ngIf="restablecerForm.hasError('mismatch') && 
                      restablecerForm.get('confirmarContrasena')?.touched" 
               class="validation-error">
            Las contraseñas no coinciden
          </div>
        </div>
        <button type="submit" [disabled]="restablecerForm.invalid">
          Restablecer Contraseña
        </button>
      </form>

      <div *ngIf="error && !success" class="error-notification">
        <div class="error-icon">!</div>
        <div class="error-message">{{error}}</div>
      </div>
    </div>
  `,
  styles: [`
    .success-notification {
      background-color: #e8f5e9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      display: flex;
      align-items: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      animation: fadeIn 0.5s ease;
    }
    
    .success-icon {
      background-color: #4caf50;
      color: white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-right: 15px;
    }
    
    .success-message {
      flex: 1;
    }
    
    .success-message h3 {
      color: #2e7d32;
      margin: 0 0 10px 0;
    }
    
    .success-message p {
      color: #388e3c;
      margin: 5px 0;
    }
    
    .redirect-message {
      font-size: 14px;
      font-style: italic;
      margin-top: 10px !important;
    }
    
    .error-notification {
      background-color: #ffebee;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      display: flex;
      align-items: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .error-icon {
      background-color: #f44336;
      color: white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      margin-right: 15px;
    }
    
    .error-message {
      color: #c62828;
    }
    
    .validation-error {
      color: #d32f2f;
      font-size: 12px;
      margin-top: 5px;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  styleUrls: ['../auth.component.css']
})
export class RestablecerComponent implements OnInit, OnDestroy {
  restablecerForm: FormGroup;
  error = '';
  success = '';
  token = '';
  countdown = 5;
  private countdownInterval: any;

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
          this.success = 'Tu contraseña ha sido actualizada correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.';
          this.startCountdown();
        },
        error: (err) => {
          this.error = err.message || 'Error al restablecer contraseña. Por favor intenta nuevamente.';
        }
      });
    }
  }

  startCountdown() {
    this.countdown = 5;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.router.navigate(['/auth']);
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
