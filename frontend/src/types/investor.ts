export interface Investor {
  id: string;
  name: string;
  email: string;
  phone: string;
  pan: string;
  created_at: string;
}

export interface InvestorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  pan: string;
  date_of_birth: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  kyc_status: KYCStatus;
  risk_profile: string;
  created_at: string;
  updated_at: string;
}

export interface KYCDetail {
  status: KYCStatus;
  kyc_type: string;
  pan_verified: boolean;
  aadhaar_verified: boolean;
  address_verified: boolean;
  photo_verified: boolean;
  verification_date: string | null;
  expiry_date: string | null;
}

export type KYCStatus = 'verified' | 'pending' | 'rejected' | 'expired';

export interface Nominee {
  id: string;
  name: string;
  relationship: string;
  date_of_birth: string;
  allocation_percentage: number;
  is_minor: boolean;
  guardian_name?: string;
}

export interface NomineeUpdateRequest {
  name: string;
  relationship: string;
  date_of_birth: string;
  allocation_percentage: number;
}

export interface DashboardData {
  investor_name: string;
  total_invested: number;
  current_value: number;
  total_returns: number;
  returns_percentage: number;
  active_sips: number;
  recent_transactions: Transaction[];
  notifications: Notification[];
  allocation: AllocationItem[];
}

export interface Transaction {
  id: string;
  fund_name: string;
  type: 'purchase' | 'redemption' | 'switch' | 'sip';
  amount: number;
  units: number;
  nav: number;
  date: string;
  status: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created_at: string;
}

export interface AllocationItem {
  fund_name: string;
  category: string;
  value: number;
  percentage: number;
}
