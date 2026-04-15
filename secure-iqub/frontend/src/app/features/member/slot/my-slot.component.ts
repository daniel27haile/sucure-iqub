import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-my-slot',
  template: `
    <div class="page-header"><h1>My Slot</h1></div>
    <app-loading-spinner *ngIf="loading"></app-loading-spinner>

    <div class="empty" *ngIf="!loading && slots.length === 0">
      <mat-icon>view_module</mat-icon>
      <p>You haven't been assigned to any slots yet.</p>
    </div>

    <div class="slot-cards" *ngFor="let s of slots">
      <mat-card class="slot-detail-card">
        <mat-card-header>
          <div mat-card-avatar class="slot-avatar">{{ s.slot?.slotNumber }}</div>
          <mat-card-title>{{ s.slot?.label }}</mat-card-title>
          <mat-card-subtitle>
            <app-status-badge [status]="s.slot?.status"></app-status-badge>
            &nbsp; in {{ s.group?.name }}
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="slot-stats">
            <div class="sstat"><div class="val">$ {{ s.monthlyAmount | number }}</div><div class="lbl">My Monthly Contribution</div></div>
            <div class="sstat"><div class="val">{{ s.sharePercent }}%</div><div class="lbl">My Slot Share</div></div>
            <div class="sstat"><div class="val">$ {{ s.slot?.requiredMonthlyAmount | number }}</div><div class="lbl">Slot Monthly Total</div></div>
            <div class="sstat"><div class="val">$ {{ s.slot?.payoutAmount | number }}</div><div class="lbl">Slot Payout</div></div>
          </div>

          <div class="payout-info">
            <mat-icon>info</mat-icon>
            <span>If your slot wins, your share is <strong>$ {{ (s.sharePercent / 100) * 24000 | number }}</strong> ({{ s.sharePercent }}% of $24,000)</span>
          </div>

          <div class="won-info" *ngIf="s.slot?.status === 'won'">
            <mat-icon>emoji_events</mat-icon>
            <strong>Your slot won in Month {{ s.slot?.wonInMonth }}!</strong>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0; }
    .empty { text-align: center; padding: 60px; color: #888; }
    .empty mat-icon { font-size: 64px; width: 64px; height: 64px; color: #bbb; display: block; margin: 0 auto 12px; }
    .slot-cards { display: flex; flex-direction: column; gap: 20px; }
    .slot-detail-card { max-width: 640px; }
    .slot-avatar { width: 40px; height: 40px; border-radius: 50%; background: #1a237e; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }
    .slot-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px 0; }
    .sstat { text-align: center; padding: 12px; background: #f5f5f5; border-radius: 8px; }
    .val { font-size: 18px; font-weight: 700; color: #1a237e; }
    .lbl { font-size: 11px; color: #888; margin-top: 4px; }
    .payout-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #1565c0; background: #e3f2fd; padding: 10px 14px; border-radius: 8px; margin-top: 8px; }
    .won-info { display: flex; align-items: center; gap: 8px; color: #2e7d32; background: #e8f5e9; padding: 12px 14px; border-radius: 8px; margin-top: 8px; }
    .won-info mat-icon { color: #ffd700; }
  `],
})
export class MySlotComponent implements OnInit {
  slots: any[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getMySlot().subscribe({
      next: (res) => { this.slots = res.data || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
