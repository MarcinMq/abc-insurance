export type PolicyStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended';
export type InsuranceCategory = 'auto' | 'property' | 'health' | 'life' | 'travel' | 'liability';

export interface InsuranceProduct {
  id: number;
  name: string;
  category: InsuranceCategory;
  category_display: string;
  description: string;
  coverage_details: Record<string, boolean | string>;
  base_price_monthly: number;
  max_coverage_amount: number;
  min_coverage_amount: number;
  is_active: boolean;
}

export interface PolicyDocument {
  id: number;
  document_type: string;
  document_type_display: string;
  title: string;
  file: string;
  uploaded_at: string;
}

export interface Policy {
  id: number;
  policy_number: string;
  customer_name?: string;
  customer?: any;
  product: InsuranceProduct | any;
  product_name?: string;
  product_category?: string;
  assigned_agent?: any;
  status: PolicyStatus;
  status_display: string;
  coverage_amount: number;
  premium_monthly: number;
  start_date: string;
  end_date: string;
  insured_object: Record<string, any>;
  notes?: string;
  documents?: PolicyDocument[];
  days_to_expiry?: number;
  created_at: string;
  updated_at?: string;
}

export const CATEGORY_ICONS: Record<InsuranceCategory, string> = {
  auto: 'directions_car',
  property: 'home',
  health: 'health_and_safety',
  life: 'favorite',
  travel: 'flight',
  liability: 'shield',
};

export const CATEGORY_COLORS: Record<InsuranceCategory, string> = {
  auto: '#1565C0',
  property: '#2E7D32',
  health: '#C62828',
  life: '#6A1B9A',
  travel: '#00838F',
  liability: '#E65100',
};
