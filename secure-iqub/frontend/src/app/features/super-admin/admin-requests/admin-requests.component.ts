import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

/**
 * Admin Requests page — Super Admin only.
 * Displays all leader/admin applications from the landing page.
 * Allows: view, filter by status, update notes, approve (create admin account), reject, send welcome email.
 */
@Component({
  selector: 'app-admin-requests',
  template: `
    <div class="page-header">
      <div>
        <h1>Leader Applications</h1>
        <p class="subtitle">Review and manage Iqub leader / admin applications from the landing page</p>
      </div>
      <div class="header-counts" *ngIf="counts">
        <span class="count-chip count-chip--new">{{ counts.new }} New</span>
        <span class="count-chip count-chip--approved">{{ counts.converted }} Approved</span>
        <span class="count-chip count-chip--rejected">{{ counts.rejected }} Rejected</span>
      </div>
    </div>

    <!-- Filters -->
    <mat-card class="filter-bar">
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search by name, email, or phone</mat-label>
            <input matInput [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Search...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field appearance="outline" class="status-filter">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
              <mat-option value="">All</mat-option>
              <mat-option value="new">New</mat-option>
              <mat-option value="contacted">Contacted</mat-option>
              <mat-option value="approved">Approved</mat-option>
              <mat-option value="rejected">Rejected</mat-option>
              <mat-option value="converted">Converted</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card-content>
    </mat-card>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>

    <!-- Requests table -->
    <mat-card *ngIf="!loading">
      <mat-card-content>
        <div class="empty-state" *ngIf="requests.length === 0">
          <mat-icon>inbox</mat-icon>
          <h3>No applications found</h3>
          <p>Leader applications submitted from the landing page will appear here.</p>
        </div>

        <div class="request-list" *ngIf="requests.length > 0">
          <div class="request-row" *ngFor="let r of requests" (click)="openDetail(r)" [class]="'request-row--' + r.status">
            <div class="request-info">
              <div class="request-avatar">{{ r.fullName[0] }}</div>
              <div>
                <div class="request-name">{{ r.fullName }}</div>
                <div class="request-meta">{{ r.email }} {{ r.phone ? '· ' + r.phone : '' }}</div>
                <div class="request-location" *ngIf="r.location">
                  <mat-icon>location_on</mat-icon> {{ r.location }}
                </div>
              </div>
            </div>
            <div class="request-right">
              <span class="status-badge" [class]="'status-badge--' + r.status">{{ r.status }}</span>
              <div class="request-date">{{ r.createdAt | date:'mediumDate' }}</div>
              <div class="request-contact" *ngIf="r.preferredContactMethod">
                <mat-icon>{{ r.preferredContactMethod === 'phone' ? 'call' : r.preferredContactMethod === 'text' ? 'chat' : 'email' }}</mat-icon>
                {{ r.preferredContactMethod }}
              </div>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- ── Detail drawer / side panel ─────────────────────────────────────── -->
    <div class="detail-overlay" *ngIf="selectedRequest" (click)="closeDetail()">
      <div class="detail-panel" (click)="$event.stopPropagation()">
        <div class="detail-header">
          <div class="detail-avatar">{{ selectedRequest.fullName[0] }}</div>
          <div>
            <h2>{{ selectedRequest.fullName }}</h2>
            <div class="detail-meta">{{ selectedRequest.email }}</div>
            <span class="status-badge" [class]="'status-badge--' + selectedRequest.status">{{ selectedRequest.status }}</span>
          </div>
          <button mat-icon-button (click)="closeDetail()" class="close-btn"><mat-icon>close</mat-icon></button>
        </div>

        <div class="detail-body">
          <!-- Contact info -->
          <div class="detail-section">
            <h4>Contact Info</h4>
            <div class="info-row" *ngIf="selectedRequest.phone"><mat-icon>call</mat-icon> {{ selectedRequest.phone }}</div>
            <div class="info-row" *ngIf="selectedRequest.location"><mat-icon>location_on</mat-icon> {{ selectedRequest.location }}</div>
            <div class="info-row"><mat-icon>{{ selectedRequest.preferredContactMethod === 'phone' ? 'call' : 'email' }}</mat-icon>
              Prefers: {{ selectedRequest.preferredContactMethod || 'email' }}</div>
          </div>

          <!-- Message -->
          <div class="detail-section" *ngIf="selectedRequest.message">
            <h4>Applicant Message</h4>
            <p class="detail-message">{{ selectedRequest.message }}</p>
          </div>

          <!-- Timeline -->
          <div class="detail-section">
            <h4>Timeline</h4>
            <div class="timeline">
              <div class="timeline-item"><mat-icon>fiber_manual_record</mat-icon>
                Applied on {{ selectedRequest.createdAt | date:'medium' }}</div>
              <div class="timeline-item" *ngIf="selectedRequest.contactedAt">
                <mat-icon>call</mat-icon> Contacted {{ selectedRequest.contactedAt | date:'mediumDate' }}
              </div>
              <div class="timeline-item" *ngIf="selectedRequest.approvedAt">
                <mat-icon>check_circle</mat-icon> Approved {{ selectedRequest.approvedAt | date:'mediumDate' }}
                by {{ selectedRequest.approvedBy?.firstName }} {{ selectedRequest.approvedBy?.lastName }}
              </div>
              <div class="timeline-item" *ngIf="selectedRequest.rejectedAt">
                <mat-icon>cancel</mat-icon> Rejected {{ selectedRequest.rejectedAt | date:'mediumDate' }}
              </div>
            </div>
          </div>

          <!-- Converted admin account -->
          <div class="detail-section converted-admin" *ngIf="selectedRequest.convertedAdminId">
            <h4>Admin Account Created</h4>
            <div class="info-row"><mat-icon>person</mat-icon>
              {{ selectedRequest.convertedAdminId.firstName }} {{ selectedRequest.convertedAdminId.lastName }}
            </div>
            <div class="info-row"><mat-icon>email</mat-icon> {{ selectedRequest.convertedAdminId.email }}</div>
            <div class="info-row">
              <mat-icon>{{ selectedRequest.convertedAdminId.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
              {{ selectedRequest.convertedAdminId.isActive ? 'Active' : 'Suspended' }}
            </div>
            <div class="info-row" *ngIf="selectedRequest.emailSent">
              <mat-icon>mark_email_read</mat-icon> Welcome email sent {{ selectedRequest.emailSentAt | date:'mediumDate' }}
            </div>
          </div>

          <!-- Internal notes -->
          <div class="detail-section">
            <h4>Internal Notes</h4>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Add notes (visible to super admins only)</mat-label>
              <textarea matInput [(ngModel)]="editNotes" rows="3"></textarea>
            </mat-form-field>
            <button mat-stroked-button (click)="saveNotes()" [disabled]="savingNotes">
              {{ savingNotes ? 'Saving...' : 'Save Notes' }}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="detail-actions">
          <!-- Mark as contacted -->
          <button mat-stroked-button (click)="markContacted()"
            *ngIf="selectedRequest.status === 'new' || selectedRequest.status === 'contacted'"
            [disabled]="actionLoading">
            <mat-icon>call</mat-icon> Mark Contacted
          </button>

          <!-- Approve & create admin -->
          <button mat-raised-button color="primary" (click)="approveRequest()"
            *ngIf="selectedRequest.status !== 'converted' && selectedRequest.status !== 'rejected'"
            [disabled]="actionLoading">
            <mat-icon>how_to_reg</mat-icon> Approve & Create Admin
          </button>

          <!-- Reject -->
          <button mat-stroked-button color="warn" (click)="rejectRequest()"
            *ngIf="selectedRequest.status !== 'converted' && selectedRequest.status !== 'rejected'"
            [disabled]="actionLoading">
            <mat-icon>cancel</mat-icon> Reject
          </button>

          <!-- Resend welcome email -->
          <button mat-stroked-button (click)="resendEmail()"
            *ngIf="selectedRequest.status === 'converted'"
            [disabled]="actionLoading">
            <mat-icon>send</mat-icon> Resend Welcome Email
          </button>
        </div>
      </div>
    </div>

    <!-- Approve result dialog (shows temporary password) -->
    <div class="modal-overlay" *ngIf="approvalResult" (click)="approvalResult = null">
      <div class="approval-modal" (click)="$event.stopPropagation()">
        <div class="approval-success">
          <mat-icon>check_circle</mat-icon>
          <h2>Admin Account Created!</h2>
          <p>The following account has been created and a welcome email has been sent.</p>
        </div>
        <div class="credentials-box">
          <div class="cred-row"><span>Email:</span><strong>{{ approvalResult.admin?.email }}</strong></div>
          <div class="cred-row"><span>Temporary Password:</span>
            <strong class="temp-pass">{{ approvalResult.temporaryPassword }}</strong>
          </div>
          <p class="cred-warning">⚠️ This password is shown only once. The admin must change it after first login.</p>
        </div>
        <div class="approval-actions">
          <button mat-raised-button color="primary" (click)="approvalResult = null">Done</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    h1 { font-size: 24px; font-weight: 700; margin: 0; color: #1a237e; }
    .subtitle { color: #666; font-size: 13px; margin: 4px 0 0; }
    .header-counts { display: flex; gap: 8px; align-items: center; }
    .count-chip { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; }
    .count-chip--new { background: #e3f2fd; color: #1565c0; }
    .count-chip--approved { background: #e8f5e9; color: #2e7d32; }
    .count-chip--rejected { background: #ffebee; color: #c62828; }

    .filter-bar { margin-bottom: 20px; }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; }
    .search-field { flex: 1; min-width: 220px; }
    .status-filter { width: 160px; }

    /* Request list */
    .request-list { display: flex; flex-direction: column; gap: 2px; }
    .request-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px;
                   border-radius: 8px; cursor: pointer; transition: background .15s; border-left: 3px solid transparent; }
    .request-row:hover { background: #f5f7fa; }
    .request-row--new { border-left-color: #1565c0; }
    .request-row--contacted { border-left-color: #f57c00; }
    .request-row--approved { border-left-color: #2e7d32; }
    .request-row--converted { border-left-color: #6a1b9a; }
    .request-row--rejected { border-left-color: #c62828; opacity: .7; }
    .request-info { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
    .request-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #1a237e, #1565c0);
                       color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex-shrink: 0; }
    .request-name { font-size: 15px; font-weight: 600; color: #222; }
    .request-meta { font-size: 12px; color: #888; }
    .request-location { display: flex; align-items: center; gap: 2px; font-size: 12px; color: #666; }
    .request-location mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .request-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .request-date { font-size: 12px; color: #aaa; }
    .request-contact { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #888; }
    .request-contact mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Status badges */
    .status-badge { padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; }
    .status-badge--new { background: #e3f2fd; color: #1565c0; }
    .status-badge--contacted { background: #fff3e0; color: #e65100; }
    .status-badge--approved { background: #e8f5e9; color: #2e7d32; }
    .status-badge--converted { background: #f3e5f5; color: #6a1b9a; }
    .status-badge--rejected { background: #ffebee; color: #c62828; }

    /* Empty state */
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #bbb; }
    .empty-state h3 { font-size: 18px; color: #444; margin: 16px 0 8px; }
    .empty-state p { color: #888; }

    /* Detail panel */
    .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 200; display: flex; justify-content: flex-end; }
    .detail-panel { width: 460px; max-width: 100%; background: white; height: 100%; overflow-y: auto;
                     display: flex; flex-direction: column; box-shadow: -4px 0 32px rgba(0,0,0,.15); }
    .detail-header { display: flex; align-items: flex-start; gap: 16px; padding: 24px; border-bottom: 1px solid #eee; position: sticky; top: 0; background: white; z-index: 1; }
    .detail-avatar { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #1a237e, #1565c0);
                      color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; flex-shrink: 0; }
    .detail-header h2 { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
    .detail-meta { font-size: 13px; color: #888; margin-bottom: 6px; }
    .close-btn { margin-left: auto; }
    .detail-body { flex: 1; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
    .detail-section h4 { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #888; margin: 0 0 10px; font-weight: 700; }
    .info-row { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #444; margin-bottom: 6px; }
    .info-row mat-icon { font-size: 16px; width: 16px; height: 16px; color: #888; }
    .detail-message { background: #f9f9f9; border-radius: 8px; padding: 12px; font-size: 14px; color: #555; line-height: 1.5; margin: 0; }
    .timeline { display: flex; flex-direction: column; gap: 8px; }
    .timeline-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; }
    .timeline-item mat-icon { font-size: 16px; width: 16px; height: 16px; color: #1565c0; }
    .converted-admin { background: #f3e5f5; border-radius: 8px; padding: 12px; }
    .full-width { width: 100%; }

    .detail-actions { padding: 16px 24px; border-top: 1px solid #eee; display: flex; flex-wrap: wrap; gap: 10px; }

    /* Approval modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .approval-modal { background: white; border-radius: 16px; padding: 36px; max-width: 440px; width: 100%; }
    .approval-success { text-align: center; margin-bottom: 24px; }
    .approval-success mat-icon { font-size: 64px; width: 64px; height: 64px; color: #2e7d32; }
    .approval-success h2 { font-size: 22px; font-weight: 700; color: #1a237e; margin: 12px 0 8px; }
    .approval-success p { color: #666; }
    .credentials-box { background: #f0f4ff; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
    .cred-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .cred-row span { color: #888; }
    .temp-pass { font-family: monospace; background: #e8eaf6; padding: 4px 10px; border-radius: 4px; color: #1a237e; }
    .cred-warning { margin: 12px 0 0; font-size: 12px; color: #e65100; background: #fff3e0; padding: 8px 10px; border-radius: 6px; }
    .approval-actions { display: flex; justify-content: center; }
  `],
})
export class AdminRequestsComponent implements OnInit {
  requests: any[] = [];
  counts: any = null;
  loading = true;
  statusFilter = '';
  searchTerm = '';
  selectedRequest: any = null;
  editNotes = '';
  savingNotes = false;
  actionLoading = false;
  approvalResult: any = null;

