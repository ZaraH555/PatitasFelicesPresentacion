import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <h2>Panel de Administración</h2>
      <nav class="dashboard-nav">
        <button [class.active]="currentTab === 'usuarios'" (click)="switchTab('usuarios')">Usuarios</button>
        <button [class.active]="currentTab === 'paseadores'" (click)="switchTab('paseadores')">Paseadores</button>
        <button [class.active]="currentTab === 'servicios'" (click)="switchTab('servicios')">Servicios</button>
      </nav>

      <div class="content" [ngSwitch]="currentTab">
        <div *ngSwitchCase="'usuarios'">
          <h3>Gestión de Usuarios</h3>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let usuario of usuarios">
                <td>{{usuario.nombre}}</td>
                <td>{{usuario.rol}}</td>
                <td>{{usuario.verificado ? 'Verificado' : 'Pendiente'}}</td>
                <td>
                  <button class="btn-action">Editar</button>
                  <button class="btn-action btn-danger">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
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
    .dashboard-nav {
      margin: 20px 0;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .dashboard-nav button {
      padding: 8px 16px;
      margin-right: 10px;
      border: none;
      background: none;
      cursor: pointer;
    }
    .dashboard-nav button.active {
      border-bottom: 2px solid #2196f3;
      color: #2196f3;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .btn-action {
      padding: 5px 10px;
      margin-right: 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-danger {
      background-color: #ff4444;
      color: white;
    }
  `]
})
export class AdminDashboardComponent {
  currentTab = 'usuarios';
  usuarios = [
    { nombre: 'Juan Pérez', rol: 'dueño', verificado: true },
    { nombre: 'María López', rol: 'paseador', verificado: false }
  ];

  switchTab(tab: string) {
    this.currentTab = tab;
  }
}
