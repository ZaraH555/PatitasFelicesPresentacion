import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paseador-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h2>Panel de Paseador</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Paseos Pendientes</h3>
          <p class="stat-value">{{paseosPendientes}}</p>
        </div>
        <div class="stat-card">
          <h3>Paseos Completados</h3>
          <p class="stat-value">{{paseosCompletados}}</p>
        </div>
        <div class="stat-card">
          <h3>Calificación</h3>
          <p class="stat-value">{{calificacion}}/5</p>
        </div>
      </div>

      <div class="paseos-section">
        <h3>Próximos Paseos</h3>
        <div class="paseos-list">
          <div *ngFor="let paseo of proximosPaseos" class="paseo-card">
            <h4>{{paseo.mascota}}</h4>
            <p>Fecha: {{paseo.fecha | date}}</p>
            <p>Duración: {{paseo.duracion}} min</p>
            <button class="btn-primary">Ver Detalles</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2196f3;
    }
    .paseos-section {
      margin-top: 30px;
    }
    .paseos-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .paseo-card {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .btn-primary {
      background: #2196f3;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class PaseadorDashboardComponent implements OnInit {
  paseosPendientes = 3;
  paseosCompletados = 15;
  calificacion = 4.5;
  proximosPaseos = [
    { mascota: 'Luna', fecha: new Date(), duracion: 30 },
    { mascota: 'Rocky', fecha: new Date(Date.now() + 86400000), duracion: 60 }
  ];

  ngOnInit() {
    // Aquí cargarías los datos reales del paseador
  }
}
