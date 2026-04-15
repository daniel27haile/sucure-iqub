import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Payment } from '../../../core/models/group.model';

@Component({
  selector: 'app-monthly-collection',
  template: `
    <div class="page-header">
      <button mat-icon-button [routerLink]="['/admin/groups', groupId]"><mat-icon>arrow_back</mat-icon></button>
      <div>
        <h1>Monthly Collection</h1>
        <p class="subtitle">Month {{ currentMonth }} — Due: $24,000</p>
      </div>
      <span class="spacer"></span>
      <mat-form-field appearance="outline" class="month-filter">
        <mat-label>Month</mat-label>
        <mat-select [value]="selectedMonth" (selectionChange)="selectedMonth = $event.value; loadPayments()">
          <mat-option *ngFor="let m of [1,2,3,4,5,6,7,8,9,10,11,12]" [value]="m">Month {{ m }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <!-- Summary cards -->
    <div class="summary-grid">
      <app-stat-card label="Expected" [value]="'$24,000'" icon="account_balance" color="blue"></app-stat-card>
      <app-stat-card label="Collected" [value]="'$' + (collectedAmount | number)" icon="check_circle" color="green"></app-stat-card>
      <app-stat-card label="Remaining" [value]="'$' + (remainingAmount | number)" icon="pending" [color]="remainingAmount > 0 ? 'orange' : 'green'"></app-stat-card>
      <app-stat-card label="Total Penalties" [value]="'$' + (totalPenalties | number)" icon="warning" color="red"></app-stat-card>
    </div>

    <!-- Record payment form -->
    <mat-card class="record-payment-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>add_circle</mat-icon>
        <mat-card-title>Record Payment</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="paymentForm" (ngSubmit)="submitPayment()" class="payment-form">
          <mat-form-field appearance="outline">
            <mat-label>Member</mat-label>
            <mat-select formControlName="memberId">
              <mat-option *ngFor="let m of members" [value]="m.member._id">
                {{ m.member.firstName }} {{ m.member.lastName }} — Slot {{ m.slot.slotNumber }} ($ {{ m.monthlyAmount }}/mo)
              </mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Amount Submitted</mat-label>
            <input matInput type="number" formControlName="submittedAmount" />
            <span matPrefix>$</span>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Month</mat-label>
            <input matInput type="number" formControlName="monthNumber" [value]="selectedMonth" readonly />
          </mat-form-field>
          <mat-form-field appearance="outline" class="wide">
            <mat-label>Notes (optional)</mat-label>
            <input matInput formControlName="notes" />
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="paymentForm.invalid">
            <mat-icon>save</mat-icon> Record Payment
          </button>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Payments table -->
    <mat-card>
      <mat-card-header>
        <mat-icon mat-card-avatar>list</mat-icon>
        <mat-card-title>Payment Status — Month {{ selectedMonth }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-loading-spinner *ngIf="loading"></app-loading-spinner>

        <table mat-table [dataSource]="payments" class="payments-table" *ngIf="!loading">
          <ng-container matColumnDef="member">
            <th mat-header-cell *matHeaderCellDef>Member</th>
            <td mat-cell *matCellDef="let p">
              <div class="member-cell">
                <strong>{{ p.member?.firstName }} {{ p.member?.lastName }}</strong>
                <div class="sub-text">{{ p.member?.email }}</div>
              </div>
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
    .page-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 2px; color: #1a237e; }
    .subtitle { margin: 0; color: #666; font-size: 13px; }
    .spacer { flex: 1; }
    .month-filter { width: 120px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .record-payment-card { margin-bottom: 24px; }
    .payment-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; padding: 8px 0; }
    .payment-form mat-form-field { min-width: 160px; }
    .payment-form .wide { min-width: 240px; }
    table { width: 100%; }
    .member-cell .sub-text { font-size: 11px; color: #888; }
    .text-danger { color: #c62828; font-weight: 600; }
    .days-late { font-size: 11px; color: #888; margin-left: 4px; }
    .approved-text { color: #2e7d32; font-size: 13px; font-weight: 600; }
    .row-late { background: #fff5f5; }
    .row-yellow_warning { background: #fffde7; }
    .row-strong_warning { background: #fff3e0; }
    .row-on_time { background: #f1f8e9; }
  `],
})
export class MonthlyCollectionComponent implements OnInit {
  groupId = '';
  currentMonth = 1;
  selectedMonth = 1;
  payments: Payment[] = [];
  members: any[] = [];
  loading = false;
  paymentColumns = ['member', 'slot', 'expected', 'submitted', 'status', 'timeliness', 'penalty', 'actions'];

  paymentForm!: FormGroup;

  get collectedAmount(): number {
    return this.payments.filter((p) => p.status === 'approved').reduce((s, p) => s + p.submittedAmount, 0);
  }
  get remainingAmount(): number { return 24000 - this.collectedAmount; }
  get totalPenalties(): number { return this.payments.reduce((s, p) => s + (p.penaltyWaived ? 0 : p.penaltyAmount), 0); }

  constructor(
    private route: ActivatedRoute, private api: ApiService,
    private toast: ToastService, private fb: FormBuilder, private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.paymentForm = this.fb.group({
      memberId: ['', Validators.required],
      submittedAmount: [null, [Validators.required, Validators.min(1)]],
      monthNumber: [this.selectedMonth, Validators.required],
      notes: [''],
    });
    this.loadMembers();
    this.loadPayments();
  }

  loadMembers(): void {
    this.api.listGroupMembers(this.groupId).subscribe({
      next: (res) => { this.members = res.data || []; },
    });
  }

  loadPayments(): void {
    this.loading = true;
    this.api.getPayments(this.groupId, { monthNumber: this.selectedMonth }).subscribe({
      next: (res) => { this.payments = res.data || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) return;
    const data = { ...this.paymentForm.value, monthNumber: this.selectedMonth };
    this.api.submitPayment(this.groupId, data).subscribe({
      next: () => { this.toast.success('Payment recorded'); this.loadPayments(); this.paymentForm.reset({ monthNumber: this.selectedMonth, notes: '' }); },
      error: (err) => { this.toast.error(err.error?.message || 'Failed to record payment'); },
    });
  }

  approvePayment(payment: Payment): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Approve Payment', message: `Approve $${payment.submittedAmount} from ${(payment.member as any)?.firstName}?`, confirmLabel: 'Approve' },
    }).afterClosed().subscribe((ok) => {
      if (ok) {
        this.api.approvePayment(payment._id).subscribe({
          next: () => { this.toast.success('Payment approved'); this.loadPayments(); },
          error: (err) => { this.toast.error(err.error?.message || 'Failed'); },
        });
      }
    });
  }

  rejectPayment(payment: Payment): void {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    this.api.rejectPayment(payment._id, { rejectionReason: reason }).subscribe({
      next: () => { this.toast.warning('Payment rejected'); this.loadPayments(); },
      error: (err) => { this.toast.error(err.error?.message || 'Failed'); },
    });
  }
}
