import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-super-admin-dashboard',
  template: `
    <div class="page-header">
      <h1>Platform Overview</h1>
      <span class="sub">Real-time platform analytics and health</span>
    </div>

    <app-loading-spinner *ngIf="loading" message="Loading analytics..."></app-loading-spinner>

    <ng-container *ngIf="!loading && analytics">
      <div class="stats-grid">
        <app-stat-card label="Total Groups" [value]="analytics.totalGroups" icon="group_work" color="blue"></app-stat-card>
        <app-stat-card label="Active Groups" [value]="analytics.activeGroups" icon="play_circle" color="green"></app-stat-card>
        <app-stat-card label="Total Members" [value]="analytics.totalMembers" icon="people" color="teal"></app-stat-card>
        <app-stat-card label="Total Admins" [value]="analytics.totalAdmins" icon="admin_panel_settings" color="purple"></app-stat-card>
        <app-stat-card label="Collected This Month" [value]="'$' + (analytics.collectedThisMonth | number)" icon="attach_money" color="green"></app-stat-card>
        <app-stat-card label="Total Penalties" [value]="'$' + (analytics.totalPenalties | number)" icon="warning" color="orange"></app-stat-card>
        <app-stat-card label="Completed Payouts" [value]="analytics.completedPayouts" icon="emoji_events" color="purple"></app-stat-card>
        <app-stat-card label="Late Payments" [value]="analytics.latePaymentsThisMonth" icon="schedule" color="red"></app-stat-card>
      </div>

      <!-- Quick actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-cards">
          <mat-card class="action-card" routerLink="/super-admin/admins">
            <mat-icon>manage_accounts</mat-icon>
            <span>Manage Admins</span>
          </mat-card>
          <mat-card class="action-card" routerLink="/super-admin/groups">
            <mat-icon>group_work</mat-icon>
            <span>View All Groups</span>
          </mat-card>
          <mat-card class="action-card" routerLink="/super-admin/settings">
            <mat-icon>settings</mat-icon>
            <span>Platform Settings</span>
          </mat-card>
          <mat-card class="action-card" routerLink="/super-admin/audit-logs">
            <mat-icon>receipt_long</mat-icon>
            <span>Audit Logs</span>
          </mat-card>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 24px; font-weight: 700; margin: 0 0 4px; color: #0d0d0d; }
    .sub { color: #666; font-size: 14px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .quick-actions h2 { font-size: 18px; font-weight: 600; margin: 0 0 16px; }
    .action-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .action-card { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px; cursor: pointer; text-align: center; transition: transform .2s, box-shadow .2s; }
    .action-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,.12); }
    .action-card mat-icon { font-size: 36px; width: 36px; height: 36px; color: #1a237e; }
    .action-card span { font-size: 14px; font-weight: 600; color: #333; }
  `],
})
export class SuperAdminDashboardComponent implements OnInit {
  analytics: any = null;
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getPlatformAnalytics().subscribe({
      next: (res) => { this.analytics = res.data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
