export type UserRole = 'customer' | 'agent' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number: string;
  pesel?: string;
  address: string;
  date_of_birth?: string;
  avatar?: string;
  is_verified: boolean;
  agent_profile?: AgentProfile;
  created_at: string;
}

export interface AgentProfile {
  license_number: string;
  department: string;
  specialization: string[];
  max_claim_value: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user?: User;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  pesel?: string;
  address?: string;
  date_of_birth?: string;
}

export interface JwtPayload {
  user_id: number;
  role: UserRole;
  full_name: string;
  email: string;
  exp: number;
}
