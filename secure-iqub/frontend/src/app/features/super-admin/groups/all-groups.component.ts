import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-all-groups',
  template: `
    <div class="page-header">
      <h1>All Groups</h1>
      <mat-form-field appearance="outline" class="status-filter">
        <mat-label>Filter by status</mat-label>
        <mat-select [value]="statusFilter" (selectionChange)="statusFilter = $event.value; loadGroups()">
          <mat-option value="">All</mat-option>
          <mat-option value="draft">Draft</mat-option>
          <mat-option value="active">Active</mat-option>
          <mat-option value="completed">Completed</mat-option>
          <mat-option value="suspended">Suspended</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>

    <mat-card *ngIf="!loading">
      <mat-card-content>
        <table mat-table [dataSource]="groups" class="full-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Group</th>
            <td mat-cell *matCellDef="let g"><strong>{{ g.name }}</strong><br><span class="sub">{{ g.description }}</span></td>
          </ng-container>
          <ng-container matColumnDef="admin">
            <th mat-header-cell *matHeaderCellDef>Admin</th>
            <td mat-cell *matCellDef="let g">{{ g.admin?.firstName }} {{ g.admin?.lastName }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let g"><app-status-badge [status]="g.status"></app-status-badge></td>
          </ng-container>
          <ng-container matColumnDef="month">
            <th mat-header-cell *matHeaderCellDef>Month</th>
            <td mat-cell *matCellDef="let g">{{ g.currentMonth }}/{{ g.cycleLength }}</td>
          </ng-container>
          <ng-container matColumnDef="pool">
            <th mat-header-cell *matHeaderCellDef>Pool</th>
            <td mat-cell *matCellDef="let g">$ {{ g.monthlyPool | number }}/mo</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let g">
              <button mat-icon-button color="warn" (click)="suspendGroup(g)" *ngIf="g.status === 'active'" matTooltip="Suspend Group">
                <mat-icon>pause_circle</mat-icon>
              </button>
              <button mat-icon-button color="primary" (click)="reactivateGroup(g)" *ngIf="g.status === 'suspended'" matTooltip="Reactivate Group">
                <mat-icon>play_circle</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0; }
    .status-filter { width: 200px; }
    table { width: 100%; }
    .sub { font-size: 11px; color: #888; }
  `],
})
export class AllGroupsComponent implements OnInit {
  groups: any[] = [];
  loading = true;
  statusFilter = '';
  cols = ['name', 'admin', 'status', 'month', 'pool', 'actions'];

  constructor(private api: ApiService, private toast: ToastService, private dialog: MatDialog) {}

  ngOnInit(): void { this.loadGroups(); }

  loadGroups(): void {
    this.loading = true;
    const params: any = {};
    if (this.statusFilter) params.status = this.statusFilter;
    this.api.getAllGroups(params).subscribe({
      next: (res) => { this.groups = res.data || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  suspendGroup(group: any): void {
    const reason = prompt(`Suspend "${group.name}"? Enter reason:`);
    if (!reason) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Suspend Group', message: `Suspend <strong>${group.name}</strong>?<br>Reason: ${reason}`, danger: true, confirmLabel: 'Suspend' },
    }).afterClosed().subscribe((ok) => {
      if (ok) {
        this.api.suspendGroup(group._id, { reason }).subscribe({
          next: () => { this.toast.warning('Group suspended'); this.loadGroups(); },
          error: (err) => { this.toast.error(err.error?.message || 'Failed'); },
        });
      }
    });
  }

  reactivateGroup(group: any): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Reactivate Group', message: `Reactivate <strong>${group.name}</strong>? This will restore the group to active status.`, confirmLabel: 'Reactivate' },
    }).afterClosed().subscribe((ok) => {
      if (ok) {
        this.api.reactivateGroup(group._id).subscribe({
          next: () => { this.toast.success('Group reactivated'); this.loadGroups(); },
          error: (err) => { this.toast.error(err.error?.message || 'Failed to reactivate'); },
        });
      }
    });
  }
}
