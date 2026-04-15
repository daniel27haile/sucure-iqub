import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Group } from '../../../core/models/group.model';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="page-header">
      <h1>Admin Dashboard</h1>
      <button mat-raised-button color="primary" routerLink="/admin/groups/new">
        <mat-icon>add</mat-icon> New Group
      </button>
    </div>

    <app-loading-spinner *ngIf="loading" message="Loading dashboard..."></app-loading-spinner>

    <ng-container *ngIf="!loading">
      <!-- Group cards -->
      <div *ngIf="groups.length === 0" class="empty-state">
        <mat-icon>group_work</mat-icon>
        <h3>No groups yet</h3>
        <p>Create your first Secure Iqub group to get started.</p>
        <button mat-raised-button color="primary" routerLink="/admin/groups/new">Create Group</button>
      </div>

      <div class="group-grid" *ngFor="let group of groups">
        <mat-card class="group-card" [class]="'group-card--' + group.status">
          <mat-card-header>
            <mat-icon mat-card-avatar>group_work</mat-icon>
            <mat-card-title>{{ group.name }}</mat-card-title>
            <mat-card-subtitle>
              <app-status-badge [status]="group.status"></app-status-badge>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <!-- Stats row -->
            <div class="group-stats" *ngIf="analytics[group._id]">
              <div class="stat">
                <div class="stat-val">Month {{ analytics[group._id].currentMonth }}/{{ group.cycleLength }}</div>
                <div class="stat-lbl">Current Month</div>
              </div>
              <div class="stat">
                <div class="stat-val">$ {{ analytics[group._id].collectedThisMonth | number }}</div>
                <div class="stat-lbl">Collected</div>
              </div>
              <div class="stat">
                <div class="stat-val">$ {{ analytics[group._id].remainingThisMonth | number }}</div>
                <div class="stat-lbl">Remaining</div>
              </div>
              <div class="stat">
                <div class="stat-val">{{ analytics[group._id].eligibleSlots }}</div>
                <div class="stat-lbl">Eligible Slots</div>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="progress-section" *ngIf="analytics[group._id]">
              <div class="progress-label">
                <span>Cycle Progress</span>
                <span>{{ analytics[group._id].completionPercent }}%</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="analytics[group._id].completionPercent"></mat-progress-bar>
            </div>

            <!-- Warnings -->
            <div class="warning-row" *ngIf="analytics[group._id]?.lateMembers > 0">
              <mat-icon color="warn">warning</mat-icon>
              <span>{{ analytics[group._id].lateMembers }} late payment(s) — $ {{ analytics[group._id].totalPenalties | number }} in penalties</span>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button [routerLink]="['/admin/groups', group._id]">
              <mat-icon>visibility</mat-icon> View
            </button>
            <button mat-button [routerLink]="['/admin/groups', group._id, 'collection']" *ngIf="group.status === 'active'">
              <mat-icon>payments</mat-icon> Payments
            </button>
            <button mat-button color="accent" [routerLink]="['/admin/groups', group._id, 'spin']" *ngIf="group.status === 'active'">
              <mat-icon>casino</mat-icon> Spin
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </ng-container>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    h1 { font-size: 24px; font-weight: 700; margin: 0; color: #1a237e; }
    .group-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
    .group-card { transition: box-shadow .2s; }
    .group-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.12); }
    .group-card--active mat-card-avatar { color: #2e7d32; }
    .group-card--draft mat-card-avatar { color: #666; }
    .group-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .stat { text-align: center; }
    .stat-val { font-size: 18px; font-weight: 700; color: #1a237e; }
    .stat-lbl { font-size: 11px; color: #888; margin-top: 2px; }
    .progress-section { margin: 12px 0; }
    .progress-label { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 6px; }
    .warning-row { display: flex; align-items: center; gap: 8px; color: #e65100; font-size: 13px; margin-top: 8px; }
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #bbb; }
    .empty-state h3 { font-size: 20px; margin: 16px 0 8px; color: #444; }
    .empty-state p { color: #888; margin-bottom: 24px; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  groups: Group[] = [];
  analytics: Record<string, any> = {};
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getMyGroups().subscribe({
      next: (res) => {
        this.groups = res.data || [];
        this.loading = false;
        this.groups.forEach((g) => this.loadAnalytics(g._id));
      },
      error: () => { this.loading = false; },
    });
  }

  loadAnalytics(groupId: string): void {
    this.api.getGroupAnalytics(groupId).subscribe({
      next: (res) => { this.analytics[groupId] = res.data; },
    });
  }
}
