import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

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

    <!-- Inline edit panel -->
    <mat-card class="edit-panel" *ngIf="editingAdmin">
      <mat-card-header>
        <mat-icon mat-card-avatar>edit</mat-icon>
        <mat-card-title>Edit Admin — {{ editingAdmin.firstName }} {{ editingAdmin.lastName }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="create-form">
          <mat-form-field appearance="outline"><mat-label>First Name</mat-label><input matInput formControlName="firstName" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Last Name</mat-label><input matInput formControlName="lastName" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Phone</mat-label><input matInput formControlName="phone" /></mat-form-field>
          <div class="edit-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="editForm.invalid || saving">
              <mat-icon>save</mat-icon> Save Changes
            </button>
            <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
          </div>
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
              <span class="status-badge" [class.badge-active]="a.isActive" [class.badge-suspended]="!a.isActive">
                {{ a.isActive ? 'Active' : 'Suspended' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="stats">
            <th mat-header-cell *matHeaderCellDef>Groups / Members</th>
            <td mat-cell *matCellDef="let a">
              <span class="stat-chip">{{ a.stats?.totalGroups ?? 0 }} groups</span>
              <span class="stat-chip">{{ a.stats?.totalMembers ?? 0 }} members</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let a">{{ a.createdAt | date:'mediumDate' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let a">
              <button mat-icon-button color="primary" (click)="viewAdmin(a)" matTooltip="View detail">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button color="accent" (click)="startEdit(a)" matTooltip="Edit admin">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button [color]="a.isActive ? 'warn' : 'primary'"
                      (click)="toggleStatus(a)"
                      [matTooltip]="a.isActive ? 'Suspend' : 'Reactivate'">
                <mat-icon>{{ a.isActive ? 'block' : 'check_circle' }}</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteAdmin(a)" matTooltip="Delete admin">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;" [class.row-editing]="editingAdmin?._id === row._id"></tr>
        </table>
        <div class="empty-state" *ngIf="!loading && admins.length === 0">
          <mat-icon>admin_panel_settings</mat-icon>
          <p>No admins found.</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0; }
    .create-card { margin-bottom: 24px; }
    .edit-panel { margin-bottom: 24px; border: 2px solid #1565c0; }
    .create-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; padding: 8px 0; }
    .create-form mat-form-field { min-width: 200px; }
    .edit-actions { display: flex; gap: 8px; align-items: center; align-self: center; }
    table { width: 100%; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-active { background: #e8f5e9; color: #2e7d32; }
    .badge-suspended { background: #ffebee; color: #c62828; }
    .stat-chip { display: inline-block; background: #f1f3f4; border-radius: 10px; padding: 2px 8px; font-size: 11px; color: #555; margin-right: 4px; }
    .row-editing { background: #e3f2fd; }
    .empty-state { text-align: center; padding: 40px; color: #aaa; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 8px; }
  `],
})
export class AdminManagementComponent implements OnInit {
  admins: any[] = [];
  loading = true;
  creating = false;
  saving = false;
  editingAdmin: any = null;
  cols = ['name', 'email', 'status', 'stats', 'created', 'actions'];
  createForm!: FormGroup;
  editForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private toast: ToastService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.createForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    });
    this.loadAdmins();
  }

  loadAdmins(): void {
    this.loading = true;
    this.api.getAdmins().subscribe({
      next: (res) => { this.admins = res.data || []; this.loading = false; },
      error: () => { this.loading = false; this.toast.error('Failed to load admins'); },
    });
  }

  createAdmin(): void {
    if (this.createForm.invalid) return;
    this.creating = true;
    this.api.createAdmin(this.createForm.value).subscribe({
      next: () => {
        this.toast.success('Admin created');
        this.creating = false;
        this.createForm.reset();
        this.loadAdmins();
      },
      error: (err) => {
        this.creating = false;
        this.toast.error(err.error?.message || 'Failed to create admin');
      },
    });
  }

  viewAdmin(admin: any): void {
    this.router.navigate(['/super-admin/admins', admin._id]);
  }

  startEdit(admin: any): void {
    this.editingAdmin = admin;
    this.editForm.patchValue({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      phone: admin.phone || '',
    });
    setTimeout(() => {
      document.querySelector('.edit-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  cancelEdit(): void {
    this.editingAdmin = null;
    this.editForm.reset();
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.editingAdmin) return;
    this.saving = true;
    this.api.updateAdmin(this.editingAdmin._id, this.editForm.value).subscribe({
      next: (res) => {
        const updated = res.data;
        const idx = this.admins.findIndex((a) => a._id === this.editingAdmin._id);
        if (idx !== -1) this.admins[idx] = { ...this.admins[idx], ...updated };
        this.saving = false;
        this.editingAdmin = null;
        this.editForm.reset();
        this.toast.success('Admin updated');
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err.error?.message || 'Failed to update admin');
      },
    });
  }

  toggleStatus(admin: any): void {
    const action = admin.isActive ? 'suspend' : 'reactivate';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: admin.isActive ? 'Suspend Admin' : 'Reactivate Admin',
        message: admin.isActive
          ? `Suspend <strong>${admin.firstName} ${admin.lastName}</strong>? Their active groups will also be suspended.`
          : `Reactivate <strong>${admin.firstName} ${admin.lastName}</strong>? Their suspended groups will be reactivated.`,
        confirmLabel: admin.isActive ? 'Suspend' : 'Reactivate',
        danger: admin.isActive,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api.toggleAdminStatus(admin._id).subscribe({
        next: () => {
          this.toast.info(`Admin ${action}d`);
          this.loadAdmins();
        },
        error: (err) => this.toast.error(err.error?.message || `Failed to ${action} admin`),
      });
    });
  }

  deleteAdmin(admin: any): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Admin',
        message: `Permanently delete <strong>${admin.firstName} ${admin.lastName}</strong>?<br><br>
          Their groups, members, and payment records will be preserved but the account will be disabled.`,
        confirmLabel: 'Delete',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api.deleteAdmin(admin._id).subscribe({
        next: () => {
          this.toast.success('Admin deleted');
          if (this.editingAdmin?._id === admin._id) this.cancelEdit();
          this.loadAdmins();
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to delete admin'),
      });
    });
  }
}
