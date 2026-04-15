import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  template: `
    <div class="fp-page">
      <div class="fp-header">
        <h2>Reset Password</h2>
        <p>Enter your email and we'll send a reset link</p>
      </div>

      <div *ngIf="!sent">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="fp-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email address</mat-label>
            <input matInput type="email" formControlName="email" />
            <mat-icon matPrefix>email</mat-icon>
            <mat-error>Enter a valid email</mat-error>
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" class="submit-btn" [disabled]="loading">
            <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            <span *ngIf="!loading">Send Reset Link</span>
          </button>
        </form>
      </div>

      <div *ngIf="sent" class="success-msg">
        <mat-icon>check_circle</mat-icon>
        <p>If that email is registered, a reset link has been sent. Check your inbox.</p>
      </div>

      <div class="back-link">
        <a routerLink="/auth/login">← Back to Sign In</a>
      </div>
    </div>
  `,
  styles: [`
    .fp-page { }
    .fp-header { text-align: center; margin-bottom: 28px; }
    h2 { font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #1a237e; }
    p { color: #666; margin: 0; }
    .fp-form { display: flex; flex-direction: column; gap: 8px; }
    .full-width { width: 100%; }
    .submit-btn { width: 100%; height: 48px; font-size: 15px; }
    .success-msg { display: flex; align-items: center; gap: 12px; color: #2e7d32; background: #e8f5e9;
      padding: 16px; border-radius: 8px; }
    .success-msg mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .back-link { text-align: center; margin-top: 20px; }
    .back-link a { color: #1565c0; font-size: 13px; text-decoration: none; }
  `],
})
export class ForgotPasswordComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  sent = false;

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  ngOnInit(): void {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.auth.forgotPassword(this.form.value.email).subscribe({
      next: () => { this.loading = false; this.sent = true; },
      error: () => { this.loading = false; this.sent = true; }, // always show success
    });
  }
}
