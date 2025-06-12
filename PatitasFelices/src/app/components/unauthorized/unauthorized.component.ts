import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="unauthorized-container">
      <h2>Acceso Denegado</h2>
      <p>No tienes permiso para acceder a esta página.</p>
      <button (click)="goBack()" class="btn btn-primary">Volver</button>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      text-align: center;
      padding: 2rem;
      max-width: 600px;
      margin: 2rem auto;
    }
    .btn { margin-top: 1rem; }
  `]
})
export class UnauthorizedComponent {
  goBack() {
    window.history.back();
  }
}
