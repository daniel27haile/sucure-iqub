import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

/**
 * SharedSlotBuilderComponent
 *
 * Inline component used on the slot management page to:
 *  - Show all members currently assigned to a slot with their contribution amounts
 *  - Display the running total and remaining amount to reach $2,000
 *  - Show a VALID / INVALID badge
 *  - Allow assigning a slot leader from the existing members
 *  - Show projected payout per member (monthlyAmount × 12)
 *
 * Usage:
 *   <app-shared-slot-builder [groupId]="groupId" [slot]="slot" (leaderChanged)="reload()">
 *   </app-shared-slot-builder>
 */
@Component({
  selector: 'app-shared-slot-builder',
  template: `
    <div class="slot-builder" *ngIf="preview">
      <!-- Slot header -->
      <div class="builder-header">
        <div class="builder-title">
          <span class="slot-num">Slot {{ preview.slotNumber }}</span>
          <span class="slot-label">{{ preview.label }}</span>
          <span class="validity-badge" [class.valid]="preview.isSlotValid" [class.invalid]="!preview.isSlotValid">
            {{ preview.isSlotValid ? '✓ Valid — $2,000' : '⚠ Incomplete' }}
          </span>
        </div>
        <div class="leader-info" *ngIf="preview.leader">
          <mat-icon>star</mat-icon>
          Leader: <strong>{{ preview.leader.name }}</strong>
        </div>
      </div>

      <!-- Contribution progress bar -->
      <div class="progress-section">
        <div class="progress-labels">
          <span>Monthly Total</span>
          <span [class.valid]="preview.isSlotValid" [class.invalid]="!preview.isSlotValid">
            $ {{ preview.totalMonthlyContribution | number }} / $2,000
          </span>
        </div>
        <mat-progress-bar
          mode="determinate"
          [value]="(preview.totalMonthlyContribution / 2000) * 100"
          [color]="preview.isSlotValid ? 'primary' : 'warn'">
        </mat-progress-bar>
        <div class="remaining-hint" *ngIf="!preview.isSlotValid">
          Remaining: <strong>$ {{ preview.remainingToReach2000 | number }}</strong> more needed
        </div>
      </div>

      <!-- Members table -->
      <table class="members-table" *ngIf="preview.members.length > 0">
        <thead>
          <tr>
            <th>Member</th>
            <th>Monthly ($)</th>
            <th>Share %</th>
            <th>Projected Payout</th>
            <th>Leader</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let m of preview.members" [class.leader-row]="m.isLeader">
            <td>
              <div class="member-cell">
                <div class="member-avatar">{{ m.fullName[0] }}</div>
                <div>
                  <div class="member-name">{{ m.fullName }}</div>
                  <div class="member-email">{{ m.email }}</div>
                </div>
                <mat-icon *ngIf="m.isLeader" class="leader-star" title="Group Leader">star</mat-icon>
              </div>
            </td>
            <td class="amount-cell">$ {{ m.monthlyContribution | number }}</td>
            <td class="share-cell">{{ m.sharePercent }}%</td>
            <td class="payout-cell">$ {{ m.projectedPayout | number }}</td>
            <td class="action-cell">
              <button mat-icon-button
                [disabled]="m.isLeader || settingLeader"
                (click)="setLeader(m.memberId)"
                title="Set as group leader">
                <mat-icon [class.active-star]="m.isLeader">{{ m.isLeader ? 'star' : 'star_border' }}</mat-icon>
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="totals-row">
            <td><strong>Totals</strong></td>
            <td class="amount-cell"><strong>$ {{ preview.totalMonthlyContribution | number }}</strong></td>
            <td class="share-cell"><strong>100%</strong></td>
            <td class="payout-cell"><strong>$ {{ preview.projectedTotalPayout | number }}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <!-- Payout summary -->
      <div class="payout-summary" *ngIf="preview.isSlotValid">
        <mat-icon>info_outline</mat-icon>
        <span>
          If this slot wins: total payout <strong>$ {{ preview.projectedTotalPayout | number }}</strong>
          ({{ preview.cycleLength }} months × $ {{ preview.totalMonthlyContribution | number }}/month)
          distributed proportionally per member.
        </span>
      </div>

      <!-- Incomplete slot warning -->
      <div class="incomplete-warning" *ngIf="!preview.isSlotValid">
        <mat-icon>warning</mat-icon>
        <span>
          This slot cannot participate in the cycle until contributions reach exactly <strong>$2,000/month</strong>.
          Add <strong>$ {{ preview.remainingToReach2000 | number }}</strong> more.
        </span>
      </div>
    </div>

    <app-loading-spinner *ngIf="loadingPreview" message="Loading slot details..."></app-loading-spinner>
  `,
  styles: [`
    .slot-builder { border: 1px solid #e0e0e0; border-radius: 10px; padding: 16px; background: white; }
    .builder-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .builder-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .slot-num { font-size: 18px; font-weight: 700; color: #1a237e; }
    .slot-label { font-size: 14px; color: #555; }
    .validity-badge { padding: 3px 10px; border-radius: 10px; font-size: 12px; font-weight: 700; }
    .validity-badge.valid { background: #e8f5e9; color: #2e7d32; }
    .validity-badge.invalid { background: #fff3e0; color: #e65100; }
    .leader-info { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #6a1b9a;
                    background: #f3e5f5; padding: 4px 10px; border-radius: 8px; }
    .leader-info mat-icon { font-size: 16px; width: 16px; height: 16px; color: #ffd700; }

    .progress-section { margin-bottom: 16px; }
    .progress-labels { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 6px; }
    .progress-labels .valid { color: #2e7d32; font-weight: 700; }
    .progress-labels .invalid { color: #e65100; font-weight: 700; }
    .remaining-hint { font-size: 12px; color: #e65100; margin-top: 4px; }

    /* Members table */
    .members-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
    .members-table th { text-align: left; padding: 8px 10px; border-bottom: 2px solid #e0e0e0; color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: .3px; }
    .members-table td { padding: 10px; border-bottom: 1px solid #f0f0f0; }
    .leader-row td { background: #fef9e7; }
    .member-cell { display: flex; align-items: center; gap: 10px; }
    .member-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #1a237e, #1565c0);
                      color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
    .member-name { font-weight: 600; color: #222; }
    .member-email { font-size: 11px; color: #aaa; }
    .leader-star { font-size: 16px; width: 16px; height: 16px; color: #ffd700; margin-left: 4px; }
    .amount-cell { font-weight: 600; color: #1a237e; }
    .share-cell { color: #666; }
    .payout-cell { font-weight: 700; color: #2e7d32; }
    .action-cell { width: 48px; }
    .active-star { color: #ffd700 !important; }
    .totals-row td { border-top: 2px solid #e0e0e0; border-bottom: none; font-size: 13px; }

    /* Summaries */
    .payout-summary { display: flex; align-items: flex-start; gap: 8px; background: #e8f5e9; border-radius: 6px;
                       padding: 10px 12px; font-size: 13px; color: #2e7d32; }
    .payout-summary mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }
    .incomplete-warning { display: flex; align-items: flex-start; gap: 8px; background: #fff3e0; border-radius: 6px;
                            padding: 10px 12px; font-size: 13px; color: #e65100; }
    .incomplete-warning mat-icon { font-size: 18px; width: 18px; height: 18px; flex-shrink: 0; }
  `],
})
export class SharedSlotBuilderComponent implements OnInit, OnChanges {
  @Input() groupId!: string;
  @Input() slotId!: string;
  @Output() leaderChanged = new EventEmitter<void>();

  preview: any = null;
  loadingPreview = false;
  settingLeader = false;

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void { this.loadPreview(); }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['slotId'] || changes['groupId']) && this.slotId) {
      this.loadPreview();
    }
  }

  loadPreview(): void {
    if (!this.groupId || !this.slotId) return;
    this.loadingPreview = true;
    this.api.getSlotPayoutPreview(this.groupId, this.slotId).subscribe({
      next: (res) => {
        this.preview = res.data;
        this.loadingPreview = false;
      },
      error: () => { this.loadingPreview = false; },
    });
  }

  setLeader(memberId: string): void {
    if (!memberId) return;
    this.settingLeader = true;
    this.api.setSlotLeader(this.groupId, this.slotId, memberId).subscribe({
      next: (res) => {
        this.settingLeader = false;
        this.toast.success(`Leader set: ${res.data.leaderName}`);
        this.loadPreview();
        this.leaderChanged.emit();
      },
      error: (err) => {
        this.settingLeader = false;
        this.toast.error(err.error?.message || 'Failed to set leader');
      },
    });
  }
}
