import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-super-admin-layout',
  template: `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar__brand">
          <mat-icon>shield</mat-icon>
          <span>Super Admin</span>
        </div>
        <nav class="sidebar__nav">
          <a class="nav-item" routerLink="/super-admin/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon><span>Dashboard</span>
          </a>
          <a class="nav-item" routerLink="/super-admin/admins" routerLinkActive="active">
            <mat-icon>manage_accounts</mat-icon><span>Admins</span>
          </a>
          <a class="nav-item" routerLink="/super-admin/groups" routerLinkActive="active">
            <mat-icon>group_work</mat-icon><span>All Groups</span>
          </a>
          <a class="nav-item" routerLink="/super-admin/settings" routerLinkActive="active">
            <mat-icon>settings</mat-icon><span>Platform Settings</span>
          </a>
          <a class="nav-item" routerLink="/super-admin/audit-logs" routerLinkActive="active">
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
          <span class="topbar__title">Secure Iqub — Platform Control</span>
          <span class="spacer"></span>
          <span class="topbar__badge">Super Admin</span>
        </header>
        <main class="page-content"><router-outlet></router-outlet></main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; }
    .sidebar { width: 240px; background: #0d0d0d; color: white; display: flex; flex-direction: column; flex-shrink: 0; }
    .sidebar__brand { display: flex; align-items: center; gap: 10px; padding: 20px 16px; font-size: 16px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,.08); }
    .sidebar__brand mat-icon { color: #ffd700; }
    .sidebar__nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 8px; color: rgba(255,255,255,.6); text-decoration: none; font-size: 14px; transition: .15s; }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,.1); color: white; }
    .sidebar__footer { padding: 12px; border-top: 1px solid rgba(255,255,255,.08); display: flex; align-items: center; justify-content: space-between; }
    .user-chip { display: flex; flex-direction: column; }
    .user-chip span:first-child { font-size: 13px; font-weight: 600; }
    .role-label { font-size: 10px; color: #ffd700; text-transform: uppercase; }
    .sidebar__footer button { color: rgba(255,255,255,.5); }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar { height: 60px; background: white; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; padding: 0 24px; }
    .topbar__title { font-size: 15px; font-weight: 600; color: #333; }
    .spacer { flex: 1; }
    .topbar__badge { background: #212121; color: #ffd700; padding: 4px 14px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .page-content { flex: 1; overflow-y: auto; padding: 24px; background: #f5f7fa; }
  `],
})
export class SuperAdminLayoutComponent implements OnInit {
  user: any;
  constructor(private auth: AuthService) {}
  ngOnInit(): void { this.user = this.auth.currentUser; }
  logout(): void { this.auth.logout(); }
}
