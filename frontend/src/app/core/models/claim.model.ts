export type ClaimStatus =
  | 'draft' | 'submitted' | 'under_review' | 'additional_info'
  | 'approved' | 'partially_approved' | 'rejected' | 'paid' | 'closed';

export type IncidentType =
  | 'accident' | 'theft' | 'fire' | 'flood' | 'vandalism'
  | 'illness' | 'injury' | 'natural_disaster' | 'other';

export interface ClaimStatusHistory {
  id: number;
  old_status: string;
  new_status: string;
  changed_by_name: string;
  comment: string;
  changed_at: string;
}

export interface Claim {
  id: number;
  claim_number: string;
  policy: number;
  policy_number: string;
  reported_by: number;
  reported_by_name: string;
  assigned_agent: number | null;
  assigned_agent_name: string | null;
  status: ClaimStatus;
  incident_type: IncidentType;
  incident_date: string;
  incident_location: string;
  description: string;
  estimated_damage: string;
  approved_amount: string | null;
  agent_notes: string;
  rejection_reason: string;
  status_history: ClaimStatusHistory[];
  created_at: string;
  submitted_at: string | null;
}

export interface CreateClaimData {
  policy: number;
  incident_type: IncidentType;
  incident_date: string;
  incident_location: string;
  description: string;
  estimated_damage: number;
}

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  draft: 'Szkic',
  submitted: 'Zgłoszona',
  under_review: 'W trakcie oceny',
  additional_info: 'Oczekuje na uzupełnienie',
  approved: 'Zatwierdzona',
  partially_approved: 'Częściowo zatwierdzona',
  rejected: 'Odrzucona',
  paid: 'Wypłacona',
  closed: 'Zamknięta',
};

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  accident: 'Wypadek',
  theft: 'Kradzież',
  fire: 'Pożar',
  flood: 'Powódź',
  vandalism: 'Wandalizm',
  illness: 'Choroba',
  injury: 'Uraz',
  natural_disaster: 'Klęska żywiołowa',
  other: 'Inne',
};
