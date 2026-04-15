import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'si_token';
  private readonly USER_KEY = 'si_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin' || this.isSuperAdmin;
  }

  get isSuperAdmin(): boolean {
    return this.currentUser?.role === 'super_admin';
  }

  get isMember(): boolean {
    return this.currentUser?.role === 'member';
  }

  login(credentials: LoginRequest): Observable<{ data: AuthResponse }> {
    return this.http.post<{ data: AuthResponse }>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => this.storeSession(response.data))
    );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/register`, data);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, password });
  }

  getProfile(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/auth/profile`).pipe(
      tap((res: any) => {
        this.currentUserSubject.next(res.data);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.data));
      })
    );
  }

  getDashboardRoute(): string {
    switch (this.currentUser?.role) {
      case 'super_admin': return '/super-admin/dashboard';
      case 'admin': return '/admin/dashboard';
      case 'member': return '/member/dashboard';
      default: return '/auth/login';
    }
  }

  private storeSession(data: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, data.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    this.currentUserSubject.next(data.user);
  }

  private getStoredUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    try { return stored ? JSON.parse(stored) : null; } catch { return null; }
  }
}
