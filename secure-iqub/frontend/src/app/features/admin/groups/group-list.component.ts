import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Group } from '../../../core/models/group.model';

@Component({
  selector: 'app-group-list',
  template: `
    <div class="page-header">
      <h1>My Groups</h1>
      <button mat-raised-button color="primary" routerLink="/admin/groups/new">
        <mat-icon>add</mat-icon> New Group
      </button>
    </div>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>

    <div class="groups-table-wrap" *ngIf="!loading">
      <div class="empty-state" *ngIf="groups.length === 0">
        <mat-icon>group_work</mat-icon>
        <h3>No groups yet</h3>
        <button mat-raised-button color="primary" routerLink="/admin/groups/new">Create your first group</button>
      </div>

      <table mat-table [dataSource]="groups" class="mat-elevation-z2" *ngIf="groups.length > 0">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Group Name</th>
          <td mat-cell *matCellDef="let g">
            <strong>{{ g.name }}</strong>
            <div class="sub-text">{{ g.description }}</div>
            <div class="suspended-note" *ngIf="g.status === 'suspended'">
              <mat-icon>pause_circle</mat-icon> Paused by Super Admin — contact them to reactivate
            </div>
          </td>
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
          <th mat-header-cell *matHeaderCellDef>Monthly Pool</th>
          <td mat-cell *matCellDef="let g">$ {{ g.monthlyPool | number }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let g">
            <button mat-icon-button [routerLink]="['/admin/groups', g._id]" matTooltip="View"><mat-icon>visibility</mat-icon></button>
            <button mat-icon-button [routerLink]="['/admin/groups', g._id, 'slots']" matTooltip="Manage Slots"><mat-icon>view_module</mat-icon></button>
            <button mat-icon-button [routerLink]="['/admin/groups', g._id, 'spin']" *ngIf="g.status === 'active'" matTooltip="Lucky Spin" color="accent"><mat-icon>casino</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0; color: #1a237e; }
    .groups-table-wrap { overflow: auto; }
    table { width: 100%; }
    .sub-text { font-size: 12px; color: #888; margin-top: 2px; }
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #bbb; }
    .empty-state h3 { font-size: 20px; margin: 16px 0 16px; color: #444; }
    .suspended-note { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #c62828; margin-top: 4px; }
    .suspended-note mat-icon { font-size: 13px; width: 13px; height: 13px; }
  `],
})
export class GroupListComponent implements OnInit {
  groups: Group[] = [];
  loading = true;
  displayedColumns = ['name', 'status', 'month', 'pool', 'actions'];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getMyGroups().subscribe({
      next: (res) => { this.groups = res.data || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
