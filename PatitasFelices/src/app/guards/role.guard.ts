import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.authService.userValue;
    const requiredRole = route.data['role'];

    if (!user) {
      this.router.navigate(['/auth']);
      return false;
    }

    if (user.rol === requiredRole) {
      return true;
    }

    // Redirect to appropriate dashboard
    switch (user.rol) {
      case 'administrador':
        this.router.navigate(['/admin']);
        break;
      case 'paseador':
        this.router.navigate(['/paseador']);
        break;
      default:
        this.router.navigate(['/mascotas']);
    }
    return false;
  }
}
