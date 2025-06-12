import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { 
    path: 'auth', 
    loadChildren: () => import('./auth/auth.routes')
      .then(m => m.authRoutes)
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin-dashboard/admin-dashboard.component')
      .then(m => m.AdminDashboardComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'administrador' }
  },
  {
    path: 'paseador',
    loadComponent: () => import('./components/paseador-dashboard/paseador-dashboard.component')
      .then(m => m.PaseadorDashboardComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'paseador' }
  },
  {
    path: 'mascotas',
    loadComponent: () => import('./components/mascotas/mascotas.component')
      .then(m => m.MascotasComponent),
    canActivate: [AuthGuard],
    data: { role: 'dueño' }
  },
  { 
    path: 'paseos', 
    loadComponent: () => import('./components/paseo-solicitud/paseo-solicitud.component').then(m => m.PaseoSolicitudComponent),
    canActivate: [AuthGuard]
  },
  { 
    path: 'facturas', 
    loadComponent: () => import('./components/facturas/facturas.component').then(m => m.FacturasComponent)
  },
  { 
    path: 'confirmacion', 
    loadComponent: () => import('./components/confirmacion/confirmacion.component').then(m => m.ConfirmacionComponent)
  },
  { 
    path: 'paseos/confirmacion', 
    redirectTo: 'confirmacion', 
    pathMatch: 'full' 
  },
  { 
    path: 'restablecer/:token', 
    loadComponent: () => import('./auth/restablecer/restablecer.component').then(m => m.RestablecerComponent)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./components/unauthorized/unauthorized.component')
      .then(m => m.UnauthorizedComponent)
  },
  {
    path: 'aviso-privacidad',
    loadComponent: () => import('./pages/aviso-privacidad/aviso-privacidad.component')
      .then(m => m.AvisoPrivacidadComponent)
  },
  {
    path: 'terminos-condiciones',
    loadComponent: () => import('./pages/terminos-condiciones/terminos-condiciones.component')
      .then(m => m.TerminosCondicionesComponent)
  }
];
