import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-member-layout',
  template: `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar__brand">
          <mat-icon>savings</mat-icon>
          <span>Secure Iqub</span>
        </div>
        <nav class="sidebar__nav">
          <a class="nav-item" routerLink="/member/dashboard" routerLinkActive="active"><mat-icon>dashboard</mat-icon><span>My Dashboard</span></a>
          <a class="nav-item" routerLink="/member/slot" routerLinkActive="active"><mat-icon>view_module</mat-icon><span>My Slot</span></a>
          <a class="nav-item" routerLink="/member/payments" routerLinkActive="active"><mat-icon>receipt</mat-icon><span>My Payments</span></a>
        </nav>
        <div class="sidebar__footer">
          <div class="user-info">
            <div class="avatar">{{ initials }}</div>
            <div>
              <div class="name">{{ user?.firstName }} {{ user?.lastName }}</div>
              <div class="role">Member</div>
            </div>
          </div>
          <button mat-icon-button (click)="logout()"><mat-icon>logout</mat-icon></button>
        </div>
      </aside>
      <div class="main-content">
        <header class="topbar">
          <span class="spacer"></span>
          <span class="topbar__badge">Member</span>
        </header>
        <main class="page-content"><router-outlet></router-outlet></main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout { display: flex; height: 100vh; overflow: hidden; }
    .sidebar { width: 220px; background: #263238; color: white; display: flex; flex-direction: column; flex-shrink: 0; }
    .sidebar__brand { display: flex; align-items: center; gap: 10px; padding: 20px 16px; font-size: 16px; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,.08); }
    .sidebar__brand mat-icon { color: #80cbc4; }
    .sidebar__nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; }
    .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 8px; border-radius: 8px; color: rgba(255,255,255,.6); text-decoration: none; font-size: 14px; transition: .15s; }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,.1); color: white; }
    .sidebar__footer { padding: 12px; border-top: 1px solid rgba(255,255,255,.08); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .user-info { display: flex; align-items: center; gap: 8px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #80cbc4; color: #263238; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
    .name { font-size: 12px; font-weight: 600; }
    .role { font-size: 10px; opacity: .5; }
    .sidebar__footer button { color: rgba(255,255,255,.5); }
    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .topbar { height: 60px; background: white; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; padding: 0 24px; }
    .spacer { flex: 1; }
    .topbar__badge { background: #e0f2f1; color: #00695c; padding: 4px 14px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .page-content { flex: 1; overflow-y: auto; padding: 24px; background: #f5f7fa; }
  `],
})
export class MemberLayoutComponent implements OnInit {
  user: any;
  constructor(private auth: AuthService) {}
  ngOnInit(): void { this.user = this.auth.currentUser; }
  get initials(): string { return `${this.user?.firstName?.[0] || ''}${this.user?.lastName?.[0] || ''}`; }
  logout(): void { this.auth.logout(); }
}
