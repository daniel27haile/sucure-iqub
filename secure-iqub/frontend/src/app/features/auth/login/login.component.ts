import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-page">
      <div class="login-header">
        <mat-icon class="mobile-logo">savings</mat-icon>
        <h2>Welcome back</h2>
        <p>Sign in to your Secure Iqub account</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email address</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          <mat-icon matPrefix>email</mat-icon>
          <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('email')">Enter a valid email</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Password</mat-label>
          <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
          <mat-icon matPrefix>lock</mat-icon>
          <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword">
            <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
        </mat-form-field>

        <div class="forgot-link">
          <a routerLink="/auth/forgot-password">Forgot password?</a>
        </div>

        <button mat-raised-button color="primary" type="submit" class="submit-btn" [disabled]="loading">
          <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
          <span *ngIf="!loading">Sign In</span>
        </button>

        <div class="error-msg" *ngIf="errorMessage">
          <mat-icon>error_outline</mat-icon> {{ errorMessage }}
        </div>

        <div class="demo-creds">
          <p><strong>Demo accounts:</strong></p>
          <code>superadmin&#64;secureiqub.com / SuperAdmin&#64;123</code><br>
          <code>admin&#64;secureiqub.com / Admin&#64;1234</code><br>
          <code>abebe&#64;demo.com / Member&#64;1234</code>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .login-page { }
    .login-header { text-align: center; margin-bottom: 32px; }
    .mobile-logo { font-size: 40px; width: 40px; height: 40px; color: #1565c0; display: none; }
    h2 { font-size: 26px; font-weight: 700; margin: 0 0 8px; color: #1a237e; }
    p { color: #666; margin: 0; }
    .login-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .forgot-link { text-align: right; margin: -8px 0 8px; }
    .forgot-link a { color: #1565c0; font-size: 13px; text-decoration: none; }
    .forgot-link a:hover { text-decoration: underline; }
    .submit-btn { width: 100%; height: 48px; font-size: 15px; margin-top: 8px; }
    .error-msg { display: flex; align-items: center; gap: 8px; color: #c62828; background: #ffebee;
      padding: 10px 14px; border-radius: 6px; font-size: 13px; margin-top: 8px; }
    .demo-creds { margin-top: 24px; padding: 12px; background: #f5f5f5; border-radius: 8px; font-size: 12px; }
    .demo-creds p { margin: 0 0 8px; color: #444; }
    code { color: #1565c0; font-size: 11px; }
    @media (max-width: 768px) { .mobile-logo { display: block; margin: 0 auto 8px; } }
  `],
})
export class LoginComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  showPassword = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private toast: ToastService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';

    this.auth.login(this.form.value).subscribe({
      next: () => {
        this.toast.success('Welcome back!');
        this.router.navigate([this.auth.getDashboardRoute()]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please try again.';
      },
    });
  }
}
