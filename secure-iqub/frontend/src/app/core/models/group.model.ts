export type CycleStatus = 'draft' | 'active' | 'completed' | 'suspended';
export type SlotStatus = 'pending' | 'valid' | 'invalid' | 'eligible' | 'won';
export type PaymentStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
export type Timeliness = 'on_time' | 'yellow_warning' | 'strong_warning' | 'late' | 'unpaid';

export interface Group {
  _id: string;
  name: string;
  description?: string;
  admin: any;
  status: CycleStatus;
  cycleLength: number;
  slotCount: number;
  slotAmount: number;
  monthlyPool: number;
  slotPayout: number;
  dueDay: number;
  startDate?: string;
  endDate?: string;
  currentMonth: number;
  platformFeePercent: number;
  createdAt: string;
}

export interface Slot {
  _id: string;
  group: string;
  slotNumber: number;
  label: string;
  requiredMonthlyAmount: number;
  assignedMonthlyAmount: number;
  status: SlotStatus;
  wonInMonth?: number;
  wonAt?: string;
  payoutAmount: number;
  payoutSplitStrategy: 'proportional' | 'custom';
  isLocked: boolean;
  members?: SlotMemberContribution[];
}

export interface SlotMemberContribution {
  _id: string;
  group: string;
  slot: string | Slot;
  member: any;
  monthlyAmount: number;
  sharePercent: number;
  isActive: boolean;
  notes?: string;
}

export interface Payment {
  _id: string;
  group: any;
  slot: any;
  member: any;
  monthNumber: number;
  expectedAmount: number;
  submittedAmount: number;
  status: PaymentStatus;
  timeliness: Timeliness;
  daysLate: number;
  penaltyAmount: number;
  penaltyWaived: boolean;
  paidAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  proofUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface SpinResult {
  _id: string;
  group: string;
  monthNumber: number;
  calendarYear: number;
  calendarMonth: number;
  eligibleSlotCount: number;
  winnerSlot: any;
  winnerSlotNumber: number;
  winnerSlotLabel: string;
  winnerMembers: WinnerMember[];
  totalPayoutAmount: number;
  randomSeed: string;
  triggeredBy: any;
  confirmedAt: string;
  createdAt: string;
}

export interface WinnerMember {
  member: any;
  name: string;
  monthlyAmount: number;
  sharePercent: number;
  payoutAmount: number;
}

export interface MonthlyCycle {
  _id: string;
  group: string;
  monthNumber: number;
  calendarYear: number;
  calendarMonth: number;
  dueDate: string;
  status: 'open' | 'collection_complete' | 'spin_complete';
  expectedAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  totalPenalties: number;
}

export interface GroupAnalytics {
  groupName: string;
  status: CycleStatus;
  currentMonth: number;
  cycleLength: number;
  eligibleSlots: number;
  wonSlots: number;
  expectedThisMonth: number;
  collectedThisMonth: number;
  remainingThisMonth: number;
  lateMembers: number;
  totalPenalties: number;
  recentWinners: SpinResult[];
  completionPercent: number;
}
