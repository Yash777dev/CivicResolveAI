export type Role = 'citizen' | 'officer' | 'supervisor' | 'admin';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'TRIAGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'NEEDS_INFORMATION'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'ESCALATED';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  account_status: string;
  preferred_language: 'en' | 'ta';
  phone_number?: string;
  department_id?: number;
  department_name?: string;
  created_at: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  code: string;
  name: string;
  department_id: number;
  department_name?: string;
  description?: string;
  default_sla_hours: number;
  is_active: boolean;
  keywords: string[];
}

export interface FiredRule {
  rule_key: string;
  name: string;
  points: number;
  evidence: string;
  explanation: string;
}

export interface PriorityAssessment {
  id?: number;
  complaint_id?: number;
  score: number;
  level: PriorityLevel;
  fired_rules: FiredRule[];
  summary: string;
  missing_information?: string;
  engine_version: string;
  assessed_at: string;
}

export interface PriorityOverride {
  id: number;
  complaint_id: number;
  previous_score: number;
  previous_level: PriorityLevel;
  new_score: number;
  new_level: PriorityLevel;
  reason: string;
  actor_id?: number;
  actor_name?: string;
  created_at: string;
}

export interface ComplaintEvidence {
  id: number;
  complaint_id: number;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  checksum: string;
  uploaded_by?: number;
  uploader_name?: string;
  created_at: string;
}

export interface StatusHistoryItem {
  id: number;
  complaint_id: number;
  previous_status?: ComplaintStatus;
  new_status: ComplaintStatus;
  actor_id?: number;
  actor_name?: string;
  public_note?: string;
  internal_note?: string;
  created_at: string;
}

export interface AssignmentHistoryItem {
  id: number;
  complaint_id: number;
  previous_department_name?: string;
  new_department_name?: string;
  previous_officer_name?: string;
  new_officer_name?: string;
  actor_name?: string;
  reason?: string;
  created_at: string;
}

export interface ComplaintNote {
  id: number;
  complaint_id: number;
  author_id?: number;
  author_name?: string;
  author_role?: string;
  note_type: 'public' | 'internal';
  body: string;
  created_at: string;
}

export interface ComplaintFeedback {
  id: number;
  complaint_id: number;
  citizen_name?: string;
  rating: number;
  comments?: string;
  reopen_requested: boolean;
  reopen_reason?: string;
  created_at: string;
}

export interface SimilarCase {
  id: number;
  similar_complaint_id: number;
  reference_number: string;
  title: string;
  status: ComplaintStatus;
  priority: PriorityLevel;
  similarity_score: number;
  reason: string;
  relationship_status: string;
}

export interface Complaint {
  id: number;
  reference_number: string;
  citizen_id: number;
  citizen_name?: string;
  title: string;
  description: string;
  category_id: number;
  category_name?: string;
  category_code?: string;
  department_id: number;
  department_name?: string;
  assigned_officer_id?: number;
  assigned_officer_name?: string;
  status: ComplaintStatus;
  current_priority: PriorityLevel;
  priority_score: number;
  priority_engine_version: string;
  reported_duration_days: number;
  is_essential_facility: boolean;
  facility_type?: string;
  immediate_danger: boolean;
  approx_location?: string;
  latitude?: number;
  longitude?: number;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
  due_at?: string;
  resolved_at?: string;
  closed_at?: string;
  resolution_summary?: string;
  closure_reason?: string;
  evidence_count?: number;

  // Detailed view attributes
  status_history?: StatusHistoryItem[];
  assignment_history?: AssignmentHistoryItem[];
  priority_assessment?: PriorityAssessment;
  priority_overrides?: PriorityOverride[];
  evidence?: ComplaintEvidence[];
  notes?: ComplaintNote[];
  feedback?: ComplaintFeedback;
  similar_cases?: SimilarCase[];
}

export interface NotificationItem {
  id: number;
  recipient_id: number;
  complaint_id?: number;
  complaint_ref?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface PriorityRuleItem {
  id: number;
  rule_key: string;
  name: string;
  description: string;
  weight: number;
  condition_type: string;
  config: Record<string, any>;
  is_active: boolean;
  version: string;
  updated_by?: number;
  updater_name?: string;
  updated_at: string;
}

export interface AuditLogItem {
  id: number;
  actor_id?: number;
  actor_name?: string;
  actor_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export interface AnalyticsSummary {
  total_complaints: number;
  pending_count: number;
  in_progress_count: number;
  resolved_count: number;
  closed_count: number;
  escalated_count: number;
  overdue_count: number;
  resolution_rate_percent: number;
  overdue_rate_percent: number;
  median_acknowledgement_hours?: number;
  median_resolution_hours?: number;
  priority_breakdown: {
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  status_breakdown: Record<string, number>;
}
