import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-my-payments',
  template: `
    <div class="page-header"><h1>My Payments</h1></div>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>

    <mat-card *ngIf="!loading">
      <mat-card-content>
        <div class="empty" *ngIf="payments.length === 0">No payment records yet.</div>
        <table mat-table [dataSource]="payments" *ngIf="payments.length > 0" class="full-table">
          <ng-container matColumnDef="group">
            <th mat-header-cell *matHeaderCellDef>Group</th>
            <td mat-cell *matCellDef="let p">{{ p.group?.name }}</td>
          </ng-container>
          <ng-container matColumnDef="month">
            <th mat-header-cell *matHeaderCellDef>Month</th>
            <td mat-cell *matCellDef="let p">Month {{ p.monthNumber }}</td>
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
              <span [class.red]="p.penaltyAmount > 0">$ {{ p.penaltyAmount | number }}</span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
        </table>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0; }
    table { width: 100%; }
    .red { color: #c62828; font-weight: 600; }
    .empty { padding: 40px; text-align: center; color: #888; }
  `],
})
export class MyPaymentsComponent implements OnInit {
  payments: any[] = [];
  loading = true;
  cols = ['group', 'month', 'expected', 'submitted', 'status', 'timeliness', 'penalty'];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getMyPayments().subscribe({
      next: (res) => { this.payments = res.data || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
