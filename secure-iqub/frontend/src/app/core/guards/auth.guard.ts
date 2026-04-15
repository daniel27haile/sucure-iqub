import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (!this.auth.isAuthenticated) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    const allowedRoles: string[] = route.data['roles'] || [];
    if (allowedRoles.length > 0 && !allowedRoles.includes(this.auth.currentUser!.role)) {
      this.router.navigate([this.auth.getDashboardRoute()]);
      return false;
    }

    return true;
  }
}