  private searchTimer: any;

  constructor(private api: ApiService, private toast: ToastService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadCounts();
    this.loadRequests();
  }

  loadCounts(): void {
    this.api.getAdminRequestCounts().subscribe({ next: (r) => { this.counts = r.data; } });
  }

  loadRequests(): void {
    this.loading = true;
    const params: any = {};
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.searchTerm) params.search = this.searchTerm;

    this.api.getAdminRequests(params).subscribe({
      next: (res) => {
        this.requests = res.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onFilterChange(): void { this.loadRequests(); }

  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadRequests(), 350);
  }

  openDetail(request: any): void {
    // Fetch full detail to get populated fields
    this.api.getAdminRequest(request._id).subscribe({
      next: (res) => {
        this.selectedRequest = res.data;
        this.editNotes = res.data.notes || '';
      },
    });
  }

  closeDetail(): void {
    this.selectedRequest = null;
  }

  saveNotes(): void {
    if (!this.selectedRequest) return;
    this.savingNotes = true;
    this.api.updateAdminRequestStatus(this.selectedRequest._id, { notes: this.editNotes }).subscribe({
      next: (res) => {
        this.selectedRequest = { ...this.selectedRequest, notes: this.editNotes };
        this.savingNotes = false;
        this.toast.success('Notes saved');
      },
      error: () => { this.savingNotes = false; this.toast.error('Failed to save notes'); },
    });
  }

  markContacted(): void {
    this.actionLoading = true;
    this.api.updateAdminRequestStatus(this.selectedRequest._id, { status: 'contacted' }).subscribe({
      next: (res) => {
        this.selectedRequest = res.data;
        this.actionLoading = false;
        this.loadRequests();
        this.loadCounts();
        this.toast.success('Marked as contacted');
      },
      error: () => { this.actionLoading = false; this.toast.error('Action failed'); },
    });
  }

  approveRequest(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Approve & Create Admin Account',
        message: `<strong>${this.selectedRequest.fullName}</strong> will be granted admin access.<br><br>
          An admin account will be created with their email and a temporary password.<br>
          A welcome email will be sent automatically.`,
        confirmLabel: 'Approve & Create',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.actionLoading = true;
      this.api.approveAdminRequest(this.selectedRequest._id).subscribe({
        next: (res) => {
          this.approvalResult = res.data;
          this.actionLoading = false;
          this.selectedRequest = { ...this.selectedRequest, status: 'converted', convertedAdminId: res.data.admin };
          this.loadRequests();
          this.loadCounts();
        },
        error: (err) => {
          this.actionLoading = false;
          this.toast.error(err.error?.message || 'Approval failed');
        },
      });
    });
  }

  rejectRequest(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Reject Application',
        message: `Reject the application from <strong>${this.selectedRequest.fullName}</strong>?<br><br>
          You can update the status later if needed.`,
        confirmLabel: 'Reject',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.actionLoading = true;
      this.api.rejectAdminRequest(this.selectedRequest._id, {}).subscribe({
        next: (res) => {
          this.selectedRequest = res.data;
          this.actionLoading = false;
          this.loadRequests();
          this.loadCounts();
          this.toast.success('Request rejected');
        },
        error: () => { this.actionLoading = false; this.toast.error('Action failed'); },
      });
    });
  }

  resendEmail(): void {
    this.actionLoading = true;
    this.api.resendWelcomeEmail(this.selectedRequest._id).subscribe({
      next: (res) => {
        this.actionLoading = false;
        this.toast.success(res.data?.success ? 'Welcome email sent' : 'Email send failed — check SMTP config');
      },
      error: () => { this.actionLoading = false; this.toast.error('Failed to send email'); },
    });
  }
}
