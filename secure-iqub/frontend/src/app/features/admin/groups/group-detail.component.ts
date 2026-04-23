import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-group-detail',
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/admin/groups"><mat-icon>arrow_back</mat-icon></button>
      <div>
        <h1>{{ group?.name }}</h1>
        <app-status-badge *ngIf="group" [status]="group.status"></app-status-badge>
      </div>
      <span class="spacer"></span>
      <ng-container *ngIf="group?.status === 'draft'">
        <button mat-stroked-button [routerLink]="['/admin/groups', groupId, 'slots']">
          <mat-icon>view_module</mat-icon> Manage Slots
        </button>
        <button mat-raised-button color="primary" (click)="openActivateDialog()" [disabled]="!canActivate">
          <mat-icon>play_arrow</mat-icon> Activate Cycle
        </button>
      </ng-container>
    </div>

    <!-- Suspended banner — only when the group is genuinely suspended in the database -->
    <div class="suspended-banner" *ngIf="!loading && group?.status === 'suspended'">
      <mat-icon>pause_circle</mat-icon>
      <div>
        <strong>This group has been paused by Super Admin.</strong>
        <span>Ask your Super Admin to reactivate it from the All Groups management page.</span>
      </div>
    </div>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>

    <ng-container *ngIf="!loading && group">
      <!-- Summary cards -->
      <div class="stats-grid">
        <app-stat-card label="Monthly Pool" [value]="'$' + (group.monthlyPool | number)" icon="attach_money" color="green"></app-stat-card>
        <app-stat-card label="Slot Payout" [value]="'$' + (group.slotPayout | number)" icon="emoji_events" color="purple"></app-stat-card>
        <app-stat-card label="Current Month" [value]="group.currentMonth + '/' + group.cycleLength" icon="calendar_month" color="blue"></app-stat-card>
        <app-stat-card [label]="'Slots (' + slots.length + '/12)'" [value]="validSlots + ' valid'" icon="view_module" [color]="validSlots === 12 ? 'green' : 'orange'"></app-stat-card>
      </div>

      <!-- Activation requirements -->
      <mat-card class="requirements-card" *ngIf="group.status === 'draft'">
        <mat-card-header>
          <mat-icon mat-card-avatar [color]="canActivate ? 'primary' : 'warn'">{{ canActivate ? 'check_circle' : 'pending' }}</mat-icon>
          <mat-card-title>Activation Requirements</mat-card-title>
          <mat-card-subtitle>All must be met before you can start the cycle</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="req-list">
            <div class="req-item" [class.req-item--ok]="slots.length === 12">
              <mat-icon>{{ slots.length === 12 ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              <span>12 slots created ({{ slots.length }}/12)</span>
            </div>
            <div class="req-item" [class.req-item--ok]="validSlots === 12">
              <mat-icon>{{ validSlots === 12 ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              <span>All slots fully funded at $2,000/month ({{ validSlots }}/12 valid)</span>
            </div>
          </div>

          <!-- Activate form -->
          <form [formGroup]="activateForm" *ngIf="canActivate" class="activate-form">
            <mat-form-field appearance="outline">
              <mat-label>Cycle Start Date</mat-label>
              <input matInput type="date" formControlName="startDate" />
              <mat-hint>Month 1 will start on this date</mat-hint>
            </mat-form-field>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Slots overview -->
      <mat-card class="slots-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>view_module</mat-icon>
          <mat-card-title>Slots Overview</mat-card-title>
          <mat-card-subtitle>{{ slots.length }} of 12 slots configured</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <button mat-button [routerLink]="['/admin/groups', groupId, 'slots']">
            <mat-icon>edit</mat-icon> Manage Slots
          </button>
        </mat-card-actions>
        <mat-card-content>
          <table mat-table [dataSource]="slots" class="slots-table">
            <ng-container matColumnDef="slotNumber">
              <th mat-header-cell *matHeaderCellDef>#</th>
              <td mat-cell *matCellDef="let s">{{ s.slotNumber }}</td>
            </ng-container>
            <ng-container matColumnDef="label">
              <th mat-header-cell *matHeaderCellDef>Label</th>
              <td mat-cell *matCellDef="let s">{{ s.label }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Monthly</th>
              <td mat-cell *matCellDef="let s">
                $ {{ s.assignedMonthlyAmount | number }} / $ {{ s.requiredMonthlyAmount | number }}
              </td>
            </ng-container>
            <ng-container matColumnDef="members">
              <th mat-header-cell *matHeaderCellDef>Members</th>
              <td mat-cell *matCellDef="let s">{{ s.members?.length || 0 }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let s"><app-status-badge [status]="s.status"></app-status-badge></td>
            </ng-container>
            <ng-container matColumnDef="won">
              <th mat-header-cell *matHeaderCellDef>Won</th>
              <td mat-cell *matCellDef="let s">
                <span *ngIf="s.wonInMonth">Month {{ s.wonInMonth }} 🏆</span>
                <span *ngIf="!s.wonInMonth" class="text-muted">—</span>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="slotColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: slotColumns;" [class.won-row]="row.status === 'won'"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </ng-container>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; color: #1a237e; }
    .spacer { flex: 1; }
    .suspended-banner {
      display: flex; align-items: flex-start; gap: 10px;
      background: #fff3e0; border: 1px solid #ffb300; border-radius: 10px;
      padding: 14px 16px; margin-bottom: 20px; color: #e65100;
    }
    .suspended-banner mat-icon { font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 1px; }
    .suspended-banner strong { display: block; font-size: 14px; }
    .suspended-banner span { font-size: 12px; color: #bf360c; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .requirements-card, .slots-card { margin-bottom: 24px; }
    .req-list { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
    .req-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #555; }
    .req-item mat-icon { color: #bbb; }
    .req-item--ok mat-icon { color: #4caf50; }
    .req-item--ok { color: #2e7d32; }
    .activate-form { margin-top: 20px; }
    table { width: 100%; }
    .won-row { background: #f3e5f5; }
    .text-muted { color: #aaa; }
  `],
})
export class GroupDetailComponent implements OnInit {
  group: any = null;
  slots: any[] = [];
  loading = true;
  groupId = '';
  activateForm!: FormGroup;

  slotColumns = ['slotNumber', 'label', 'amount', 'members', 'status', 'won'];

  constructor(
    private route: ActivatedRoute, private api: ApiService,
    private toast: ToastService, private dialog: MatDialog, private fb: FormBuilder
  ) {}

  get validSlots(): number { return this.slots.filter((s) => s.status === 'valid' || s.status === 'eligible').length; }
  get canActivate(): boolean { return this.slots.length === 12 && this.validSlots === 12; }

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.activateForm = this.fb.group({ startDate: ['', Validators.required] });
    this.loadGroup();
  }

  loadGroup(): void {
    this.api.getGroupDetails(this.groupId).subscribe({
      next: (res) => {
        this.group = res.data.group;
        this.slots = res.data.slots;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  openActivateDialog(): void {
    if (this.activateForm.invalid) { this.toast.warning('Please set a start date.'); return; }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Activate Cycle',
        message: `<strong>This will lock all slot configurations and begin Month 1.</strong><br><br>
          Monthly pool: $24,000 | Slot payout: $24,000<br>
          Start date: ${this.activateForm.value.startDate}<br><br>
          This action cannot be undone without super admin override.`,
        confirmLabel: 'Activate',
      },
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.activateCycle();
    });
  }

  activateCycle(): void {
    this.api.activateCycle(this.groupId, this.activateForm.value).subscribe({
      next: () => { this.toast.success('Cycle activated! Month 1 is now open.'); this.loadGroup(); },
      error: (err) => { this.toast.error(err.error?.message || 'Activation failed'); },
    });
  }
}
