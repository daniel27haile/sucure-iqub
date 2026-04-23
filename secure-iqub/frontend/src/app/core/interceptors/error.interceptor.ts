import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private toast: ToastService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.auth.logout();
          this.toast.error('Session expired. Please log in again.');
        } else if (error.status === 403) {
          // Skip toast on the login endpoint — the login component shows the inline error itself
          if (!req.url.includes('/auth/login')) {
            const msg = error.error?.message || '';
            this.toast.error(msg.toLowerCase().includes('suspended') || msg.toLowerCase().includes('deactivated')
              ? 'Your account has been suspended. Please contact Super Admin.'
              : 'Access denied.');
          }
        } else if (error.status === 0) {
          this.toast.error('Cannot reach server. Check your connection.');
        }
        // Let components handle their own specific errors
        return throwError(() => error);
      })
    );
  }
}
