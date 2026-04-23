import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

@Component({
  selector: 'app-lucky-spin',
  template: `
    <div class="page-header">
      <button mat-icon-button [routerLink]="['/admin/groups', groupId]"><mat-icon>arrow_back</mat-icon></button>
      <div>
        <h1>🎰 Lucky Spin</h1>
        <p class="subtitle">{{ currentMonthLabel }} — {{ eligibleSlots.length }} eligible slot(s)</p>
      </div>
    </div>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>

    <!-- ── Month progress timeline ── -->
    <div class="month-timeline" *ngIf="!loading">
      <div
        *ngFor="let m of months"
        class="month-step"
        [class.month-step--completed]="m.state === 'completed'"
        [class.month-step--current]="m.state === 'current'"
        [class.month-step--locked]="m.state === 'locked'"
        [matTooltip]="m.calendarLabel ? 'Month ' + m.number + ' — ' + m.calendarLabel + ' (' + (m.state | titlecase) + ')' : 'Month ' + m.number"
      >
        <mat-icon class="step-icon">{{ m.state === 'completed' ? 'check_circle' : m.state === 'current' ? 'radio_button_checked' : 'lock' }}</mat-icon>
        <span class="step-num">M{{ m.number }}</span>
        <span class="step-cal" *ngIf="m.shortCalendarLabel">{{ m.shortCalendarLabel }}</span>
        <span class="step-label">{{ m.state === 'completed' ? 'Done' : m.state === 'current' ? 'Active' : 'Locked' }}</span>
      </div>
    </div>

    <ng-container *ngIf="!loading">
      <!-- Already spun this month -->
      <mat-card class="already-spun-card" *ngIf="alreadySpun">
        <mat-card-content>
          <div class="already-spun-content">
            <mat-icon>lock</mat-icon>
            <div>
              <h3>{{ currentMonthLabel }} spin already completed</h3>
              <p>The spin for this month has been finalized. See results below.</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Spin arena -->
      <div class="spin-arena" *ngIf="!alreadySpun">
        <!-- Eligible slots display -->
        <mat-card class="eligible-slots-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>casino</mat-icon>
            <mat-card-title>Eligible Slots — {{ currentMonthLabel }}</mat-card-title>
            <mat-card-subtitle>{{ eligibleSlots.length }} slots eligible for this spin</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="slots-wheel" [class.spinning]="isSpinning">
              <div
                *ngFor="let slot of displaySlots; let i = index"
                class="wheel-slot"
                [class.wheel-slot--highlighted]="i === highlightedIndex"
                [class.wheel-slot--winner]="spinComplete && i === winnerIndex"
                [style.animation-delay]="i * 0.05 + 's'"
              >
                <div class="wheel-slot-number">{{ slot.slotNumber }}</div>
                <!-- Show leader name prominently if assigned, otherwise show slot label -->
                <div class="wheel-slot-label" *ngIf="slot.leaderDisplayName">
                  <mat-icon class="leader-icon">star</mat-icon>
                  {{ slot.leaderDisplayName }}
                </div>
                <div class="wheel-slot-label" *ngIf="!slot.leaderDisplayName">{{ slot.label }}</div>
                <!-- Member chips — show all members under the leader -->
                <div class="wheel-slot-members">
                  <span *ngFor="let m of slot.members" class="member-chip"
                    [class.leader-chip]="m.isLeader">
                    {{ m.member?.firstName || '' }} {{ m.member?.lastName || '' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- No eligible slots warning -->
            <div class="no-slots-warning" *ngIf="eligibleSlots.length === 0">
              <mat-icon color="warn">warning</mat-icon>
              <div>
                <strong>No eligible slots available.</strong>
                <p>Ensure all slot member payments for Month {{ currentMonth }} are approved before spinning.</p>
              </div>
            </div>

            <!-- Spin button -->
            <div class="spin-controls" *ngIf="eligibleSlots.length > 0">
              <button
                mat-raised-button
                class="spin-btn"
                [disabled]="isSpinning || spinComplete"
                (click)="confirmSpin()"
              >
                <mat-icon>casino</mat-icon>
                {{ isSpinning ? 'Spinning...' : 'SPIN NOW!' }}
              </button>
              <p class="spin-hint">All {{ eligibleSlots.length }} eligible slots have equal probability of winning</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Winner reveal -->
        <div class="winner-reveal" *ngIf="spinComplete && winner" [@fadeIn]>
          <div class="winner-card">
            <div class="winner-card__confetti">🎉🎊🏆🎊🎉</div>
            <h2>Congratulations!</h2>
            <div class="winner-slot-badge">Slot {{ winner.winnerSlotNumber }}</div>
            <!-- winnerSlotLabel now contains the leader name if one is assigned -->
            <h3>{{ winner.winnerSlotLabel }}</h3>
            <div class="winner-label-note" *ngIf="winner.winnerMembers?.length > 1">
              Shared slot · payout distributed by contribution
            </div>
            <div class="payout-amount">$ {{ winner.totalPayoutAmount | number }}</div>
            <div class="payout-label">Total Payout</div>

            <div class="winner-members">
              <h4>Payout Distribution</h4>
              <div class="distribution-row" *ngFor="let m of winner.winnerMembers">
                <div class="dist-member">
                  <div class="dist-avatar">{{ m.name[0] }}</div>
                  <div>
                    <div class="dist-name">{{ m.name }}</div>
                    <div class="dist-share">{{ m.sharePercent }}% share</div>
                  </div>
                </div>
                <div class="dist-amount">$ {{ m.payoutAmount | number }}</div>
              </div>
            </div>

            <div class="winner-meta">
              <mat-icon>schedule</mat-icon>
              Month {{ currentMonth }} · Random seed: {{ winner.randomSeed?.slice(0, 8) }}...
            </div>
          </div>
        </div>
      </div>

      <!-- Spin history -->
      <mat-card class="history-card" *ngIf="spinHistory.length > 0">
        <mat-card-header>
          <mat-icon mat-card-avatar>history</mat-icon>
          <mat-card-title>Spin History</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="history-list">
            <div class="history-item" *ngFor="let h of spinHistory">
              <div class="history-month">Month {{ h.monthNumber }}</div>
              <div class="history-winner">
                🏆 {{ h.winnerSlotLabel }}
              </div>
              <div class="history-payout">$ {{ h.totalPayoutAmount | number }}</div>
              <div class="history-date">{{ h.createdAt | date:'mediumDate' }}</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </ng-container>
  `,
  styles: [`
    .page-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 2px; color: #1a237e; }
    .subtitle { margin: 0; color: #666; font-size: 13px; }
    .already-spun-card { margin-bottom: 24px; background: #f3e5f5; }
    .already-spun-content { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .already-spun-content mat-icon { font-size: 40px; width: 40px; height: 40px; color: #9c27b0; flex-shrink: 0; }
    .already-spun-content h3 { margin: 0 0 4px; }
    .already-spun-content p { margin: 0; color: #666; }

    .spin-arena { display: grid; gap: 24px; }

    /* Slots wheel */
    .slots-wheel {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;
      padding: 16px 0; min-height: 100px;
    }
    .wheel-slot {
      border: 2px solid #e0e0e0; border-radius: 12px; padding: 14px; text-align: center;
      transition: all .15s; background: white;
    }
    .wheel-slot-number { font-size: 22px; font-weight: 700; color: #1a237e; }
    .wheel-slot-label { font-size: 12px; font-weight: 600; color: #444; margin: 4px 0; display: flex; align-items: center; justify-content: center; gap: 3px; }
    .leader-icon { font-size: 13px; width: 13px; height: 13px; color: #f57f17; }
    .wheel-slot-members { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
    .member-chip { background: #e8eaf6; color: #3949ab; padding: 2px 8px; border-radius: 10px; font-size: 10px; }
    .leader-chip { background: #fff9c4; color: #f57f17; font-weight: 700; }
    .winner-label-note { font-size: 12px; opacity: .65; margin-bottom: 12px; }

    /* Animations */
    .spinning .wheel-slot { animation: pulse .4s ease-in-out infinite alternate; }
    @keyframes pulse { from { transform: scale(1); } to { transform: scale(1.03); } }
    .wheel-slot--highlighted { border-color: #1565c0 !important; background: #e3f2fd !important; transform: scale(1.05); box-shadow: 0 4px 12px rgba(21,101,192,.3); }
    .wheel-slot--winner { border-color: #ffd700 !important; background: linear-gradient(135deg, #fff9c4, #fff3e0) !important; transform: scale(1.08); box-shadow: 0 8px 24px rgba(255,215,0,.5); animation: winner-glow 1s ease-in-out infinite alternate !important; }
    @keyframes winner-glow { from { box-shadow: 0 4px 16px rgba(255,215,0,.4); } to { box-shadow: 0 8px 32px rgba(255,215,0,.8); } }

    .no-slots-warning { display: flex; gap: 12px; background: #fff3e0; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .no-slots-warning mat-icon { flex-shrink: 0; color: #e65100; }

    /* Spin controls */
    .spin-controls { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 0; }
    .spin-btn {
      height: 56px; font-size: 18px; font-weight: 700; padding: 0 40px;
      background: linear-gradient(135deg, #1a237e, #1565c0) !important; color: white !important;
      border-radius: 32px !important; letter-spacing: 1px;
      box-shadow: 0 4px 20px rgba(21,101,192,.4) !important;
      transition: transform .2s !important; max-width: 100%;
    }
    .spin-btn:not([disabled]):hover { transform: scale(1.04); }
    .spin-btn[disabled] { opacity: .6; }
    .spin-hint { color: #888; font-size: 12px; text-align: center; }

    /* Winner reveal */
    .winner-reveal { display: flex; justify-content: center; padding: 20px 0; }
    .winner-card {
      background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%);
      color: white; border-radius: 20px; padding: 32px 28px; text-align: center;
      max-width: 480px; width: 100%; box-shadow: 0 12px 40px rgba(26,35,126,.4);
      animation: slideIn .5s ease-out;
    }
    @keyframes slideIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .winner-card__confetti { font-size: 28px; margin-bottom: 8px; }
    .winner-card h2 { font-size: 28px; font-weight: 700; margin: 0 0 12px; }
    .winner-slot-badge { background: rgba(255,255,255,.2); border-radius: 20px; padding: 4px 20px; display: inline-block; font-size: 13px; margin-bottom: 8px; }
    .winner-card h3 { font-size: 19px; margin: 0 0 12px; }
    .payout-amount { font-size: 44px; font-weight: 700; color: #ffd700; line-height: 1; }
    .payout-label { font-size: 13px; opacity: .7; margin-bottom: 20px; }
    .winner-members { background: rgba(255,255,255,.1); border-radius: 12px; padding: 14px; text-align: left; }
    .winner-members h4 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; opacity: .7; letter-spacing: .5px; }
    .distribution-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.1); gap: 8px; flex-wrap: wrap; }
    .distribution-row:last-child { border: none; }
    .dist-member { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .dist-avatar { width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .dist-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dist-share { font-size: 11px; opacity: .7; }
    .dist-amount { font-size: 16px; font-weight: 700; color: #ffd700; flex-shrink: 0; }
    .winner-meta { display: flex; align-items: center; gap: 6px; justify-content: center; margin-top: 14px; font-size: 11px; opacity: .5; flex-wrap: wrap; }

    /* ── Month timeline ── */
    .month-timeline {
      display: flex; flex-wrap: wrap; gap: 6px;
      background: white; border-radius: 12px;
      padding: 14px 16px; margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }
    .month-step {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 8px 10px; border-radius: 10px; min-width: 54px; cursor: default;
      transition: background .15s;
    }
    .step-icon { font-size: 18px; width: 18px; height: 18px; }
    .step-num { font-size: 11px; font-weight: 700; }
    .step-cal { font-size: 9px; color: #777; }
    .step-label { font-size: 9px; text-transform: uppercase; letter-spacing: .4px; }
    /* Completed — green */
    .month-step--completed { background: #e8f5e9; }
    .month-step--completed .step-icon { color: #43a047; }
    .month-step--completed .step-num { color: #2e7d32; }
    .month-step--completed .step-label { color: #66bb6a; }
    /* Current — blue */
    .month-step--current { background: #e3f2fd; border: 2px solid #1565c0; }
    .month-step--current .step-icon { color: #1565c0; }
    .month-step--current .step-num { color: #1a237e; }
    .month-step--current .step-label { color: #1976d2; }
    /* Locked — grey */
    .month-step--locked { background: #f5f5f5; }
    .month-step--locked .step-icon { color: #bdbdbd; }
    .month-step--locked .step-num { color: #bdbdbd; }
    .month-step--locked .step-label { color: #ccc; }

    /* History */
    .history-card { margin-top: 24px; }
    .history-list { display: flex; flex-direction: column; gap: 8px; }
    .history-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f9f9f9; border-radius: 8px; flex-wrap: wrap; }
    .history-month { background: #1a237e; color: white; border-radius: 12px; padding: 2px 12px; font-size: 12px; font-weight: 600; flex-shrink: 0; }
    .history-winner { flex: 1; font-weight: 600; min-width: 100px; }
    .history-payout { color: #2e7d32; font-weight: 700; flex-shrink: 0; }
    .history-date { font-size: 12px; color: #888; flex-shrink: 0; }

    /* ── Tablet ── */
    @media (max-width: 1024px) {
      .slots-wheel { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
    }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      h1 { font-size: 19px; }
      .slots-wheel { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; }
      .spin-btn { height: 52px; font-size: 16px; padding: 0 28px; width: 100%; max-width: 320px; }
      .winner-card { padding: 24px 16px; border-radius: 16px; }
      .winner-card h2 { font-size: 22px; }
      .payout-amount { font-size: 36px; }
      .winner-card h3 { font-size: 16px; }
      .history-date { display: none; }
    }

    /* ── Small phones ── */
    @media (max-width: 480px) {
      .slots-wheel { grid-template-columns: repeat(3, 1fr); }
      .wheel-slot { padding: 10px 6px; }
      .wheel-slot-number { font-size: 18px; }
      .payout-amount { font-size: 30px; }
    }
  `],
})
export class LuckySpinComponent implements OnInit, OnDestroy {
  groupId = '';
  currentMonth = 1;
  groupStartDate: string | null = null;
  eligibleSlots: any[] = [];
  spinHistory: any[] = [];
  loading = true;
  isSpinning = false;
  spinComplete = false;
  alreadySpun = false;
  winner: any = null;
  displaySlots: any[] = [];
  highlightedIndex = -1;
  winnerIndex = -1;
  private spinInterval: any;

