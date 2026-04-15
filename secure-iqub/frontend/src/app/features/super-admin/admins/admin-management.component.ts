import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-management',
  template: `
    <div class="page-header">
      <h1>Admin Management</h1>
    </div>

    <!-- Create admin form -->
    <mat-card class="create-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>person_add</mat-icon>
        <mat-card-title>Create New Admin</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="createForm" (ngSubmit)="createAdmin()" class="create-form">
          <mat-form-field appearance="outline"><mat-label>First Name</mat-label><input matInput formControlName="firstName" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Last Name</mat-label><input matInput formControlName="lastName" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Password</mat-label><input matInput type="password" formControlName="password" /></mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="createForm.invalid || creating">
            <mat-icon>add</mat-icon> Create Admin
          </button>
        </form>
      </mat-card-content>
    </mat-card>

    <!-- Admins table -->
    <mat-card>
      <mat-card-header>
        <mat-icon mat-card-avatar>admin_panel_settings</mat-icon>
        <mat-card-title>Admins ({{ admins.length }})</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-loading-spinner *ngIf="loading"></app-loading-spinner>
        <table mat-table [dataSource]="admins" *ngIf="!loading" class="admins-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let a"><strong>{{ a.firstName }} {{ a.lastName }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let a">{{ a.email }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let a">
              <app-status-badge [status]="a.isActive ? 'active' : 'suspended'"></app-status-badge>
            </td>
          </ng-container>
          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let a">{{ a.createdAt | date:'mediumDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let a">
              <button mat-icon-button [color]="a.isActive ? 'warn' : 'primary'" (click)="toggleStatus(a)" [matTooltip]="a.isActive ? 'Suspend' : 'Activate'">
                <mat-icon>{{ a.isActive ? 'block' : 'check_circle' }}</mat-icon>
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
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0; }
    .create-card { margin-bottom: 24px; }
    .create-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; padding: 8px 0; }
    .create-form mat-form-field { min-width: 200px; }
    table { width: 100%; }
  `],
})
export class AdminManagementComponent implements OnInit {
  admins: any[] = [];
  loading = true;
  creating = false;
  cols = ['name', 'email', 'status', 'created', 'actions'];
  createForm!: FormGroup;

  constructor(private fb: FormBuilder, private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      firstName: ['', Validators.required], lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.api.getAdmins().subscribe({
      next: (res) => { this.admins = res.data || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  createAdmin(): void {
    if (this.createForm.invalid) return;
    this.creating = true;
    this.api.createAdmin(this.createForm.value).subscribe({
      next: () => { this.toast.success('Admin created'); this.creating = false; this.createForm.reset(); this.loadAdmins(); },
      error: (err) => { this.creating = false; this.toast.error(err.error?.message || 'Failed'); },
    });
  }

  toggleStatus(admin: any): void {
    this.api.toggleAdminStatus(admin._id).subscribe({
      next: (res) => { admin.isActive = res.data.isActive; this.toast.info(`Admin ${admin.isActive ? 'activated' : 'suspended'}`); },
    });
  }
}
