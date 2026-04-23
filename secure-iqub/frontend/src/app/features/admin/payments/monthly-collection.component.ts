import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Payment } from '../../../core/models/group.model';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

@Component({
  selector: 'app-monthly-collection',
  template: `
    <!-- ── Page header ── -->
    <div class="page-header">
      <button mat-icon-button [routerLink]="['/admin/groups', groupId]"><mat-icon>arrow_back</mat-icon></button>
      <div>
        <h1>Monthly Collection</h1>
        <p class="subtitle">{{ group?.name }} · {{ selectedMonthLabel }}</p>
      </div>
      <span class="spacer"></span>
      <mat-form-field appearance="outline" class="month-filter">
        <mat-label>Month</mat-label>
        <mat-select [value]="selectedMonth" (selectionChange)="onMonthChange($event.value)">
          <mat-option *ngFor="let m of availableMonths" [value]="m">{{ getMonthLabel(m) }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <!-- ── Summary counters ── -->
    <div class="summary-grid">
      <app-stat-card label="Expected Total" [value]="summaryLoading ? '...' : expectedTotalDisplay" icon="account_balance" color="blue"></app-stat-card>
      <app-stat-card label="Members Expected" [value]="summaryLoading ? '...' : (summary?.totalExpected ?? 0).toString()" icon="group" color="blue"></app-stat-card>
      <app-stat-card label="Payments Recorded" [value]="summaryLoading ? '...' : (summary?.totalPaid ?? 0).toString()" icon="check_circle" color="green"></app-stat-card>
      <app-stat-card label="Still Unpaid" [value]="summaryLoading ? '...' : (summary?.totalUnpaid ?? 0).toString()" icon="hourglass_empty" [color]="(summary?.totalUnpaid ?? 0) > 0 ? 'orange' : 'green'"></app-stat-card>
    </div>

    <!-- ── All-paid success banner ── -->
    <div class="all-paid-banner" *ngIf="summary?.allPaid && summary?.totalExpected > 0">
      <mat-icon>check_circle</mat-icon>
      <div>
        <strong>All payments recorded for Month {{ selectedMonth }}!</strong>
        <span>All {{ summary.totalExpected }} members have submitted. The group is ready for the Lucky Spin.</span>
      </div>
    </div>

    <!-- ── Record payment form — only shown when unpaid members remain ── -->
    <mat-card class="record-card" *ngIf="!summary?.allPaid">
      <mat-card-header>
        <mat-icon mat-card-avatar>add_circle</mat-icon>
        <mat-card-title>Record Payment</mat-card-title>
        <mat-card-subtitle>
          {{ summary?.totalUnpaid || 0 }} member(s) still unpaid for Month {{ selectedMonth }}
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="paymentForm" (ngSubmit)="submitPayment()" class="payment-form">

          <!-- Dropdown: only unpaid members for this month -->
          <mat-form-field appearance="outline">
            <mat-label>Member (unpaid only)</mat-label>
            <mat-select formControlName="memberId">
              <mat-option *ngFor="let m of summary?.unpaid" [value]="m.memberId">
                {{ m.firstName }} {{ m.lastName }} — Slot {{ m.slotNumber }} ($ {{ m.monthlyAmount }}/mo)
              </mat-option>
            </mat-select>
            <mat-hint *ngIf="!summary?.unpaid?.length">Loading members…</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Amount Submitted</mat-label>
            <input matInput type="number" formControlName="submittedAmount" />
            <span matPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field appearance="outline" class="wide">
            <mat-label>Notes (optional)</mat-label>
            <input matInput formControlName="notes" />
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit" [disabled]="paymentForm.invalid || submitting">
            <mat-spinner *ngIf="submitting" diameter="20" class="btn-spinner"></mat-spinner>
            <mat-icon *ngIf="!submitting">save</mat-icon>
            {{ submitting ? 'Saving...' : 'Record Payment' }}
          </button>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- ── Unpaid members list ── -->
    <mat-card class="unpaid-card" *ngIf="(summary?.totalUnpaid || 0) > 0">
      <mat-card-header>
        <mat-icon mat-card-avatar>hourglass_empty</mat-icon>
        <mat-card-title>Waiting for Payment — {{ summary.totalUnpaid }} member(s)</mat-card-title>
        <mat-card-subtitle>These members have not submitted payment for Month {{ selectedMonth }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="member-grid">
          <div class="member-pill" *ngFor="let m of summary.unpaid">
            <div class="pill-avatar">{{ m.firstName[0] }}</div>
            <div class="pill-info">
              <div class="pill-name">{{ m.firstName }} {{ m.lastName }}</div>
              <div class="pill-sub">Slot {{ m.slotNumber }} · $ {{ m.monthlyAmount }}/mo</div>
            </div>
            <span class="pill-badge pending">Pending</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- ── Recorded payments table ── -->
    <mat-card>
      <mat-card-header>
        <mat-icon mat-card-avatar>receipt_long</mat-icon>
        <mat-card-title>Recorded Payments — Month {{ selectedMonth }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-loading-spinner *ngIf="loading"></app-loading-spinner>

        <div class="empty-payments" *ngIf="!loading && payments.length === 0">
          <mat-icon>inbox</mat-icon>
          <p>No payments recorded for Month {{ selectedMonth }} yet.</p>
        </div>

        <table mat-table [dataSource]="payments" class="payments-table" *ngIf="!loading && payments.length > 0">
          <ng-container matColumnDef="member">
            <th mat-header-cell *matHeaderCellDef>Member</th>
            <td mat-cell *matCellDef="let p">
              <strong>{{ p.member?.firstName }} {{ p.member?.lastName }}</strong>
              <div class="sub-text">{{ p.member?.email }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="slot">
            <th mat-header-cell *matHeaderCellDef>Slot</th>
            <td mat-cell *matCellDef="let p">{{ p.slot?.label }}</td>
          </ng-container>
          <ng-container matColumnDef="expected">
            <th mat-header-cell *matHeaderCellDef>Expected</th>
            <td mat-cell *matCellDef="let p">$ {{ p.expectedAmount | number }}</td>
          </ng-container>
          <ng-container matColumnDef="submitted">
            <th mat-header-cell *matHeaderCellDef>Submitted</th>
            <td mat-cell *matCellDef="let p">$ {{ p.submittedAmount | number }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let p"><app-status-badge [status]="p.status"></app-status-badge></td>
          </ng-container>
          <ng-container matColumnDef="timeliness">
            <th mat-header-cell *matHeaderCellDef>Timeliness</th>
            <td mat-cell *matCellDef="let p"><app-status-badge [status]="p.timeliness"></app-status-badge></td>
          </ng-container>
          <ng-container matColumnDef="penalty">
            <th mat-header-cell *matHeaderCellDef>Penalty</th>
            <td mat-cell *matCellDef="let p">
              <span [class.text-danger]="p.penaltyAmount > 0">$ {{ p.penaltyAmount | number }}</span>
              <span *ngIf="p.daysLate > 0" class="days-late">({{ p.daysLate }}d late)</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button color="primary" (click)="approvePayment(p)" *ngIf="p.status === 'submitted'" matTooltip="Approve">
                <mat-icon>check_circle</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="rejectPayment(p)" *ngIf="p.status === 'submitted'" matTooltip="Reject">
                <mat-icon>cancel</mat-icon>
              </button>
              <span *ngIf="p.status === 'approved'" class="approved-text">✓ Approved</span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="paymentColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: paymentColumns;" [class]="'row-' + row.timeliness"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    /* ── Header ── */
    .page-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 2px; color: #1a237e; }
    .subtitle { margin: 0; color: #666; font-size: 13px; }
    .spacer { flex: 1; }
    .month-filter { width: 130px; }

    /* ── Summary ── */
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }

    /* ── All-paid banner ── */
    .all-paid-banner {
      display: flex; align-items: flex-start; gap: 14px;
      background: #e8f5e9; border: 1px solid #a5d6a7; border-radius: 12px;
      padding: 16px 20px; margin-bottom: 24px;
    }
    .all-paid-banner mat-icon { font-size: 30px; width: 30px; height: 30px; flex-shrink: 0; color: #43a047; margin-top: 1px; }
    .all-paid-banner strong { display: block; font-size: 15px; color: #2e7d32; margin-bottom: 3px; }
    .all-paid-banner span { font-size: 13px; color: #388e3c; }

    /* ── Record form ── */
    .record-card { margin-bottom: 24px; }
    .payment-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; padding: 8px 0; }
    .payment-form mat-form-field { min-width: 180px; }
    .payment-form .wide { min-width: 260px; }
    .btn-spinner { display: inline-block; vertical-align: middle; margin-right: 6px; }

    /* ── Unpaid list ── */
    .unpaid-card { margin-bottom: 24px; }
    .member-grid { display: flex; flex-direction: column; gap: 8px; }
    .member-pill {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; border-radius: 10px;
      background: #fff8e1; border: 1px solid #ffe082;
    }
    .pill-avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: #f57f17; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px;
    }
    .pill-info { flex: 1; min-width: 0; }
    .pill-name { font-size: 14px; font-weight: 600; color: #333; }
    .pill-sub { font-size: 12px; color: #888; }
    .pill-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 10px; flex-shrink: 0; }
    .pill-badge.pending { background: #fff3e0; color: #e65100; }

    /* ── Payments table ── */
    table { width: 100%; }
    .sub-text { font-size: 11px; color: #888; margin-top: 2px; }
    .text-danger { color: #c62828; font-weight: 600; }
    .days-late { font-size: 11px; color: #888; margin-left: 4px; }
    .approved-text { color: #2e7d32; font-size: 13px; font-weight: 600; }
    .row-late { background: #fff5f5; }
    .row-yellow_warning { background: #fffde7; }
    .row-strong_warning { background: #fff3e0; }
    .row-on_time { background: #f1f8e9; }
    .empty-payments { text-align: center; padding: 32px 16px; color: #aaa; }
    .empty-payments mat-icon { font-size: 40px; width: 40px; height: 40px; display: block; margin: 0 auto 8px; }
    .empty-payments p { margin: 0; font-size: 14px; }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      .payment-form mat-form-field, .payment-form .wide { min-width: 100%; }
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .summary-grid { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class MonthlyCollectionComponent implements OnInit {
  groupId = '';
  group: any = null;
  selectedMonth = 1;
  summary: any = null;    // { expectedTotal, totalExpected, totalPaid, totalUnpaid, allPaid, paid[], unpaid[] }
  summaryLoading = false;
  payments: Payment[] = [];
  loading = false;
  submitting = false;

  /** Formatted dollar total expected for the selected month */
  get expectedTotalDisplay(): string {
    const amt = this.summary?.expectedTotal ?? 0;
    return '$' + amt.toLocaleString();
  }

  /** "Month N — MonthName YYYY" for any cycle month, derived from group.startDate */
  getMonthLabel(monthNumber: number): string {
    if (!this.group?.startDate) return `Month ${monthNumber}`;
    const start = new Date(this.group.startDate);
    const d = new Date(start.getFullYear(), start.getMonth() + monthNumber - 1, 1);
    return `Month ${monthNumber} \u2014 ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }

  /** Label for the currently selected month */
  get selectedMonthLabel(): string {
    return this.getMonthLabel(this.selectedMonth);
  }

  paymentColumns = ['member', 'slot', 'expected', 'submitted', 'status', 'timeliness', 'penalty', 'actions'];
  paymentForm!: FormGroup;

  /** Only show months that exist (1 → currentMonth) */
  get availableMonths(): number[] {
    const max = this.group?.currentMonth || 1;
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private toast: ToastService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.paymentForm = this.fb.group({
      memberId: ['', Validators.required],
      submittedAmount: [null, [Validators.required, Validators.min(1)]],
      notes: [''],
    });
    this.loadGroup();
  }

  loadGroup(): void {
    this.api.getGroupDetails(this.groupId).subscribe({
      next: (res) => {
        this.group = res.data.group;
        this.selectedMonth = this.group.currentMonth || 1;
        this.loadData();
      },
    });
  }

  loadData(): void {
    this.loadSummary();
    this.loadPayments();
  }

  /** Fetch paid/unpaid breakdown for the selected month */
  loadSummary(): void {
    this.summaryLoading = true;
    this.api.getPaymentSummary(this.groupId, this.selectedMonth).subscribe({
      next: (res) => { this.summary = res.data; this.summaryLoading = false; },
      error: () => { this.summaryLoading = false; this.toast.error('Failed to load payment summary'); },
    });
  }

  /** Fetch full payment records for the table (approve/reject actions) */
  loadPayments(): void {
    this.loading = true;
    this.api.getPayments(this.groupId, { monthNumber: this.selectedMonth }).subscribe({
      next: (res) => { this.payments = res.data || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onMonthChange(month: number): void {
    this.selectedMonth = month;
    this.paymentForm.reset({ notes: '' });
    this.loadData();
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) return;
    this.submitting = true;
    const data = { ...this.paymentForm.value, monthNumber: this.selectedMonth };
    this.api.submitPayment(this.groupId, data).subscribe({
      next: () => {
        this.toast.success('Payment recorded');
        this.submitting = false;
        this.paymentForm.reset({ notes: '' });
        this.loadData(); // refreshes both summary + table
      },
      error: (err) => {
        this.submitting = false;
        this.toast.error(err.error?.message || 'Failed to record payment');
      },
    });
  }

  approvePayment(payment: Payment): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Approve Payment',
        message: `Approve $${payment.submittedAmount} from ${(payment.member as any)?.firstName}?`,
        confirmLabel: 'Approve',
      },
    }).afterClosed().subscribe((ok) => {
      if (ok) {
        this.api.approvePayment(payment._id).subscribe({
          next: () => { this.toast.success('Payment approved'); this.loadData(); },
          error: (err) => { this.toast.error(err.error?.message || 'Failed'); },
        });
      }
    });
  }

  rejectPayment(payment: Payment): void {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.api.rejectPayment(payment._id, { rejectionReason: reason }).subscribe({
      next: () => { this.toast.warning('Payment rejected'); this.loadData(); },
      error: (err) => { this.toast.error(err.error?.message || 'Failed'); },
    });
  }
}
