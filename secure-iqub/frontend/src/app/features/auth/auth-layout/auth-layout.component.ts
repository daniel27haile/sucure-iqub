import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  template: `
    <div class="auth-layout">

      <!-- Left brand panel -->
      <div class="auth-layout__brand">
        <!-- Decorative blobs -->
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>

        <div class="brand-content">
          <div class="brand-logo">
            <app-si-logo size="xl" [showText]="false"></app-si-logo>
          </div>
          <h1>Secure Iqub</h1>
          <p>Save together, win together —<br>community-powered and built on trust.</p>

          <div class="feature-list">
            <div class="feature-item">
              <div class="feature-icon"><mat-icon>lock</mat-icon></div>
              <div>
                <div class="feature-title">Secure &amp; Transparent</div>
                <div class="feature-desc">Every contribution tracked end-to-end</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><mat-icon>casino</mat-icon></div>
              <div>
                <div class="feature-title">Fair Lucky Spin</div>
                <div class="feature-desc">Unbiased slot selection each month</div>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon"><mat-icon>group</mat-icon></div>
              <div>
                <div class="feature-title">Shared Slots</div>
                <div class="feature-desc">Contribute together, win together</div>
              </div>
            </div>
          </div>

          <div class="brand-stats">
            <div class="brand-stat">
              <span class="stat-val">12</span>
              <span class="stat-lbl">Slots / Cycle</span>
            </div>
            <div class="stat-divider"></div>
            <div class="brand-stat">
              <span class="stat-val">$24K</span>
              <span class="stat-lbl">Monthly Pool</span>
            </div>
            <div class="stat-divider"></div>
            <div class="brand-stat">
              <span class="stat-val">100%</span>
              <span class="stat-lbl">Community</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right form panel -->
      <div class="auth-layout__form">
        <div class="form-container">
          <router-outlet></router-outlet>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .auth-layout { display: flex; min-height: 100vh; }

    /* ── Brand panel ── */
    .auth-layout__brand {
      flex: 1; position: relative; overflow: hidden;
      background: linear-gradient(145deg, #0d1b6e 0%, #1a237e 35%, #1565c0 70%, #0288d1 100%);
      display: flex; align-items: center; justify-content: center; padding: 48px 40px;
      color: white;
    }

    /* Decorative blobs */
    .blob { position: absolute; border-radius: 50%; opacity: .15; }
    .blob-1 { width: 420px; height: 420px; background: #42a5f5; top: -100px; right: -120px; }
    .blob-2 { width: 280px; height: 280px; background: #e3f2fd; bottom: -80px; left: -80px; }
    .blob-3 { width: 160px; height: 160px; background: #fff; top: 55%; left: 60%; }

    .brand-content { position: relative; z-index: 1; max-width: 380px; text-align: center; }

    .brand-logo {
      display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;
    }

    h1 { font-size: 38px; font-weight: 800; margin: 0 0 12px; letter-spacing: -.5px; }
    p { opacity: .82; font-size: 15px; line-height: 1.7; margin-bottom: 36px; }

    /* Feature list */
    .feature-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; text-align: left; }
    .feature-item { display: flex; align-items: center; gap: 16px;
      background: rgba(255,255,255,.1); backdrop-filter: blur(6px);
      border: 1px solid rgba(255,255,255,.2); border-radius: 12px; padding: 14px 16px; }
    .feature-icon { background: rgba(255,255,255,.2); border-radius: 10px;
      width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .feature-icon mat-icon { font-size: 20px; width: 20px; height: 20px; color: #fff; }
    .feature-title { font-weight: 700; font-size: 14px; }
    .feature-desc { font-size: 12px; opacity: .7; margin-top: 2px; }

    /* Stats row */
    .brand-stats { display: flex; align-items: center; justify-content: center; gap: 20px; }
    .brand-stat { text-align: center; }
    .stat-val { display: block; font-size: 26px; font-weight: 800; line-height: 1; }
    .stat-lbl { font-size: 11px; opacity: .65; text-transform: uppercase; letter-spacing: .5px; margin-top: 4px; display: block; }
    .stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,.3); }

    /* ── Form panel ── */
    .auth-layout__form {
      flex: 0 0 500px; display: flex; align-items: center; justify-content: center;
      padding: 40px; background: #f4f6fb;
    }
    .form-container { width: 100%; max-width: 420px; }

    /* ── Tablet: reduce brand panel a little ── */
    @media (max-width: 1100px) {
      .auth-layout__form { flex: 0 0 440px; }
      h1 { font-size: 32px; }
    }

    /* ── Mobile: hide brand, full-width form ── */
    @media (max-width: 900px) {
      .auth-layout { flex-direction: column; }
      .auth-layout__brand { display: none; }
      .auth-layout__form { flex: 1; padding: 24px 20px; background: #f4f6fb; }
      .form-container { max-width: 100%; }
    }

    @media (max-width: 480px) {
      .auth-layout__form { padding: 16px 12px; }
    }
  `],
})
export class AuthLayoutComponent {}
