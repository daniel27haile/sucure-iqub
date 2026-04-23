import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

/**
 * Admin Detail page — Super Admin only.
 * Shows a single admin's profile, stats, and their groups.
 * Supports inline edit, suspend/reactivate, and delete.
 */
@Component({
  selector: 'app-admin-detail',
  template: `
    <div class="page-header">
      <button mat-icon-button [routerLink]="['/super-admin/admins']">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <div class="header-text">
        <h1>Admin Detail</h1>
        <p class="subtitle" *ngIf="admin">{{ admin.email }}</p>
      </div>
      <div class="header-actions" *ngIf="admin">
        <button mat-stroked-button color="accent" (click)="startEdit()" *ngIf="!editing">
          <mat-icon>edit</mat-icon> Edit
        </button>
        <button mat-stroked-button [color]="admin.isActive ? 'warn' : 'primary'" (click)="toggleStatus()">
          <mat-icon>{{ admin.isActive ? 'block' : 'check_circle' }}</mat-icon>
          {{ admin.isActive ? 'Suspend' : 'Reactivate' }}
        </button>
        <button mat-stroked-button color="warn" (click)="deleteAdmin()">
          <mat-icon>delete</mat-icon> Delete
        </button>
      </div>
    </div>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>

    <ng-container *ngIf="!loading && admin">

      <!-- Inline edit form -->
      <mat-card class="edit-panel" *ngIf="editing">
        <mat-card-header>
          <mat-icon mat-card-avatar>edit</mat-icon>
          <mat-card-title>Edit Admin</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="edit-form">
            <mat-form-field appearance="outline"><mat-label>First Name</mat-label><input matInput formControlName="firstName" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Last Name</mat-label><input matInput formControlName="lastName" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Email</mat-label><input matInput type="email" formControlName="email" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Phone</mat-label><input matInput formControlName="phone" /></mat-form-field>
            <div class="edit-actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="editForm.invalid || saving">
                <mat-icon>save</mat-icon> Save
              </button>
              <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Profile + stats -->
      <div class="profile-grid">
        <mat-card class="profile-card">
          <mat-card-content>
            <div class="profile-header">
              <div class="profile-avatar">{{ admin.firstName[0] }}{{ admin.lastName[0] }}</div>
              <div class="profile-info">
                <h2>{{ admin.firstName }} {{ admin.lastName }}</h2>
                <div class="profile-email"><mat-icon>email</mat-icon> {{ admin.email }}</div>
                <div class="profile-phone" *ngIf="admin.phone"><mat-icon>phone</mat-icon> {{ admin.phone }}</div>
                <div class="profile-since"><mat-icon>calendar_today</mat-icon> Member since {{ admin.createdAt | date:'mediumDate' }}</div>
              </div>
            </div>
            <div class="profile-status" [class.active]="admin.isActive" [class.suspended]="!admin.isActive">
              <mat-icon>{{ admin.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
              {{ admin.isActive ? 'Active' : 'Suspended' }}
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Stats cards -->
        <div class="stats-grid">
          <app-stat-card label="Total Groups" [value]="stats?.totalGroups || 0" icon="group_work" color="blue"></app-stat-card>
          <app-stat-card label="Active Groups" [value]="stats?.activeGroups || 0" icon="play_circle" color="green"></app-stat-card>
          <app-stat-card label="Total Members" [value]="stats?.totalMembers || 0" icon="people" color="purple"></app-stat-card>
          <app-stat-card label="Total Slots" [value]="stats?.totalSlots || 0" icon="view_module" color="orange"></app-stat-card>
        </div>
      </div>

      <!-- Groups list -->
      <mat-card class="groups-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>group_work</mat-icon>
          <mat-card-title>Groups Managed</mat-card-title>
          <mat-card-subtitle>{{ groups.length }} group(s)</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="empty-state" *ngIf="groups.length === 0">
            <p>This admin hasn't created any groups yet.</p>
          </div>
          <div class="groups-list" *ngIf="groups.length > 0">
            <div class="group-row" *ngFor="let g of groups">
              <div class="group-info">
                <span class="group-name">{{ g.name }}</span>
                <span class="group-month">Month {{ g.currentMonth }}/{{ g.cycleLength }}</span>
              </div>
              <app-status-badge [status]="g.status"></app-status-badge>
              <div class="group-date">{{ g.createdAt | date:'mediumDate' }}</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </ng-container>
  `,
  styles: [`
    .page-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .header-text { flex: 1; }
    .header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    h1 { font-size: 22px; font-weight: 700; margin: 0; color: #1a237e; }
    .subtitle { color: #888; font-size: 13px; margin: 2px 0 0; }
    .edit-panel { margin-bottom: 24px; border: 2px solid #1565c0; }
    .edit-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-start; padding: 8px 0; }
    .edit-form mat-form-field { min-width: 200px; }
    .edit-actions { display: flex; gap: 8px; align-items: center; align-self: center; }
    .profile-grid { display: grid; grid-template-columns: 340px 1fr; gap: 20px; margin-bottom: 20px; }
    .profile-card mat-card-content { padding: 20px; }
    .profile-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
    .profile-avatar { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #1a237e, #1565c0);
                       color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; flex-shrink: 0; }
    .profile-info h2 { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
    .profile-email, .profile-phone, .profile-since { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #666; margin-bottom: 4px; }
    .profile-email mat-icon, .profile-phone mat-icon, .profile-since mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .profile-status { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; padding: 6px 10px; border-radius: 6px; }
    .profile-status.active { background: #e8f5e9; color: #2e7d32; }
    .profile-status.suspended { background: #ffebee; color: #c62828; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .groups-card mat-card-content { padding: 0 16px 16px; }
    .groups-list { display: flex; flex-direction: column; gap: 2px; }
    .group-row { display: flex; align-items: center; gap: 16px; padding: 12px 8px; border-radius: 6px; }
    .group-row:hover { background: #f5f7fa; }
    .group-info { flex: 1; }
    .group-name { font-size: 14px; font-weight: 600; }
    .group-month { font-size: 12px; color: #888; margin-left: 8px; }
    .group-date { font-size: 12px; color: #aaa; }
    .empty-state p { color: #888; padding: 20px 0; }
    @media (max-width: 900px) { .profile-grid { grid-template-columns: 1fr; } }
  `],
})
export class AdminDetailComponent implements OnInit {
  admin: any = null;
  stats: any = null;
  groups: any[] = [];
  loading = true;
  editing = false;
  saving = false;
  editForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
    private dialog: MatDialog,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    });
    const id = this.route.snapshot.paramMap.get('adminId')!;
    this.load(id);
  }

  private load(id: string): void {
    this.loading = true;
    this.api.getAdminDetail(id).subscribe({
      next: (res) => {
        this.admin = res.data.admin;
        this.stats = res.data.stats;
        this.groups = res.data.groups || [];
        this.loading = false;
      },
      error: () => { this.loading = false; this.toast.error('Failed to load admin detail'); },
    });
  }

  startEdit(): void {
    this.editForm.patchValue({
      firstName: this.admin.firstName,
      lastName: this.admin.lastName,
      email: this.admin.email,
      phone: this.admin.phone || '',
    });
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
    this.editForm.reset();
  }

  saveEdit(): void {
    if (this.editForm.invalid) return;
    this.saving = true;
    this.api.updateAdmin(this.admin._id, this.editForm.value).subscribe({
      next: (res) => {
        this.admin = { ...this.admin, ...res.data };
        this.saving = false;
        this.editing = false;
        this.editForm.reset();
        this.toast.success('Admin updated');
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err.error?.message || 'Failed to update admin');
      },
    });
  }

  toggleStatus(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.admin.isActive ? 'Suspend Admin' : 'Reactivate Admin',
        message: this.admin.isActive
          ? `Suspend <strong>${this.admin.firstName} ${this.admin.lastName}</strong>? Their active groups will also be suspended.`
          : `Reactivate <strong>${this.admin.firstName} ${this.admin.lastName}</strong>? Their suspended groups will be reactivated.`,
        confirmLabel: this.admin.isActive ? 'Suspend' : 'Reactivate',
        danger: this.admin.isActive,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api.toggleAdminStatus(this.admin._id).subscribe({
        next: (res) => {
          this.admin = { ...this.admin, isActive: res.data.isActive };
          this.toast.info(`Admin ${this.admin.isActive ? 'reactivated' : 'suspended'}`);
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to toggle status'),
      });
    });
  }

  deleteAdmin(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Admin',
        message: `Permanently delete <strong>${this.admin.firstName} ${this.admin.lastName}</strong>?<br><br>
          Their groups, members, and payment records will be preserved but the account will be disabled.`,
        confirmLabel: 'Delete',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.api.deleteAdmin(this.admin._id).subscribe({
        next: () => {
          this.toast.success('Admin deleted');
          this.router.navigate(['/super-admin/admins']);
        },
        error: (err) => this.toast.error(err.error?.message || 'Failed to delete admin'),
      });
    });
  }
}
