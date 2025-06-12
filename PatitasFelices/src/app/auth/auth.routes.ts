import { Routes } from '@angular/router';
import { AuthComponent } from './auth.component';
import { AvisoPrivacidadComponent } from '../pages/aviso-privacidad/aviso-privacidad.component';
import { TerminosCondicionesComponent } from '../pages/terminos-condiciones/terminos-condiciones.component';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthComponent
    
  },
  {
    path: 'restablecer/:token',
    loadComponent: () => import('./restablecer/restablecer.component')
      .then(m => m.RestablecerComponent)
  },
    { path: 'aviso-privacidad', 
      component: AvisoPrivacidadComponent
    },
    { path: 'terminos-condiciones',
      component: TerminosCondicionesComponent
    }
];
