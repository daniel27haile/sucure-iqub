import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-super-admin-layout',
  template: `
    <div class="app-layout">
      <!-- Mobile overlay -->
      <div class="mobile-overlay" *ngIf="mobileMenuOpen" (click)="mobileMenuOpen = false"></div>

      <aside class="sidebar" [class.sidebar--open]="mobileMenuOpen">
        <div class="sidebar__brand">
          <app-si-logo label="Super Admin" variant="gold" size="md"></app-si-logo>
        </div>
        <nav class="sidebar__nav">
          <a class="nav-item" routerLink="/super-admin/dashboard" routerLinkActive="active" (click)="mobileMenuOpen=false">
            <mat-icon>dashboard</mat-icon><span>Dashboard</span>
          </a>
          <a class="nav-item" routerLink="/super-admin/admins" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="mobileMenuOpen=false">
            <mat-icon>manage_accounts</mat-icon><span>Admins</span>
          </a>
          <a class="nav-item" routerLink="/super-admin/admin-requests" routerLinkActive="active" (click)="mobileMenuOpen=false">
            <mat-icon>how_to_reg</mat-icon><span>Leader Applications</span>
            <span class="nav-badge" *ngIf="pendingRequestCount > 0">{{ pendingRequestCount }}</span>
          </a>
          <a class="nav-item" routerLink="/super-admin/groups" routerLinkActive="active" (click)="mobileMenuOpen=false">
            <mat-icon>group_work</mat-icon><span>All Groups</span>
          </a>
          <a class="nav-item" routerLink="/super-admin/settings" routerLinkActive="active" (click)="mobileMenuOpen=false">
            <mat-icon>settings</mat-icon><span>Platform Settings</span>
          </a>
          <a class="nav-item" routerLink="/super-admin/audit-logs" routerLinkActive="active" (click)="mobileMenuOpen=false">
            <mat-icon>receipt_long</mat-icon><span>Audit Logs</span>
          </a>
        </nav>
        <div class="sidebar__footer">
          <div class="user-chip">
            <span>{{ user?.firstName }} {{ user?.lastName }}</span>
            <span class="role-label">Super Admin</span>
          </div>
          <button mat-icon-button (click)="logout()"><mat-icon>logout</mat-icon></button>
        </div>
      </aside>

      <div class="main-content">
        <header class="topbar">
          <button mat-icon-button class="mobile-toggle" (click)="mobileMenuOpen = !mobileMenuOpen">
            <mat-icon>{{ mobileMenuOpen ? 'close' : 'menu' }}</mat-icon>
          </button>
          <div class="topbar__brand-wrap">
            <app-si-logo label="Secure Iqub" size="sm"></app-si-logo>
            <span class="title-sub">— Platform Control</span>
          </div>
          <span class="spacer"></span>
          <span class="topbar__badge">Super Admin</span>
        </header>
        <main class="page-content"><router-outlet></router-outlet></main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; }

    /* ── Sidebar ── */
    .sidebar { width: 240px; background: #0d0d0d; color: white; display: flex; flex-direction: column; flex-shrink: 0; z-index: 200; }
    .sidebar__brand { display: flex; align-items: center; padding: 20px 16px; border-bottom: 1px solid rgba(255,255,255,.08); flex-shrink: 0; color: white; }
    .sidebar__nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 10px; border-radius: 8px; color: rgba(255,255,255,.6); text-decoration: none; font-size: 14px; transition: .15s; }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,.1); color: white; }
    .nav-badge { margin-left: auto; background: #ffd700; color: #1a237e; border-radius: 10px; padding: 2px 8px; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .sidebar__footer { padding: 12px; border-top: 1px solid rgba(255,255,255,.08); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .user-chip { display: flex; flex-direction: column; overflow: hidden; }
    .user-chip span:first-child { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .role-label { font-size: 10px; color: #ffd700; text-transform: uppercase; }
    .sidebar__footer button { color: rgba(255,255,255,.5); flex-shrink: 0; }

    /* ── Main ── */
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .topbar { height: 60px; background: white; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; padding: 0 16px; gap: 8px; }
    .topbar__brand-wrap { display: flex; align-items: center; gap: 8px; color: #333; }
    .title-sub { font-weight: 400; color: #888; font-size: 14px; white-space: nowrap; }
    .spacer { flex: 1; }
    .topbar__badge { background: #212121; color: #ffd700; padding: 4px 14px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .mobile-toggle { display: none; }
    .page-content { flex: 1; overflow-y: auto; padding: 24px; background: #f5f7fa; }

    /* ── Mobile overlay ── */
    .mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 199; }

    /* ── Tablet ── */
    @media (max-width: 1024px) {
      .sidebar { width: 200px; }
      .title-sub { display: none; }
    }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      .sidebar {
        position: fixed; top: 0; left: 0; height: 100%; width: 270px;
        transform: translateX(-100%); transition: transform .25s ease; z-index: 300;
      }
      .sidebar--open { transform: translateX(0); }
      .mobile-overlay { display: block; }
      .mobile-toggle { display: inline-flex; }
      .page-content { padding: 16px; }
      .topbar { padding: 0 12px; }
    }

    @media (max-width: 480px) {
      .page-content { padding: 12px; }
      .topbar__badge { display: none; }
    }
  `],
})
export class SuperAdminLayoutComponent implements OnInit {
  user: any;
  pendingRequestCount = 0;
  mobileMenuOpen = false;
  constructor(private auth: AuthService, private api: ApiService) {}
  ngOnInit(): void {
    this.user = this.auth.currentUser;
    this.loadPendingCount();
  }
  loadPendingCount(): void {
    this.api.getAdminRequestCounts().subscribe({
      next: (res) => { this.pendingRequestCount = res.data?.new || 0; },
    });
  }
  logout(): void { this.auth.logout(); }
}
