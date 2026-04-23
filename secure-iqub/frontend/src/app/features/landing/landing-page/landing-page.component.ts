import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * Public landing page for Secure-Iqub.
 * Features:
 *  - Hero section with platform overview
 *  - How it works section
 *  - CTA: "Become an Iqub Leader" → opens application modal
 *  - Login link for existing users
 */
@Component({
  selector: 'app-landing-page',
  template: `
    <!-- ── Top nav ──────────────────────────────────────────────────────── -->
    <header class="nav">
      <div class="nav__brand">
        <app-si-logo label="Secure Iqub" sub="እቁብ" size="md"></app-si-logo>
      </div>
      <div class="nav__actions">
        <app-live-clock [compact]="true" class="nav-clock"></app-live-clock>
        <a routerLink="/auth/login" mat-stroked-button color="primary" class="login-btn">Log In</a>
      </div>
    </header>

    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="hero">
      <div class="hero__content">
        <div class="hero__badge">Community-Powered · Transparent · Secure</div>
        <h1 class="hero__title">
          Your Community Savings,<br>
          <span class="hero__accent">Digitized.</span>
        </h1>
        <p class="hero__subtitle">
          Secure-Iqub modernizes the traditional Ethiopian rotating savings system (እቁብ)
          with full transparency, monthly spin fairness, and easy payout tracking.
        </p>
        <div class="hero__cta">
          <button mat-raised-button class="cta-primary" (click)="openApplicationModal()">
            <mat-icon>star</mat-icon>
            Become an Iqub Leader
          </button>
          <a routerLink="/auth/login" mat-stroked-button class="cta-secondary">
            Member Login
          </a>
        </div>
      </div>
      <div class="hero__visual">
        <div class="hero__stats-card">
          <div class="stat-row"><mat-icon>group</mat-icon><div><div class="stat-num">12</div><div class="stat-lbl">Slots per Cycle</div></div></div>
          <div class="stat-row"><mat-icon>payments</mat-icon><div><div class="stat-num">$24,000</div><div class="stat-lbl">Monthly Payout</div></div></div>
          <div class="stat-row"><mat-icon>casino</mat-icon><div><div class="stat-num">$288,000</div><div class="stat-lbl">Total per Cycle</div></div></div>
          <div class="stat-row green"><mat-icon>verified</mat-icon><div><div class="stat-num">100%</div><div class="stat-lbl">Community Owned</div></div></div>
        </div>
      </div>
    </section>

    <!-- ── How it works ──────────────────────────────────────────────────── -->
    <section class="how-it-works">
      <h2>How Secure Iqub Works</h2>
      <div class="steps-grid">
        <div class="step-card" *ngFor="let step of steps; let i = index">
          <div class="step-number">{{ i + 1 }}</div>
          <mat-icon class="step-icon">{{ step.icon }}</mat-icon>
          <h3>{{ step.title }}</h3>
          <p>{{ step.desc }}</p>
        </div>
      </div>
    </section>

    <!-- ── Leader CTA section ─────────────────────────────────────────────── -->
    <section class="leader-cta">
      <div class="leader-cta__content">
        <div class="leader-cta__icon">
          <mat-icon>emoji_events</mat-icon>
        </div>
        <div>
          <h2>Want to Lead Your Own Iqub Group?</h2>
          <p>
            If you already manage a savings group in your community, apply to become
            a Secure-Iqub leader. We'll set up your admin access and you can start
            registering members digitally within days.
          </p>
          <ul class="leader-benefits">
            <li><mat-icon>check_circle</mat-icon> Manage up to 12 contribution slots per cycle</li>
            <li><mat-icon>check_circle</mat-icon> Track monthly payments & late penalties</li>
            <li><mat-icon>check_circle</mat-icon> Run the monthly Lucky Spin transparently</li>
            <li><mat-icon>check_circle</mat-icon> Automatic payout breakdown for shared slots</li>
          </ul>
          <button mat-raised-button class="cta-leader-btn" (click)="openApplicationModal()">
            <mat-icon>how_to_reg</mat-icon>
            Apply to Manage Your Group
          </button>
        </div>
      </div>
    </section>

    <!-- ── Footer ────────────────────────────────────────────────────────── -->
    <footer class="footer">
      <p>© 2025 Secure-Iqub · Community-Powered Rotating Savings Platform</p>
      <a routerLink="/auth/login">Admin Login</a>
    </footer>

    <!-- ── Application modal overlay ─────────────────────────────────────── -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal($event)">
      <div class="modal" (click)="$event.stopPropagation()">
        <button class="modal__close" mat-icon-button (click)="closeApplicationModal()">
          <mat-icon>close</mat-icon>
        </button>

        <!-- Success state -->
        <div class="modal__success" *ngIf="submitted">
          <mat-icon class="success-icon">check_circle</mat-icon>
          <h2>Application Submitted!</h2>
          <p>
            Thank you, <strong>{{ form.value.fullName }}</strong>!<br>
            We have received your application and will review it shortly.
            You will hear from us via <strong>{{ form.value.preferredContactMethod || 'email' }}</strong>.
          </p>
          <button mat-raised-button color="primary" (click)="closeApplicationModal()">Close</button>
        </div>

        <!-- Form state -->
        <ng-container *ngIf="!submitted">
          <div class="modal__header">
            <mat-icon>how_to_reg</mat-icon>
            <h2>Apply to Become an Iqub Leader</h2>
            <p>Fill in the form below and our team will review your application.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="application-form">
            <!-- Full Name -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name *</mat-label>
              <input matInput formControlName="fullName" placeholder="e.g. Abebe Girma">
              <mat-error *ngIf="form.get('fullName')?.invalid">Full name is required</mat-error>
            </mat-form-field>

            <!-- Email -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email Address *</mat-label>
              <input matInput formControlName="email" type="email" placeholder="you@example.com">
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Enter a valid email address</mat-error>
            </mat-form-field>

            <!-- Phone + Location in a row -->
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phone" placeholder="+251-9xx-xxxxxx">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>City / Location</mat-label>
                <input matInput formControlName="location" placeholder="e.g. Addis Ababa">
              </mat-form-field>
            </div>

            <!-- Preferred contact method -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Preferred Contact Method</mat-label>
              <mat-select formControlName="preferredContactMethod">
                <mat-option value="email">Email</mat-option>
                <mat-option value="phone">Phone Call</mat-option>
                <mat-option value="text">Text / SMS</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Message -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tell us about your group (optional)</mat-label>
              <textarea matInput formControlName="message" rows="3"
                placeholder="How many members do you have? What is your current savings cycle?"></textarea>
              <mat-hint align="end">{{ form.value.message?.length || 0 }} / 1000</mat-hint>
            </mat-form-field>

            <!-- Error message -->
            <div class="form-error" *ngIf="errorMessage">
              <mat-icon>error_outline</mat-icon>
              {{ errorMessage }}
            </div>

            <div class="form-actions">
              <button mat-stroked-button type="button" (click)="closeApplicationModal()">Cancel</button>
              <button mat-raised-button color="primary" type="submit"
                [disabled]="form.invalid || submitting">
                {{ submitting ? 'Submitting...' : 'Submit Application' }}
              </button>
            </div>
          </form>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; font-family: 'Roboto', sans-serif; }

    /* Nav */
    .nav { display: flex; align-items: center; justify-content: space-between; padding: 16px 48px;
           background: white; border-bottom: 1px solid #e0e0e0; position: sticky; top: 0; z-index: 100; }
    .nav__brand { display: flex; align-items: center; gap: 8px; font-size: 20px; font-weight: 700; color: #1a237e; }
    .nav__brand mat-icon { color: #1565c0; }
    .nav__subtitle { font-size: 14px; color: #888; font-weight: 400; }
    .nav__actions { display: flex; align-items: center; gap: 16px; }
    .nav-clock { text-align: right; }
    .login-btn { border-color: #1a237e !important; color: #1a237e !important; }

    /* Hero */
    .hero { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
            padding: 80px 48px; background: linear-gradient(135deg, #f8f9ff 0%, #e8eeff 100%); min-height: 560px; }
    .hero__badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 6px 16px;
                   border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 20px; text-transform: uppercase; letter-spacing: .5px; }
    .hero__title { font-size: 52px; font-weight: 800; line-height: 1.1; margin: 0 0 20px; color: #0d0d0d; }
    .hero__accent { color: #1565c0; }
    .hero__subtitle { font-size: 17px; color: #555; line-height: 1.6; margin: 0 0 32px; max-width: 480px; }
    .hero__cta { display: flex; gap: 16px; flex-wrap: wrap; }
    .cta-primary { background: linear-gradient(135deg, #1a237e, #1565c0) !important; color: white !important;
                   height: 52px; font-size: 15px !important; font-weight: 700 !important; padding: 0 28px !important;
                   border-radius: 8px !important; box-shadow: 0 4px 16px rgba(21,101,192,.3) !important; }
    .cta-secondary { border-color: #1a237e !important; color: #1a237e !important; height: 52px; font-size: 15px !important; padding: 0 28px !important; }
    .hero__visual { display: flex; justify-content: center; }
    .hero__stats-card { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 8px 32px rgba(0,0,0,.1);
                         display: flex; flex-direction: column; gap: 16px; min-width: 280px; }
    .stat-row { display: flex; align-items: center; gap: 14px; }
    .stat-row mat-icon { background: #e8eaf6; color: #1a237e; border-radius: 8px; padding: 8px; width: 40px; height: 40px; font-size: 24px; }
    .stat-row.green mat-icon { background: #e8f5e9; color: #2e7d32; }
    .stat-num { font-size: 22px; font-weight: 800; color: #1a237e; }
    .stat-lbl { font-size: 12px; color: #888; }

    /* How it works */
    .how-it-works { padding: 80px 48px; background: white; text-align: center; }
    .how-it-works h2 { font-size: 36px; font-weight: 800; color: #0d0d0d; margin: 0 0 48px; }
    .steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 28px; max-width: 1000px; margin: 0 auto; }
    .step-card { background: #f8f9ff; border-radius: 12px; padding: 28px 20px; text-align: center; }
    .step-number { width: 36px; height: 36px; background: #1565c0; color: white; border-radius: 50%;
                   display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; margin: 0 auto 12px; }
    .step-icon { font-size: 36px; width: 36px; height: 36px; color: #1a237e; margin-bottom: 12px; }
    .step-card h3 { font-size: 15px; font-weight: 700; color: #1a237e; margin: 0 0 8px; }
    .step-card p { font-size: 13px; color: #666; line-height: 1.5; margin: 0; }

    /* Leader CTA */
    .leader-cta { background: linear-gradient(135deg, #1a237e 0%, #283593 60%, #1565c0 100%); padding: 80px 48px; }
    .leader-cta__content { display: flex; align-items: flex-start; gap: 40px; max-width: 900px; margin: 0 auto; }
    .leader-cta__icon { flex-shrink: 0; }
    .leader-cta__icon mat-icon { font-size: 80px; width: 80px; height: 80px; color: #ffd700; }
    .leader-cta h2 { font-size: 32px; font-weight: 800; color: white; margin: 0 0 16px; }
    .leader-cta p { color: rgba(255,255,255,.8); font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
    .leader-benefits { list-style: none; padding: 0; margin: 0 0 28px; display: flex; flex-direction: column; gap: 8px; }
    .leader-benefits li { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,.85); font-size: 14px; }
    .leader-benefits mat-icon { color: #69f0ae; font-size: 20px; width: 20px; height: 20px; }
    .cta-leader-btn { background: #ffd700 !important; color: #1a237e !important; height: 52px; font-size: 15px !important;
                       font-weight: 700 !important; padding: 0 28px !important; border-radius: 8px !important; }

    /* Footer */
    .footer { background: #0d0d0d; color: rgba(255,255,255,.5); padding: 24px 48px;
              display: flex; align-items: center; justify-content: space-between; }
    .footer a { color: rgba(255,255,255,.5); text-decoration: none; }
    .footer a:hover { color: white; }

    /* Modal overlay */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 1000;
                      display: flex; align-items: center; justify-content: center; padding: 16px; }
    .modal { background: white; border-radius: 16px; padding: 36px; width: 100%; max-width: 520px;
             position: relative; max-height: 90vh; overflow-y: auto; }
    .modal__close { position: absolute; top: 12px; right: 12px; }
    .modal__header { text-align: center; margin-bottom: 24px; }
    .modal__header mat-icon { font-size: 48px; width: 48px; height: 48px; color: #1565c0; }
    .modal__header h2 { font-size: 22px; font-weight: 700; color: #1a237e; margin: 12px 0 8px; }
    .modal__header p { color: #666; font-size: 14px; margin: 0; }
    .application-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-row mat-form-field { width: 100%; }
    .form-error { display: flex; align-items: center; gap: 8px; background: #fff3e0; color: #e65100;
                  padding: 10px 14px; border-radius: 6px; font-size: 13px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
    .modal__success { text-align: center; padding: 20px 0; }
    .success-icon { font-size: 64px; width: 64px; height: 64px; color: #2e7d32; }
    .modal__success h2 { font-size: 24px; font-weight: 700; color: #1a237e; margin: 16px 0 12px; }
    .modal__success p { color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }

    /* ── Tablet (≤ 1024px) ── */
    @media (max-width: 1024px) {
      .hero { gap: 40px; padding: 60px 32px; }
      .hero__title { font-size: 42px; }
      .leader-cta { padding: 60px 32px; }
      .how-it-works { padding: 60px 32px; }
      .nav { padding: 14px 32px; }
      .footer { padding: 20px 32px; }
    }

    /* ── Mobile (≤ 768px) ── */
    @media (max-width: 768px) {
      .nav { padding: 12px 16px; }
      .nav__subtitle { display: none; }
      .hero { grid-template-columns: 1fr; padding: 40px 20px; gap: 32px; min-height: auto; }
      .hero__title { font-size: 32px; }
      .hero__subtitle { font-size: 15px; }
      .hero__visual { display: none; }
      .hero__cta { flex-direction: column; gap: 10px; }
      .cta-primary, .cta-secondary { width: 100%; justify-content: center; }
      .leader-cta { padding: 48px 20px; }
      .leader-cta__content { flex-direction: column; gap: 24px; }
      .leader-cta__icon mat-icon { font-size: 56px; width: 56px; height: 56px; }
      .leader-cta h2 { font-size: 26px; }
      .how-it-works { padding: 40px 20px; }
      .how-it-works h2 { font-size: 28px; margin-bottom: 32px; }
      .footer { flex-direction: column; gap: 8px; text-align: center; padding: 20px 16px; }
      .form-row { grid-template-columns: 1fr; }
      .form-actions { flex-direction: column-reverse; }
      .form-actions button { width: 100%; }
    }

    /* ── Small phones (≤ 480px) ── */
    @media (max-width: 480px) {
      .hero__title { font-size: 26px; }
      .hero__badge { font-size: 11px; padding: 5px 12px; }
      .modal { padding: 24px 16px; border-radius: 12px; }
      .step-card { padding: 20px 14px; }
    }
  `],
})
export class LandingPageComponent {
  showModal = false;
  submitted = false;
  submitting = false;
  errorMessage = '';

