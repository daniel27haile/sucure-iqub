import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: { pagination: { page: number; limit: number; total: number; totalPages: number } };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Admin ──────────────────────────────────────────────────────────────────

  // Groups
  createGroup(data: any): Observable<ApiResponse> { return this.http.post<ApiResponse>(`${this.base}/admin/groups`, data); }
  getMyGroups(): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/admin/groups`); }
  getGroupDetails(id: string): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/admin/groups/${id}`); }
  updateGroup(id: string, data: any): Observable<ApiResponse> { return this.http.put<ApiResponse>(`${this.base}/admin/groups/${id}`, data); }
  activateCycle(id: string, data: any): Observable<ApiResponse> { return this.http.post<ApiResponse>(`${this.base}/admin/groups/${id}/activate`, data); }
  getGroupAnalytics(id: string): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/admin/groups/${id}/analytics`); }
  getLeaderboard(id: string): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/admin/groups/${id}/leaderboard`); }

  // Slots
  createSlot(groupId: string, data: any): Observable<ApiResponse> { return this.http.post<ApiResponse>(`${this.base}/admin/groups/${groupId}/slots`, data); }
  getSlotDetails(groupId: string, slotId: string): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/admin/groups/${groupId}/slots/${slotId}`); }
  assignMemberToSlot(groupId: string, slotId: string, data: any): Observable<ApiResponse> { return this.http.post<ApiResponse>(`${this.base}/admin/groups/${groupId}/slots/${slotId}/members`, data); }
  removeMemberFromSlot(groupId: string, slotId: string, memberId: string): Observable<ApiResponse> { return this.http.delete<ApiResponse>(`${this.base}/admin/groups/${groupId}/slots/${slotId}/members/${memberId}`); }

  // Members
  inviteMember(data: any): Observable<ApiResponse> { return this.http.post<ApiResponse>(`${this.base}/admin/members/invite`, data); }
  listGroupMembers(groupId: string): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/admin/groups/${groupId}/members`); }

  // Payments
  submitPayment(groupId: string, data: any): Observable<ApiResponse> { return this.http.post<ApiResponse>(`${this.base}/admin/groups/${groupId}/payments`, data); }
  getPayments(groupId: string, params?: any): Observable<ApiResponse> {
    let httpParams = new HttpParams();
    if (params) Object.keys(params).forEach((k) => { if (params[k]) httpParams = httpParams.set(k, params[k]); });
    return this.http.get<ApiResponse>(`${this.base}/admin/groups/${groupId}/payments`, { params: httpParams });
  }
  approvePayment(paymentId: string, data?: any): Observable<ApiResponse> { return this.http.patch<ApiResponse>(`${this.base}/admin/payments/${paymentId}/approve`, data || {}); }
  rejectPayment(paymentId: string, data: any): Observable<ApiResponse> { return this.http.patch<ApiResponse>(`${this.base}/admin/payments/${paymentId}/reject`, data); }

  // Spin
  runSpin(groupId: string): Observable<ApiResponse> { return this.http.post<ApiResponse>(`${this.base}/admin/groups/${groupId}/spin`, {}); }
  getSpinHistory(groupId: string): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/admin/groups/${groupId}/spin-history`); }
  getEligibleSlots(groupId: string): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/admin/groups/${groupId}/eligible-slots`); }

  // ── Admin Settings (read-only) ─────────────────────────────────────────────
  getAdminPlatformSettings(): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/admin/settings`); }

  // ── Super Admin ────────────────────────────────────────────────────────────
  getPlatformAnalytics(): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/super-admin/analytics`); }
  createAdmin(data: any): Observable<ApiResponse> { return this.http.post<ApiResponse>(`${this.base}/super-admin/admins`, data); }
  getAdmins(params?: any): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/super-admin/admins`, { params }); }
  toggleAdminStatus(id: string): Observable<ApiResponse> { return this.http.patch<ApiResponse>(`${this.base}/super-admin/admins/${id}/toggle-status`, {}); }
  getAllGroups(params?: any): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/super-admin/groups`, { params }); }
  suspendGroup(id: string, data: any): Observable<ApiResponse> { return this.http.patch<ApiResponse>(`${this.base}/super-admin/groups/${id}/suspend`, data); }
  getPlatformSettings(): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/super-admin/settings`); }
  updatePlatformSettings(data: any): Observable<ApiResponse> { return this.http.put<ApiResponse>(`${this.base}/super-admin/settings`, data); }
  getAuditLogs(params?: any): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/super-admin/audit-logs`, { params }); }

  // ── Member ─────────────────────────────────────────────────────────────────
  getMemberDashboard(): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/member/dashboard`); }
  getMyPayments(params?: any): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/member/payments`, { params }); }
  getMySlot(): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/member/slot`); }
  getMyPenalties(): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/member/penalties`); }
  getMyPayoutStatus(): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/member/payout-status`); }
  getWinnerHistory(groupId: string): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/member/groups/${groupId}/winner-history`); }
  getNotifications(): Observable<ApiResponse> { return this.http.get<ApiResponse>(`${this.base}/member/notifications`); }
  markNotificationRead(id: string): Observable<ApiResponse> { return this.http.patch<ApiResponse>(`${this.base}/member/notifications/${id}/read`, {}); }
}
