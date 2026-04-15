import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  template: `
    <div class="auth-layout">
      <div class="auth-layout__brand">
        <div class="brand-content">
          <div class="brand-logo">
            <mat-icon>savings</mat-icon>
          </div>
          <h1>Secure Iqub</h1>
          <p>Interest-free rotating savings — trusted, transparent, and fair.</p>
          <div class="brand-stats">
            <div class="brand-stat"><span>12</span>Slots per Cycle</div>
            <div class="brand-stat"><span>$24K</span>Monthly Pool</div>
            <div class="brand-stat"><span>100%</span>Transparent</div>
          </div>
        </div>
      </div>
      <div class="auth-layout__form">
        <div class="form-container">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout { display: flex; min-height: 100vh; }
    .auth-layout__brand {
      flex: 1; background: linear-gradient(135deg, #1a237e 0%, #283593 40%, #1565c0 100%);
      display: flex; align-items: center; justify-content: center; padding: 40px;
      color: white;
    }
    .brand-content { max-width: 360px; text-align: center; }
    .brand-logo { background: rgba(255,255,255,.15); border-radius: 50%; width: 80px; height: 80px;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
    .brand-logo mat-icon { font-size: 44px; width: 44px; height: 44px; color: #fff; }
    h1 { font-size: 36px; font-weight: 700; margin: 0 0 12px; }
    p { opacity: .8; font-size: 15px; line-height: 1.6; margin-bottom: 32px; }
    .brand-stats { display: flex; gap: 24px; justify-content: center; }
    .brand-stat { text-align: center; }
    .brand-stat span { display: block; font-size: 24px; font-weight: 700; }
    .brand-stat { font-size: 12px; opacity: .7; text-transform: uppercase; }
    .auth-layout__form { flex: 0 0 480px; display: flex; align-items: center; justify-content: center; padding: 40px; background: #fafafa; }
    .form-container { width: 100%; max-width: 400px; }
    @media (max-width: 768px) {
      .auth-layout { flex-direction: column; }
      .auth-layout__brand { display: none; }
      .auth-layout__form { flex: 1; }
    }
  `],
})
export class AuthLayoutComponent {}
