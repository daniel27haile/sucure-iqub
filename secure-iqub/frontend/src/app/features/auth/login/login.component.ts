import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-page">

      <!-- Back to Home -->
      <a routerLink="/landing" class="back-home">
        <mat-icon>arrow_back</mat-icon>
        Back to Home
      </a>

      <!-- Card -->
      <div class="login-card">

        <!-- Mobile logo (hidden on desktop) -->
        <div class="mobile-brand">
          <app-si-logo size="sm"></app-si-logo>
        </div>

        <div class="login-header">
          <h2>Welcome back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email address</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            <mat-icon matPrefix class="field-icon">email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">Enter a valid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
            <mat-icon matPrefix class="field-icon">lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showPassword = !showPassword" tabindex="-1">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
          </mat-form-field>

          <div class="forgot-link">
            <a routerLink="/auth/forgot-password">Forgot password?</a>
          </div>

          <!-- Error banner -->
          <div class="error-banner" *ngIf="errorMessage">
            <mat-icon>error_outline</mat-icon>
            <span>{{ errorMessage }}</span>
          </div>

          <button mat-raised-button class="submit-btn" type="submit" [disabled]="loading">
            <mat-spinner *ngIf="loading" diameter="20" class="btn-spinner"></mat-spinner>
            <span *ngIf="!loading">Sign In</span>
          </button>

        </form>

        <!-- Demo credentials -->
        <div class="demo-creds">
          <div class="demo-title">
            <mat-icon>info</mat-icon> Demo accounts
          </div>
          <div class="demo-row" (click)="fillDemo('superadmin@secureiqub.com','SuperAdmin@123')">
            <span class="demo-badge super">Super Admin</span>
            <code>superadmin&#64;secureiqub.com</code>
          </div>
          <div class="demo-row" (click)="fillDemo('admin@secureiqub.com','Admin@1234')">
            <span class="demo-badge admin">Admin</span>
            <code>admin&#64;secureiqub.com</code>
          </div>
          <div class="demo-row" (click)="fillDemo('abebe@demo.com','Member@1234')">
            <span class="demo-badge member">Member</span>
            <code>abebe&#64;demo.com</code>
          </div>
          <p class="demo-hint">Click a row to auto-fill credentials</p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── Page wrapper ── */
    .login-page { display: flex; flex-direction: column; align-items: stretch; gap: 16px; }

    /* ── Back to home link ── */
    .back-home {
      display: inline-flex; align-items: center; gap: 6px;
      color: #1565c0; font-size: 13px; font-weight: 600; text-decoration: none;
      padding: 6px 12px 6px 8px; border-radius: 20px;
      background: #e3f2fd; border: 1px solid #bbdefb;
      transition: background .2s, transform .15s;
      align-self: flex-start;
    }
    .back-home:hover { background: #bbdefb; transform: translateX(-2px); }
    .back-home mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* ── Card ── */
    .login-card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 4px 40px rgba(26,35,126,.10), 0 1px 6px rgba(0,0,0,.06);
      padding: 36px 36px 28px;
    }

    /* Mobile brand (shown on small screens only) */
    .mobile-brand {
      display: none; align-items: center; margin-bottom: 20px; color: #1a237e;
    }

    /* Header */
    .login-header { text-align: center; margin-bottom: 28px; }
    h2 { font-size: 28px; font-weight: 800; margin: 0 0 6px; color: #1a237e; letter-spacing: -.4px; }
    .login-header p { color: #888; margin: 0; font-size: 14px; }

    /* Form */
    .login-form { display: flex; flex-direction: column; gap: 2px; }
    .full-width { width: 100%; }
    .field-icon { color: #9e9e9e; font-size: 18px; }

    .forgot-link { text-align: right; margin: -6px 0 10px; }
    .forgot-link a { color: #1565c0; font-size: 13px; font-weight: 500; text-decoration: none; }
    .forgot-link a:hover { text-decoration: underline; }

    /* Error banner */
    .error-banner {
      display: flex; align-items: center; gap: 8px;
      background: #ffebee; color: #c62828; border: 1px solid #ffcdd2;
      border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 6px;
    }
    .error-banner mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }

    /* Submit button */
    .submit-btn {
      width: 100%; height: 50px; font-size: 15px; font-weight: 700;
      border-radius: 12px !important; margin-top: 4px;
      background: linear-gradient(135deg, #1a237e, #1565c0) !important;
      color: #fff !important;
      box-shadow: 0 4px 16px rgba(21,101,192,.35) !important;
      transition: box-shadow .2s, transform .15s !important;
    }
    .submit-btn:hover:not([disabled]) { box-shadow: 0 6px 24px rgba(21,101,192,.45) !important; transform: translateY(-1px); }
    .submit-btn[disabled] { opacity: .65; }
    .btn-spinner { display: inline-block; }

    /* Demo creds */
    .demo-creds {
      margin-top: 24px; padding: 16px;
      background: #f8f9ff; border: 1px solid #e8eaf6;
      border-radius: 14px; font-size: 12px;
    }
    .demo-title {
      display: flex; align-items: center; gap: 6px;
      font-weight: 700; color: #3949ab; font-size: 12px; margin-bottom: 12px;
    }
    .demo-title mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .demo-row {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 8px; cursor: pointer;
      transition: background .15s; margin-bottom: 4px;
    }
    .demo-row:hover { background: #e8eaf6; }
    .demo-badge {
      font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px;
      text-transform: uppercase; letter-spacing: .3px; white-space: nowrap;
    }
    .demo-badge.super { background: #ede7f6; color: #6a1b9a; }
    .demo-badge.admin { background: #e3f2fd; color: #1565c0; }
    .demo-badge.member { background: #e8f5e9; color: #2e7d32; }
    code { color: #37474f; font-size: 11px; }
    .demo-hint { margin: 8px 0 0; color: #aaa; font-size: 11px; text-align: center; }

    /* ── Tablet / small desktop ── */
    @media (max-width: 900px) {
      .mobile-brand { display: inline-flex; }
      .login-card { padding: 28px 20px 24px; border-radius: 16px; }
    }

    /* ── Mobile ── */
    @media (max-width: 600px) {
      .login-card { padding: 24px 16px 20px; border-radius: 14px; }
      h2 { font-size: 24px; }
      .submit-btn { height: 48px; font-size: 14px; }
      .demo-row { padding: 10px 8px; }
    }

    /* ── Small phones ── */
    @media (max-width: 400px) {
      .login-page { gap: 12px; }
      .login-card { padding: 20px 12px 16px; }
      h2 { font-size: 21px; }
      code { font-size: 10px; word-break: break-all; }
    }
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

  fillDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
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
        if (err.status === 403) {
          this.errorMessage = 'Your account has been suspended. Please contact Super Admin.';
        } else {
          this.errorMessage = err.error?.message || 'Login failed. Please try again.';
        }
      },
    });
  }
}
