import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

interface NavItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-admin-layout',
  template: `
    <div class="app-layout">
      <!-- Mobile overlay backdrop -->
      <div class="mobile-overlay" *ngIf="mobileMenuOpen" (click)="mobileMenuOpen = false"></div>

      <!-- Sidebar -->
      <aside class="sidebar" [class.sidebar--collapsed]="sidebarCollapsed" [class.sidebar--open]="mobileMenuOpen">
        <div class="sidebar__brand">
          <app-si-logo [showText]="!sidebarCollapsed" size="md"></app-si-logo>
        </div>
        <nav class="sidebar__nav">
          <a *ngFor="let item of navItems" class="nav-item" [routerLink]="item.route" routerLinkActive="active"
             (click)="mobileMenuOpen = false">
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
              <div class="account-status"
                   [class.account-status--active]="user?.isActive"
                   [class.account-status--suspended]="!user?.isActive">
                {{ user?.isActive ? 'Active' : 'Suspended' }}
              </div>
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
          <!-- Desktop collapse toggle -->
          <button mat-icon-button class="desktop-toggle" (click)="sidebarCollapsed = !sidebarCollapsed">
            <mat-icon>{{ sidebarCollapsed ? 'menu_open' : 'menu' }}</mat-icon>
          </button>
          <!-- Mobile hamburger -->
          <button mat-icon-button class="mobile-toggle" (click)="mobileMenuOpen = !mobileMenuOpen">
            <mat-icon>{{ mobileMenuOpen ? 'close' : 'menu' }}</mat-icon>
          </button>
          <app-si-logo class="topbar__brand-mobile" size="sm"></app-si-logo>
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

    /* ── Sidebar ── */
    .sidebar {
      width: 240px; background: #1a237e; color: white; display: flex; flex-direction: column;
      transition: width .25s ease; flex-shrink: 0; z-index: 200;
    }
    .sidebar--collapsed { width: 64px; }
    .sidebar__brand {
      display: flex; align-items: center; padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,.1); flex-shrink: 0; color: white;
    }
    .sidebar__nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
    .nav-item {
      display: flex; align-items: center; gap: 12px; padding: 12px 10px; border-radius: 8px;
      color: rgba(255,255,255,.7); text-decoration: none; font-size: 14px;
      transition: background .15s, color .15s; white-space: nowrap; overflow: hidden;
    }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,.15); color: white; }
    .nav-item mat-icon { flex-shrink: 0; }
    .sidebar__footer {
      padding: 12px 8px; border-top: 1px solid rgba(255,255,255,.1);
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    .user-info { display: flex; align-items: center; gap: 8px; overflow: hidden; min-width: 0; }
    .user-avatar { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
    .user-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 11px; opacity: .6; }
    .account-status { font-size: 10px; font-weight: 700; letter-spacing: .3px; padding: 1px 7px; border-radius: 8px; display: inline-block; margin-top: 3px; }
    .account-status--active { background: rgba(76,175,80,.3); color: #a5d6a7; }
    .account-status--suspended { background: rgba(229,57,53,.3); color: #ef9a9a; }
    .sidebar__footer button { color: rgba(255,255,255,.7); flex-shrink: 0; }

    /* ── Main ── */
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .topbar {
      height: 60px; background: white; border-bottom: 1px solid #e0e0e0;
      display: flex; align-items: center; padding: 0 16px; gap: 8px; flex-shrink: 0;
    }
    .topbar__spacer { flex: 1; }
    .topbar__brand-mobile { display: none; color: #1a237e; }
    .topbar__role-badge { background: #e8eaf6; color: #3949ab; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .mobile-toggle { display: none; }
    .page-content { flex: 1; overflow-y: auto; padding: 24px; background: #f5f7fa; }

    /* ── Mobile overlay ── */
    .mobile-overlay {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 199;
    }

    /* ── Tablet (≤ 1024px): narrower sidebar ── */
    @media (max-width: 1024px) {
      .sidebar { width: 200px; }
      .sidebar--collapsed { width: 56px; }
    }

    /* ── Mobile (≤ 768px): drawer overlay ── */
    @media (max-width: 768px) {
      .sidebar {
        position: fixed; top: 0; left: 0; height: 100%; width: 260px;
        transform: translateX(-100%); transition: transform .25s ease; z-index: 300;
      }
      .sidebar--open { transform: translateX(0); }
      .sidebar--collapsed { width: 260px; transform: translateX(-100%); }
      .sidebar--collapsed.sidebar--open { transform: translateX(0); }

      .mobile-overlay { display: block; }
      .desktop-toggle { display: none; }
      .mobile-toggle { display: inline-flex; }
      .topbar__brand-mobile { display: inline-flex; }

      .page-content { padding: 16px; }
      .topbar { padding: 0 12px; }
    }

    /* ── Small phones (≤ 480px) ── */
    @media (max-width: 480px) {
      .page-content { padding: 12px; }
      .topbar__role-badge { display: none; }
    }
  `],
})
export class AdminLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  mobileMenuOpen = false;
  user: any;
  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'My Groups', icon: 'group_work', route: '/admin/groups' },
  ];

  constructor(private auth: AuthService, private api: ApiService) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    // Always refresh profile from server so stale isActive/role never lingers
    this.auth.getProfile().subscribe({
      next: () => { this.user = this.auth.currentUser; },
    });
  }
  get initials(): string { return `${this.user?.firstName?.[0]}${this.user?.lastName?.[0]}`; }
  logout(): void { this.auth.logout(); }
}
