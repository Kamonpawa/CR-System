export type CRPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CRCategory = 'bugfix' | 'feature' | 'improvement' | 'security' | 'other';
export type CRStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';

export interface CRComment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  createdAt: string;
}

export interface CRHistory {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface ChangeRequest {
  id: string;
  crNumber: string;
  title: string;
  description: string;
  reason: string;
  systemName: string;
  priority: CRPriority;
  category: CRCategory;
  status: CRStatus;
  requesterName: string;
  requesterEmail: string;
  impactAnalysis: string;
  assignedTo?: string;
  assignedEmail?: string;
  createdAt: string;
  updatedAt: string;
  comments: CRComment[];
  history: CRHistory[];
}

export interface CRStats {
  total: number;
  byStatus: Record<CRStatus, number>;
  byPriority: Record<CRPriority, number>;
  byCategory: Record<CRCategory, number>;
  monthlyTrend: Record<string, number>; // key: "YYYY-MM"
}
