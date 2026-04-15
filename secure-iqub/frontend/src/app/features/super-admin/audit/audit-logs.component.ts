import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-audit-logs',
  template: `
    <div class="page-header">
      <h1>Audit Logs</h1>
      <p>Immutable record of all critical platform actions</p>
    </div>

    <mat-card>
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Filter by action</mat-label>
            <input matInput [(ngModel)]="actionFilter" (ngModelChange)="loadLogs()" placeholder="e.g. spin_completed" />
          </mat-form-field>
        </div>

        <app-loading-spinner *ngIf="loading"></app-loading-spinner>

        <table mat-table [dataSource]="logs" *ngIf="!loading" class="audit-table">
          <ng-container matColumnDef="timestamp">
            <th mat-header-cell *matHeaderCellDef>Timestamp</th>
            <td mat-cell *matCellDef="let l">{{ l.createdAt | date:'medium' }}</td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Action</th>
            <td mat-cell *matCellDef="let l">
              <code class="action-code">{{ l.action }}</code>
              <span *ngIf="l.isOverride" class="override-badge">OVERRIDE</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="performer">
            <th mat-header-cell *matHeaderCellDef>Performed By</th>
            <td mat-cell *matCellDef="let l">
              {{ l.performedBy?.firstName }} {{ l.performedBy?.lastName }}
              <span class="role-tag">{{ l.performedByRole }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="resource">
            <th mat-header-cell *matHeaderCellDef>Resource</th>
            <td mat-cell *matCellDef="let l">{{ l.targetResource }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;" [class.override-row]="row.isOverride"></tr>
        </table>

        <div class="pagination">
          <button mat-button [disabled]="page <= 1" (click)="prevPage()"><mat-icon>chevron_left</mat-icon> Prev</button>
          <span>Page {{ page }}</span>
          <button mat-button (click)="nextPage()">Next <mat-icon>chevron_right</mat-icon></button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    p { color: #666; margin: 0; }
    .filters { margin-bottom: 16px; }
    table { width: 100%; }
    .action-code { background: #f5f5f5; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
    .override-badge { background: #ffcdd2; color: #c62828; padding: 1px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; margin-left: 6px; }
    .role-tag { background: #e8eaf6; color: #3949ab; padding: 1px 8px; border-radius: 10px; font-size: 10px; margin-left: 6px; }
    .override-row { background: #fff8f8; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px 0; }
  `],
})
export class AuditLogsComponent implements OnInit {
  logs: any[] = [];
  loading = true;
  page = 1;
  limit = 50;
  actionFilter = '';
  cols = ['timestamp', 'action', 'performer', 'resource'];

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadLogs(); }

  loadLogs(): void {
    this.loading = true;
    const params: any = { page: this.page, limit: this.limit };
    if (this.actionFilter) params.action = this.actionFilter;
    this.api.getAuditLogs(params).subscribe({
      next: (res) => { this.logs = res.data || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  prevPage(): void { if (this.page > 1) { this.page--; this.loadLogs(); } }
  nextPage(): void { this.page++; this.loadLogs(); }
}
