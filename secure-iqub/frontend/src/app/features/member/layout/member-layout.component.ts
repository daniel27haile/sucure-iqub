import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-member-layout',
  template: `
    <div class="app-layout">
      <!-- Mobile overlay -->
      <div class="mobile-overlay" *ngIf="mobileMenuOpen" (click)="mobileMenuOpen = false"></div>

      <aside class="sidebar" [class.sidebar--open]="mobileMenuOpen">
        <div class="sidebar__brand">
          <app-si-logo size="md"></app-si-logo>
        </div>
        <nav class="sidebar__nav">
          <a class="nav-item" routerLink="/member/dashboard" routerLinkActive="active" (click)="mobileMenuOpen=false"><mat-icon>dashboard</mat-icon><span>My Dashboard</span></a>
          <a class="nav-item" routerLink="/member/slot" routerLinkActive="active" (click)="mobileMenuOpen=false"><mat-icon>view_module</mat-icon><span>My Slot</span></a>
          <a class="nav-item" routerLink="/member/payments" routerLinkActive="active" (click)="mobileMenuOpen=false"><mat-icon>receipt</mat-icon><span>My Payments</span></a>
        </nav>
        <div class="sidebar__footer">
          <div class="user-info">
            <div class="avatar">{{ initials }}</div>
            <div class="user-text">
              <div class="name">{{ user?.firstName }} {{ user?.lastName }}</div>
              <div class="role">Member</div>
            </div>
          </div>
          <button mat-icon-button (click)="logout()"><mat-icon>logout</mat-icon></button>
        </div>
      </aside>

      <div class="main-content">
        <header class="topbar">
          <button mat-icon-button class="mobile-toggle" (click)="mobileMenuOpen = !mobileMenuOpen">
            <mat-icon>{{ mobileMenuOpen ? 'close' : 'menu' }}</mat-icon>
          </button>
          <app-si-logo class="topbar__brand-mobile" size="sm"></app-si-logo>
          <span class="spacer"></span>
          <span class="topbar__badge">Member</span>
        </header>
        <main class="page-content"><router-outlet></router-outlet></main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; }

    /* ── Sidebar ── */
    .sidebar { width: 220px; background: #263238; color: white; display: flex; flex-direction: column; flex-shrink: 0; z-index: 200; }
    .sidebar__brand { display: flex; align-items: center; padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,.08); flex-shrink: 0; color: white; }
    .sidebar__nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 12px 10px; border-radius: 8px; color: rgba(255,255,255,.6); text-decoration: none; font-size: 14px; transition: .15s; }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,.1); color: white; }
    .sidebar__footer { padding: 12px; border-top: 1px solid rgba(255,255,255,.08); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .user-info { display: flex; align-items: center; gap: 8px; overflow: hidden; min-width: 0; }
    .user-text { overflow: hidden; min-width: 0; }
    .avatar { width: 34px; height: 34px; border-radius: 50%; background: #80cbc4; color: #263238; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .role { font-size: 10px; opacity: .55; }
    .sidebar__footer button { color: rgba(255,255,255,.5); flex-shrink: 0; }

    /* ── Main ── */
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .topbar { height: 60px; background: white; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; padding: 0 16px; gap: 8px; }
    .topbar__brand-mobile { display: none; color: #263238; }
    .spacer { flex: 1; }
    .topbar__badge { background: #e0f2f1; color: #00695c; padding: 4px 14px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .mobile-toggle { display: none; }
    .page-content { flex: 1; overflow-y: auto; padding: 24px; background: #f5f7fa; }

    /* ── Mobile overlay ── */
    .mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 199; }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      .sidebar {
        position: fixed; top: 0; left: 0; height: 100%; width: 260px;
        transform: translateX(-100%); transition: transform .25s ease; z-index: 300;
      }
      .sidebar--open { transform: translateX(0); }
      .mobile-overlay { display: block; }
      .mobile-toggle { display: inline-flex; }
      .topbar__brand-mobile { display: inline-flex; }
      .page-content { padding: 16px; }
      .topbar { padding: 0 12px; }
    }

    @media (max-width: 480px) {
      .page-content { padding: 12px; }
      .topbar__badge { display: none; }
    }
  `],
})
export class MemberLayoutComponent implements OnInit {
  user: any;
  mobileMenuOpen = false;
  constructor(private auth: AuthService) {}
  ngOnInit(): void { this.user = this.auth.currentUser; }
  get initials(): string { return `${this.user?.firstName?.[0] || ''}${this.user?.lastName?.[0] || ''}`; }
  logout(): void { this.auth.logout(); }
}
