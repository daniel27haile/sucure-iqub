import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-member-dashboard',
  template: `
    <div class="page-header">
      <h1>My Dashboard</h1>
      <p>Your Secure Iqub contribution overview</p>
    </div>

    <app-loading-spinner *ngIf="loading" message="Loading your dashboard..."></app-loading-spinner>

    <ng-container *ngIf="!loading">
      <div class="empty-state" *ngIf="memberships.length === 0">
        <mat-icon>savings</mat-icon>
        <h3>No group memberships yet</h3>
        <p>You will appear here once an Admin assigns you to a slot in a group.</p>
      </div>

      <div class="membership-cards" *ngFor="let m of memberships">
        <mat-card class="membership-card" [class]="'mc--' + m.group?.status">
          <!-- Group header -->
          <mat-card-header>
            <mat-icon mat-card-avatar>savings</mat-icon>
            <mat-card-title>{{ m.group?.name }}</mat-card-title>
            <mat-card-subtitle>
              <app-status-badge [status]="m.group?.status"></app-status-badge>
              &nbsp; Month {{ m.group?.currentMonth }}/12
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <!-- My slot info -->
            <div class="slot-info">
              <div class="slot-badge">
                <mat-icon>view_module</mat-icon>
                <div>
                  <div class="slot-name">{{ m.slot?.label }}</div>
                  <div class="slot-sub">Slot {{ m.slot?.slotNumber }}</div>
                </div>
              </div>
              <app-status-badge [status]="m.slot?.status || 'pending'"></app-status-badge>
            </div>

            <!-- My stats -->
            <div class="member-stats">
              <div class="mstat">
                <div class="mstat-val">$ {{ m.myMonthlyContribution | number }}</div>
                <div class="mstat-lbl">My Monthly</div>
              </div>
              <div class="mstat">
                <div class="mstat-val">{{ m.sharePercent }}%</div>
                <div class="mstat-lbl">My Share</div>
              </div>
              <div class="mstat">
                <div class="mstat-val">$ {{ m.totalPaid | number }}</div>
                <div class="mstat-lbl">Total Paid</div>
              </div>
              <div class="mstat" [class.mstat--win]="m.slotWon">
                <div class="mstat-val">$ {{ m.expectedTotalPayout | number }}</div>
                <div class="mstat-lbl">{{ m.slotWon ? 'My Payout 🏆' : 'Expected Payout' }}</div>
              </div>
            </div>

            <!-- Won notification -->
            <div class="won-banner" *ngIf="m.slotWon">
              <mat-icon>emoji_events</mat-icon>
              <div>
                <strong>Your slot won in Month {{ m.wonInMonth }}!</strong>
                <div>Payout: $ {{ m.actualPayout | number }} {{ m.disbursed ? '(Disbursed ✓)' : '(Pending disbursement)' }}</div>
              </div>
            </div>

            <!-- On-time stats -->
            <div class="ontime-row" *ngIf="m.totalPayments > 0">
              <mat-icon>schedule</mat-icon>
              {{ m.onTimePayments }}/{{ m.totalPayments }} on-time payments
              <span *ngIf="m.totalPenalties > 0" class="penalty-tag">$ {{ m.totalPenalties }} penalties</span>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button mat-button routerLink="/member/payments">My Payments</button>
            <button mat-button routerLink="/member/slot">Slot Details</button>
            <button mat-button [routerLink]="['/member/groups', m.group?._id, 'winners']">Winner History</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </ng-container>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; color: #263238; }
    p { color: #666; margin: 0; }
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #b0bec5; }
    .empty-state h3 { font-size: 18px; color: #546e7a; margin: 16px 0 8px; }
    .empty-state p { color: #90a4ae; }
    .membership-cards { display: flex; flex-direction: column; gap: 20px; }
    .membership-card { }
    .slot-info { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; margin-bottom: 12px; }
    .slot-badge { display: flex; align-items: center; gap: 10px; }
    .slot-badge mat-icon { color: #1a237e; }
    .slot-name { font-weight: 600; font-size: 15px; }
    .slot-sub { font-size: 12px; color: #888; }
    .member-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 12px 0; }
    .mstat { text-align: center; padding: 10px; background: #f9f9f9; border-radius: 8px; }
    .mstat-val { font-size: 18px; font-weight: 700; color: #1a237e; }
    .mstat-lbl { font-size: 11px; color: #888; margin-top: 2px; }
    .mstat--win .mstat-val { color: #2e7d32; }
    .won-banner { display: flex; align-items: flex-start; gap: 12px; background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border: 1px solid #a5d6a7; border-radius: 8px; padding: 14px; margin: 8px 0; color: #1b5e20; }
    .won-banner mat-icon { color: #ffd700; font-size: 28px; width: 28px; height: 28px; flex-shrink: 0; }
    .ontime-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #666; margin-top: 8px; }
    .penalty-tag { background: #ffebee; color: #c62828; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; margin-left: 8px; }
  `],
})
export class MemberDashboardComponent implements OnInit {
  memberships: any[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getMemberDashboard().subscribe({
      next: (res) => { this.memberships = res.data || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
