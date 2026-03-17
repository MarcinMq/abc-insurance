export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'additional_info'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'paid'
  | 'closed';

export type IncidentType =
  | 'accident'
  | 'theft'
  | 'fire'
  | 'flood'
  | 'vandalism'
  | 'illness'
  | 'injury'
  | 'natural_disaster'
  | 'other';

export interface ClaimDocument {
  id: number;
  document_type: string;
  document_type_display: string;
  title: string;
  file: string;
  description: string;
  uploaded_by_name: string;
  uploaded_at: string;
}

export interface ClaimStatusHistoryEntry {
  id: number;
  old_status: string;
  old_status_display: string;
  new_status: string;
  new_status_display: string;
  changed_by_name: string;
  comment: string;
  changed_at: string;
}

export interface AllowedNextStatus {
  value: ClaimStatus;
  label: string;
}

export interface Claim {
  id: number;
  claim_number: string;
  policy: any;
  policy_number?: string;
  policy_category?: string;
  reported_by: any;
  reported_by_name?: string;
  assigned_agent?: any;
  status: ClaimStatus;
  status_display: string;
  incident_type: IncidentType;
  incident_type_display: string;
  incident_date: string;
  incident_location: string;
  description: string;
  estimated_damage: number;
  approved_amount?: number;
  agent_notes?: string;
  rejection_reason?: string;
  documents?: ClaimDocument[];
  status_history?: ClaimStatusHistoryEntry[];
  allowed_next_statuses?: AllowedNextStatus[];
  submitted_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ClaimCreateRequest {
  policy: number;
  incident_type: IncidentType;
  incident_date: string;
  incident_location: string;
  description: string;
  estimated_damage: number;
  submit?: boolean;
}

export interface ClaimStatusUpdateRequest {
  status: ClaimStatus;
  comment?: string;
  approved_amount?: number;
  rejection_reason?: string;
}

export const STATUS_CONFIG: Record<ClaimStatus, { label: string; color: string; icon: string }> = {
  draft:              { label: 'Szkic',                  color: '#9E9E9E', icon: 'edit' },
  submitted:          { label: 'Zgłoszona',              color: '#1976D2', icon: 'send' },
  under_review:       { label: 'W ocenie',               color: '#F57C00', icon: 'search' },
  additional_info:    { label: 'Wymaga uzupełnienia',    color: '#7B1FA2', icon: 'info' },
  approved:           { label: 'Zatwierdzona',           color: '#388E3C', icon: 'check_circle' },
  partially_approved: { label: 'Częśc. zatwierdzona',   color: '#558B2F', icon: 'check' },
  rejected:           { label: 'Odrzucona',              color: '#D32F2F', icon: 'cancel' },
  paid:               { label: 'Wypłacona',              color: '#00796B', icon: 'payments' },
  closed:             { label: 'Zamknięta',              color: '#616161', icon: 'lock' },
};
