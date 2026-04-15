import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-admin-layout',
  template: `
    <div class="app-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.sidebar--collapsed]="sidebarCollapsed">
        <div class="sidebar__brand">
          <mat-icon>savings</mat-icon>
          <span *ngIf="!sidebarCollapsed">Secure Iqub</span>
        </div>
        <nav class="sidebar__nav">
          <a *ngFor="let item of navItems" class="nav-item" [routerLink]="item.route" routerLinkActive="active">
            <mat-icon [matTooltip]="sidebarCollapsed ? item.label : ''" matTooltipPosition="right">{{ item.icon }}</mat-icon>
            <span *ngIf="!sidebarCollapsed">{{ item.label }}</span>
          </a>
        </nav>
        <div class="sidebar__footer">
          <div class="user-info" *ngIf="!sidebarCollapsed">
            <div class="user-avatar">{{ initials }}</div>
            <div class="user-meta">
              <div class="user-name">{{ user?.firstName }} {{ user?.lastName }}</div>
              <div class="user-role">Admin</div>
            </div>
          </div>
          <button mat-icon-button (click)="logout()" matTooltip="Sign out">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <div class="main-content">
        <header class="topbar">
          <button mat-icon-button (click)="sidebarCollapsed = !sidebarCollapsed">
            <mat-icon>{{ sidebarCollapsed ? 'menu_open' : 'menu' }}</mat-icon>
          </button>
          <span class="topbar__spacer"></span>
          <span class="topbar__role-badge">Admin</span>
        </header>
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; }

    .sidebar {
      width: 240px; background: #1a237e; color: white; display: flex; flex-direction: column;
      transition: width .25s ease; flex-shrink: 0;
    }
    .sidebar--collapsed { width: 64px; }
    .sidebar__brand {
      display: flex; align-items: center; gap: 12px; padding: 20px 16px; font-size: 18px;
      font-weight: 700; border-bottom: 1px solid rgba(255,255,255,.1);
    }
    .sidebar__brand mat-icon { font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; }
    .sidebar__nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
    .nav-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 8px;
      color: rgba(255,255,255,.7); text-decoration: none; font-size: 14px;
      transition: background .15s, color .15s; white-space: nowrap; overflow: hidden;
    }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,.15); color: white; }
    .nav-item mat-icon { flex-shrink: 0; }
    .sidebar__footer {
      padding: 12px 8px; border-top: 1px solid rgba(255,255,255,.1);
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .user-info { display: flex; align-items: center; gap: 8px; overflow: hidden; }
    .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
    .user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 11px; opacity: .6; }
    .sidebar__footer button { color: rgba(255,255,255,.7); flex-shrink: 0; }

    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar {
      height: 60px; background: white; border-bottom: 1px solid #e0e0e0;
      display: flex; align-items: center; padding: 0 20px; gap: 12px; flex-shrink: 0;
    }
    .topbar__spacer { flex: 1; }
    .topbar__role-badge { background: #e8eaf6; color: #3949ab; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .page-content { flex: 1; overflow-y: auto; padding: 24px; background: #f5f7fa; }
  `],
})
export class AdminLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  user: any;
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'My Groups', icon: 'group_work', route: '/admin/groups' },
  ];

  constructor(private auth: AuthService) {}

  ngOnInit(): void { this.user = this.auth.currentUser; }
  get initials(): string { return `${this.user?.firstName?.[0]}${this.user?.lastName?.[0]}`; }
  logout(): void { this.auth.logout(); }
}
