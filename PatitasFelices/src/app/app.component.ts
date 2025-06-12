import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { PaseosService } from './services/paseos.service';
import { Mascota } from './models/mascota';
import { Servicio } from './models/servicio';
import { Paseo } from './models/paseo';
import { Usuario } from './models/usuario.model';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './services/auth.service';

interface CarritoItem {
  servicio: Servicio;
  mascota?: Mascota;
}

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <nav class="sidebar" *ngIf="authService.user$ | async as user">
        <h3>Patitas Felices</h3>
        <div class="user-info">
          <p class="user-name">{{getUserName(user)}}</p>
          <span class="user-role">{{getUserRole(user)}}</span>
        </div>
        <ul class="nav-menu">
          <ng-container [ngSwitch]="getUserRole(user)">
            <!-- Dueño options -->
            <ng-container *ngSwitchCase="'dueño'">
              <li><a routerLink="/mascotas" routerLinkActive="active">Mis Mascotas</a></li>
              <li><a routerLink="/paseos" routerLinkActive="active">Solicitar Paseo</a></li>
            </ng-container>
            
            <!-- Paseador options -->
            <ng-container *ngSwitchCase="'paseador'">
              <li><a routerLink="/paseador" routerLinkActive="active">Mis Paseos</a></li>
            </ng-container>
            
            <!-- Admin options -->
            <ng-container *ngSwitchCase="'administrador'">
              <li><a routerLink="/admin" routerLinkActive="active">Administración</a></li>
            </ng-container>
          </ng-container>

          <!-- Common options -->
          <li><a routerLink="/facturas" routerLinkActive="active">Facturación</a></li>
          <li><a (click)="logout()" class="logout-link">Cerrar Sesión</a></li>
        </ul>
      </nav>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      min-height: 100vh;
    }
    .sidebar {
      width: 250px;
      background: white;
      padding: 20px;
      box-shadow: 2px 0 5px rgba(0,0,0,0.1);
    }
    .main-content {
      flex: 1;
      padding: 20px;
    }
    .nav-menu {
      list-style: none;
      padding: 0;
    }
    .nav-menu li a {
      display: block;
      padding: 12px 16px;
      color: #333;
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .nav-menu li a:hover {
      background: #4CAF50;
      color: white;
    }
    .nav-menu li a.active {
      background: #4CAF50;
      color: white;
    }
    
    .user-info {
      padding: 1rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #eee;
    }
    .user-name {
      margin: 0;
      font-weight: 500;
      color: #333;
    }
    .user-role {
      font-size: 0.875rem;
      color: #666;
    }
    .logout-link {
      color: #dc3545 !important;
      cursor: pointer;
    }
    .logout-link:hover {
      background: #dc3545 !important;
      color: white !important;
    }
  `],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class AppComponent implements OnInit {
  @ViewChild('paseoForm') paseoForm!: NgForm;
  mascotas: Mascota[] = [];
  servicios: Servicio[] = [];
  carrito: CarritoItem[] = [];
  error = '';
  
  mascotaModalVisible = false;
  carritoVisible = false;
  paseoModalVisible = false;
  
  mascotaSeleccionada?: Mascota;
  nuevoPaseo: Partial<Paseo> = {
    fecha_paseo: new Date(),
    hora_inicio: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    estado: 'pendiente',
    servicio_id: undefined,
    mascota_id: undefined
  };
  selectedMascotaId: number | null = null;

  constructor(
    public authService: AuthService,
    private router: Router,
    private paseosService: PaseosService
  ) {
    // Check auth state on init
    this.authService.user$.subscribe(user => {
      if (!user && !this.router.url.includes('/auth')) {
        this.router.navigate(['/auth']);
      }
    });
  }

  ngOnInit() {
    // Only load data if user is authenticated
    this.authService.user$.subscribe(user => {
      if (user) {
        this.loadData();
      }
    });
  }

  loadData() {
    this.paseosService.getMascotas()
      .pipe(
        catchError(error => {
          this.error = 'Error al cargar las mascotas: ' + error.message;
          return of([]);
        })
      )
      .subscribe(mascotas => this.mascotas = mascotas);

    this.paseosService.getServicios()
      .pipe(
        catchError(error => {
          this.error = 'Error al cargar los servicios: ' + error.message;
          return of([]);
        })
      )
      .subscribe(servicios => this.servicios = servicios);
  }

  // Mascota methods
  mostrarModalMascota(mascota?: Mascota) {
    this.mascotaSeleccionada = mascota;
    this.mascotaModalVisible = true;
  }

  editarMascota(mascota: Mascota) {
    this.mostrarModalMascota(mascota);
  }

  guardarMascota(mascota: Mascota) {
    if (mascota.id) {
      this.paseosService.updateMascota(mascota.id, mascota)
        .pipe(
          catchError(error => {
            this.error = 'Error al actualizar la mascota: ' + error.message;
            return of(null);
          })
        )
        .subscribe(() => this.loadData());
    } else {
      this.paseosService.addMascota(mascota)
        .pipe(
          catchError(error => {
            this.error = 'Error al agregar la mascota: ' + error.message;
            return of(null);
          })
        )
        .subscribe(() => this.loadData());
    }
    this.mascotaModalVisible = false;
  }

  eliminarMascota(id?: number) {
    if (!id) return;
    if (confirm('¿Está seguro de eliminar esta mascota?')) {
      this.paseosService.deleteMascota(id).subscribe({
        next: () => this.loadData(),
        error: (error) => this.error = 'Error al eliminar la mascota: ' + error.message
      });
    }
  }

  // Carrito methods
  getMascotaById(id: string): Mascota | undefined {
    if (!id) return undefined;
    return this.mascotas.find(m => m.id === parseInt(id));
  }

  agregarAlCarrito(servicio: Servicio) {
    if (!this.selectedMascotaId) {
      this.error = 'Por favor seleccione una mascota';
      return;
    }

    const mascota = this.getMascotaById(this.selectedMascotaId.toString());
    if (!mascota) {
      this.error = 'Mascota no encontrada';
      return;
    }

    try {
      this.carrito.push({ servicio, mascota });
      this.selectedMascotaId = null; // Reset selection after adding to cart
    } catch (error) {
      this.error = 'Error al agregar al carrito';
      console.error(error);
    }
  }

  eliminarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
  }

  calcularTotal(): number {
    return this.carrito.reduce((total, item) => total + item.servicio.precio, 0);
  }

  mostrarCarrito() {
    this.carritoVisible = true;
  }

  cerrarCarrito() {
    this.carritoVisible = false;
  }

  procesarPago() {
    if (this.carrito.length === 0) {
      this.error = 'El carrito está vacío';
      return;
    }

    const paseos = this.carrito.map(item => ({
      mascota_id: item.mascota?.id,
      servicio_id: item.servicio.id,
      fecha_paseo: typeof this.nuevoPaseo.fecha_paseo === 'string' 
        ? new Date(this.nuevoPaseo.fecha_paseo) 
        : (this.nuevoPaseo.fecha_paseo || new Date()),
      hora_inicio: this.nuevoPaseo.hora_inicio || '12:00',
      estado: 'pendiente' as const
    }));

    this.paseosService.createPaseos(paseos).pipe(
      catchError(error => {
        this.error = 'Error al procesar el pago: ' + error.message;
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          this.carrito = [];
          this.cerrarCarrito();
          alert('Paseos agendados correctamente');
        }
      }
    });
  }

  // Paseo methods
  mostrarModalPaseo(mascota: Mascota) {
    this.mascotaSeleccionada = mascota;
    this.paseoModalVisible = true;
  }

  cerrarModalPaseo() {
    this.paseoModalVisible = false;
    this.mascotaSeleccionada = undefined;
    this.nuevoPaseo = {
      fecha_paseo: new Date(),
      hora_inicio: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      estado: 'pendiente',
      servicio_id: undefined,
      mascota_id: undefined
    };
  }

  guardarPaseo() {
    if (!this.paseoForm.valid || !this.mascotaSeleccionada || !this.nuevoPaseo.servicio_id) {
      this.error = 'Por favor complete todos los campos requeridos';
      return;
    }

    const paseo: Partial<Paseo> = {
      ...this.nuevoPaseo,
      mascota_id: this.mascotaSeleccionada.id,
      estado: 'pendiente'
    };

    this.paseosService.createPaseo(paseo).pipe(
      catchError(error => {
        this.error = 'Error al agendar el paseo: ' + error.message;
        return of(null);
      })
    ).subscribe({
      next: (response) => {
        if (response) {
          this.cerrarModalPaseo();
          this.loadData();
          alert('Paseo agendado correctamente');
        }
      }
    });
  }

  logout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
      // Clear all local data
      this.mascotas = [];
      this.servicios = [];
      this.carrito = [];
      this.error = '';
      
      // Logout and redirect
      this.authService.logout();
    }
  }

  // Add these helper methods
  getUserName(user: any): string {
    const userTyped = user as Usuario;
    return `${userTyped.nombre} ${userTyped.apellido}`;
  }

  getUserRole(user: any): string {
    return (user as Usuario).rol;
  }
}