  /** "Month 1 — January 2026" for the current spin month */
  get currentMonthLabel(): string {
    return this.monthLabel(this.currentMonth);
  }

  /**
   * Derive state for all 12 months — includes calendar label from spin history
   * (completed months) or computed from groupStartDate (future/current months).
   */
  get months(): Array<{ number: number; state: 'completed' | 'current' | 'locked'; calendarLabel: string; shortCalendarLabel: string }> {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const isCompleted = this.spinHistory.some((h) => h.monthNumber === m);
      const isCurrent = m === this.currentMonth && !isCompleted;

      // Calendar label: prefer spin history (authoritative), fall back to computed
      const spinEntry = this.spinHistory.find((h) => h.monthNumber === m);
      let calendarLabel = '';
      let shortCalendarLabel = '';
      if (spinEntry?.calendarMonth && spinEntry?.calendarYear) {
        calendarLabel = MONTH_NAMES[spinEntry.calendarMonth - 1] + ' ' + spinEntry.calendarYear;
        shortCalendarLabel = MONTH_NAMES[spinEntry.calendarMonth - 1].slice(0, 3) + ' ' + String(spinEntry.calendarYear).slice(2);
      } else if (this.groupStartDate) {
        const start = new Date(this.groupStartDate);
        const d = new Date(start.getFullYear(), start.getMonth() + m - 1, 1);
        calendarLabel = MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
        shortCalendarLabel = MONTH_NAMES[d.getMonth()].slice(0, 3) + ' ' + String(d.getFullYear()).slice(2);
      }

      return {
        number: m,
        state: isCompleted ? 'completed' : isCurrent ? 'current' : 'locked',
        calendarLabel,
        shortCalendarLabel,
      };
    });
  }

  /** Build "Month N — MonthName YYYY" label for any cycle month */
  private monthLabel(monthNumber: number): string {
    const spinEntry = this.spinHistory.find((h) => h.monthNumber === monthNumber);
    if (spinEntry?.calendarMonth && spinEntry?.calendarYear) {
      return `Month ${monthNumber} \u2014 ${MONTH_NAMES[spinEntry.calendarMonth - 1]} ${spinEntry.calendarYear}`;
    }
    if (this.groupStartDate) {
      const start = new Date(this.groupStartDate);
      const d = new Date(start.getFullYear(), start.getMonth() + monthNumber - 1, 1);
      return `Month ${monthNumber} \u2014 ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    }
    return `Month ${monthNumber}`;
  }

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.spinInterval) clearInterval(this.spinInterval);
  }

  loadData(): void {
    this.loading = true;
    this.api.getGroupDetails(this.groupId).subscribe({
      next: (res) => {
        this.currentMonth = res.data.group.currentMonth;
        this.groupStartDate = res.data.group.startDate || null;
        this.loadEligibleSlots();
        this.loadHistory();
      },
    });
  }

  loadEligibleSlots(): void {
    this.api.getEligibleSlots(this.groupId).subscribe({
      next: (res) => {
        this.eligibleSlots = res.data.slots || [];
        // The API now returns leaderDisplayName and members with isLeader flags
        this.displaySlots = this.eligibleSlots.map((s: any) => ({
          ...s,
          // Keep members as-is (they now include member object + isLeader)
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadHistory(): void {
    this.api.getSpinHistory(this.groupId).subscribe({
      next: (res) => {
        this.spinHistory = res.data || [];
        // Check if already spun this month
        this.alreadySpun = this.spinHistory.some((s) => s.monthNumber === this.currentMonth);
      },
    });
  }

  confirmSpin(): void {
    if (this.eligibleSlots.length === 0) { this.toast.error('No eligible slots available'); return; }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirm Spin',
        message: `<strong>${this.currentMonthLabel} Lucky Spin</strong><br><br>
          ${this.eligibleSlots.length} eligible slots will enter the draw.<br>
          One slot will be randomly selected to receive <strong>$24,000</strong>.<br><br>
          <em>This action cannot be undone. The result will be permanently recorded.</em>`,
        confirmLabel: '🎰 Spin!',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.performSpin();
    });
  }

  performSpin(): void {
    this.isSpinning = true;
    this.spinComplete = false;
    this.winner = null;
    this.highlightedIndex = -1;

    // Visual animation — cycle through slots rapidly
    let cycles = 0;
    const totalCycles = 30 + Math.floor(Math.random() * 20); // 30-50 cycles
    const initialDelay = 80;

    const animate = (delay: number, count: number) => {
      this.highlightedIndex = count % this.displaySlots.length;
      if (count < totalCycles) {
        const nextDelay = count > totalCycles * 0.7 ? delay * 1.15 : delay; // slow down near end
        setTimeout(() => animate(nextDelay, count + 1), delay);
      } else {
        // Call API
        this.api.runSpin(this.groupId).subscribe({
          next: (res) => {
            this.winner = res.data.spinResult;
            const winnerSlotNumber = this.winner.winnerSlotNumber;
            this.winnerIndex = this.displaySlots.findIndex((s) => s.slotNumber === winnerSlotNumber);
            this.highlightedIndex = this.winnerIndex;
            this.isSpinning = false;
            this.spinComplete = true;
            this.toast.success(`🎉 Slot ${winnerSlotNumber} wins $24,000!`);
            this.loadHistory();
          },
          error: (err) => {
            this.isSpinning = false;
            this.highlightedIndex = -1;
            this.toast.error(err.error?.message || 'Spin failed');
          },
        });
      }
    };

    animate(initialDelay, 0);
  }
}