  form: FormGroup;

  steps = [
    { icon: 'group_add', title: 'Register Members', desc: 'Admin invites members and assigns each to a contribution slot.' },
    { icon: 'account_balance_wallet', title: 'Collect Monthly', desc: 'Each member pays $2,000/month (or proportional share for shared slots).' },
    { icon: 'casino', title: 'Run the Spin', desc: 'Admin runs the monthly Lucky Spin — one eligible slot wins the full $24,000 pool.' },
    { icon: 'payments', title: 'Receive Payout', desc: 'The winner receives $24,000. Shared slots split the payout by contribution share.' },
    { icon: 'repeat', title: 'Repeat 12 Times', desc: 'One unique slot wins each month. After 12 months, every slot has won exactly once.' },
  ];

  constructor(private fb: FormBuilder, private api: ApiService, private toast: ToastService) {
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      location: [''],
      preferredContactMethod: ['email'],
      message: ['', Validators.maxLength(1000)],
    });
  }

  openApplicationModal(): void {
    this.showModal = true;
    this.submitted = false;
    this.errorMessage = '';
    this.form.reset({ preferredContactMethod: 'email' });
  }

  closeApplicationModal(): void {
    this.showModal = false;
    this.submitted = false;
  }

  closeModal(event: MouseEvent): void {
    this.closeApplicationModal();
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitting = true;
    this.errorMessage = '';

    this.api.submitLeaderApplication(this.form.value).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
      },
      error: (err) => {
        this.submitting = false;
        this.errorMessage = err.error?.message || 'Something went wrong. Please try again.';
      },
    });
  }
}
