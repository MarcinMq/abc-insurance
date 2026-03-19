export type PolicyStatus = 'active' | 'expired' | 'cancelled' | 'pending';
export type ProductCategory = 'auto' | 'property' | 'health' | 'life' | 'travel' | 'liability';

export interface InsuranceProduct {
  id: number;
  name: string;
  category: ProductCategory;
  description: string;
  base_premium: string;
  coverage_limit: string;
}

export interface Policy {
  id: number;
  policy_number: string;
  product?: InsuranceProduct;
  product_name?: string;
  product_category?: string;
  holder_name: string;
  customer_name?: string;
  status: PolicyStatus;
  start_date: string;
  end_date: string;
  premium_amount: string;
  premium_monthly?: string;
  coverage_amount: string;
  insured_object: Record<string, unknown>;
  coverage_details: Record<string, unknown>;
  created_at: string;
}

export const POLICY_STATUS_LABELS: Record<PolicyStatus, string> = {
  active: 'Aktywna',
  expired: 'Wygasła',
  cancelled: 'Anulowana',
  pending: 'Oczekująca',
};

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
