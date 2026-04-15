import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  template: `
    <div class="rp-page">
      <div class="rp-header">
        <h2>Set New Password</h2>
        <p>Choose a strong password for your account</p>
      </div>
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="rp-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New password</mat-label>
          <input matInput [type]="showPwd ? 'text' : 'password'" formControlName="password" />
          <button mat-icon-button matSuffix type="button" (click)="showPwd = !showPwd">
            <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-hint>Min 8 chars, uppercase, lowercase, number</mat-hint>
          <mat-error>Password does not meet requirements</mat-error>
        </mat-form-field>
        <button mat-raised-button color="primary" type="submit" class="submit-btn" [disabled]="loading">
          Reset Password
        </button>
      </form>
      <div class="back-link"><a routerLink="/auth/login">← Back to Sign In</a></div>
    </div>
  `,
  styles: [`
    .rp-page { }
    .rp-header { text-align: center; margin-bottom: 28px; }
    h2 { font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #1a237e; }
    p { color: #666; margin: 0; }
    .rp-form { display: flex; flex-direction: column; gap: 12px; }
    .full-width { width: 100%; }
    .submit-btn { width: 100%; height: 48px; font-size: 15px; }
    .back-link { text-align: center; margin-top: 20px; }
    .back-link a { color: #1565c0; font-size: 13px; text-decoration: none; }
  `],
})
export class ResetPasswordComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  showPwd = false;
  token = '';

  constructor(
    private fb: FormBuilder, private auth: AuthService,
    private route: ActivatedRoute, private router: Router, private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) return;
    this.loading = true;
    this.auth.resetPassword(this.token, this.form.value.password).subscribe({
      next: () => { this.toast.success('Password reset! Please sign in.'); this.router.navigate(['/auth/login']); },
      error: (err) => { this.loading = false; this.toast.error(err.error?.message || 'Reset failed'); },
    });
  }
}
