import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Group } from '../../../core/models/group.model';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="page-header">
      <div>
        <h1>Admin Dashboard</h1>
      </div>
      <div class="header-right">
        <app-live-clock></app-live-clock>
        <button mat-raised-button color="primary" routerLink="/admin/groups/new">
          <mat-icon>add</mat-icon> New Group
        </button>
      </div>
    </div>

    <!-- First-login welcome onboarding card -->
    <mat-card class="welcome-card" *ngIf="showWelcome">
      <mat-card-content>
        <div class="welcome-content">
          <div class="welcome-icon">
            <mat-icon>celebration</mat-icon>
          </div>
          <div class="welcome-text">
            <h2>Welcome to Secure-Iqub!</h2>
            <p>You have been granted admin access. Here's how to get started:</p>
            <div class="onboarding-steps">
              <div class="onboard-step">
                <div class="onboard-num">1</div>
                <div><strong>Create your Iqub group</strong> — Click "New Group" above</div>
              </div>
              <div class="onboard-step">
                <div class="onboard-num">2</div>
                <div><strong>Register members</strong> — Use Member Invite to add your group members</div>
              </div>
              <div class="onboard-step">
                <div class="onboard-num">3</div>
                <div><strong>Build 12 slots</strong> — Assign each member to a slot ($2,000/month each)</div>
              </div>
              <div class="onboard-step">
                <div class="onboard-num">4</div>
                <div><strong>Set slot leaders</strong> — For shared slots, designate a representative leader</div>
              </div>
              <div class="onboard-step">
                <div class="onboard-num">5</div>
                <div><strong>Activate the cycle</strong> — Once all 12 slots are filled, activate and start collecting</div>
              </div>
            </div>
          </div>
          <button mat-icon-button class="welcome-close" (click)="dismissWelcome()" title="Dismiss">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </mat-card-content>
    </mat-card>

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
            <!-- Suspended notice — only when group.status is truly 'suspended' in DB -->
            <div class="suspended-notice" *ngIf="group.status === 'suspended'">
              <mat-icon>pause_circle</mat-icon>
              <div>
                <strong>Group paused by Super Admin</strong>
                <p>Ask your Super Admin to reactivate this group from the All Groups management page.</p>
              </div>
            </div>

            <!-- Current month real calendar label -->
            <div class="month-label" *ngIf="analytics[group._id]?.currentMonthInfo">
              <mat-icon>calendar_today</mat-icon>
              {{ analytics[group._id].currentMonthInfo.label }}
            </div>

            <!-- Collection window reminder banner -->
            <div *ngIf="analytics[group._id]?.collectionWindowStatus as cws">
              <div class="reminder-banner reminder--info"
                   *ngIf="cws.status === 'day1'">
                <mat-icon>info</mat-icon>
                <span>{{ cws.message }}</span>
              </div>
              <div class="reminder-banner reminder--warning"
                   *ngIf="cws.status === 'day2'">
                <mat-icon>schedule</mat-icon>
                <span>{{ cws.message }}</span>
              </div>
              <div class="reminder-banner reminder--strong"
                   *ngIf="cws.status === 'day3' || (cws.isInWindow && cws.day >= 3)">
                <mat-icon>warning</mat-icon>
                <span>{{ cws.message }}</span>
              </div>
              <div class="reminder-banner reminder--error"
                   *ngIf="cws.status === 'late'">
                <mat-icon>error_outline</mat-icon>
                <span>{{ cws.message }}</span>
              </div>
            </div>

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
              <div class="stat" *ngIf="analytics[group._id].penaltyAwardPool > 0">
                <div class="stat-val text-green">$ {{ analytics[group._id].penaltyAwardPool | number }}</div>
                <div class="stat-lbl">On-Time Award Pool</div>
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
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .header-right { display: flex; align-items: center; gap: 20px; }
    h1 { font-size: 24px; font-weight: 700; margin: 0; color: #1a237e; }

    /* Month label */
    .month-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: #1a237e;
      margin-bottom: 8px;
    }
    .month-label mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Reminder banners */
    .reminder-banner {
      display: flex; align-items: flex-start; gap: 8px;
      border-radius: 8px; padding: 10px 12px; margin-bottom: 10px;
      font-size: 13px; font-weight: 500; line-height: 1.4;
    }
    .reminder-banner mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
    .reminder--info    { background: #e3f2fd; color: #0d47a1; }
    .reminder--info mat-icon { color: #1565c0; }
    .reminder--warning { background: #fff9c4; color: #f57f17; }
    .reminder--warning mat-icon { color: #f9a825; }
    .reminder--strong  { background: #fff3e0; color: #e65100; }
    .reminder--strong mat-icon { color: #ef6c00; }
    .reminder--error   { background: #ffebee; color: #c62828; }
    .reminder--error mat-icon { color: #d32f2f; }

    /* Welcome card */
    .welcome-card { margin-bottom: 24px; background: linear-gradient(135deg, #f0f4ff, #e8f5e9); border: 1px solid #c5cae9; }
    .welcome-content { display: flex; align-items: flex-start; gap: 20px; position: relative; }
    .welcome-icon { flex-shrink: 0; }
    .welcome-icon mat-icon { font-size: 48px; width: 48px; height: 48px; color: #1565c0; }
    .welcome-text { flex: 1; min-width: 0; }
    .welcome-text h2 { font-size: 20px; font-weight: 700; color: #1a237e; margin: 0 0 8px; }
    .welcome-text p { color: #555; font-size: 14px; margin: 0 0 16px; }
    .onboarding-steps { display: flex; flex-direction: column; gap: 8px; }
    .onboard-step { display: flex; align-items: flex-start; gap: 12px; font-size: 14px; color: #444; }
    .onboard-num { width: 24px; height: 24px; border-radius: 50%; background: #1565c0; color: white;
                    display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .welcome-close { position: absolute; top: -8px; right: -8px; }

    /* Group grid */
    .group-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .group-card { transition: box-shadow .2s; }
    .group-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.12); }
    .group-card--active mat-card-avatar { color: #2e7d32; }
    .group-card--draft mat-card-avatar { color: #666; }

    /* Stats inside card — 4 cols on desktop, 2 on mobile */
    .group-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
    .stat { text-align: center; }
    .stat-val { font-size: 18px; font-weight: 700; color: #1a237e; }
    .stat-lbl { font-size: 11px; color: #888; margin-top: 2px; }

    .progress-section { margin: 12px 0; }
    .progress-label { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 6px; }
    .suspended-notice {
      display: flex; align-items: flex-start; gap: 10px;
      background: #fff3e0; border: 1px solid #ffcc02; border-radius: 10px;
      padding: 12px 14px; margin-bottom: 12px; color: #e65100;
    }
    .suspended-notice mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px; }
    .suspended-notice strong { font-size: 13px; display: block; }
    .suspended-notice p { margin: 3px 0 0; font-size: 12px; color: #bf360c; }
    .warning-row { display: flex; align-items: center; gap: 8px; color: #e65100; font-size: 13px; margin-top: 8px; }
    .empty-state { text-align: center; padding: 48px 16px; }
    .empty-state mat-icon { font-size: 56px; width: 56px; height: 56px; color: #bbb; }
    .empty-state h3 { font-size: 20px; margin: 16px 0 8px; color: #444; }
    .empty-state p { color: #888; margin-bottom: 24px; }

    /* ── Tablet ── */
    @media (max-width: 1024px) {
      .group-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
    }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      h1 { font-size: 20px; }
      .header-right { flex-direction: column; align-items: flex-end; gap: 8px; }
      .group-grid { grid-template-columns: 1fr; }
      .group-stats { grid-template-columns: repeat(2, 1fr); }
      .welcome-icon { display: none; }
      .empty-state { padding: 36px 12px; }
    }

    /* ── Small phones ── */
    @media (max-width: 480px) {
      .stat-val { font-size: 16px; }
      .welcome-text h2 { font-size: 17px; }
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  groups: Group[] = [];
  analytics: Record<string, any> = {};
  loading = true;
  showWelcome = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // Check if this is a first-login admin
    this.api.getAdminDashboardSummary().subscribe({
      next: (res) => { this.showWelcome = res.data?.firstLogin === true; },
    });

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

  dismissWelcome(): void {
    this.showWelcome = false;
    this.api.dismissWelcomeCard().subscribe();
  }
}
