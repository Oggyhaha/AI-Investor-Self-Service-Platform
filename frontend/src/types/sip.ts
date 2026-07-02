export interface SIP {
  id: string;
  fund_id: string;
  fund_name: string;
  amount: number;
  frequency: SIPFrequency;
  start_date: string;
  end_date: string | null;
  next_date: string;
  status: SIPStatus;
  mandate_id: string | null;
  installments_completed: number;
  total_installments: number | null;
  total_invested: number;
  current_value: number;
  returns_percentage: number;
  created_at: string;
}

export type SIPFrequency = 'monthly' | 'quarterly' | 'weekly';

export type SIPStatus = 'active' | 'paused' | 'completed' | 'cancelled' | 'failed';

export interface SIPDetail extends SIP {
  transactions: SIPTransaction[];
  mandate: Mandate | null;
  failure_reason?: string;
}

export interface SIPTransaction {
  id: string;
  date: string;
  amount: number;
  units: number;
  nav: number;
  status: 'success' | 'failed' | 'pending';
}

export interface Mandate {
  id: string;
  bank_name: string;
  account_number: string;
  mandate_type: 'e_mandate' | 'physical';
  amount_limit: number;
  status: MandateStatus;
  start_date: string;
  end_date: string;
  created_at: string;
}

export type MandateStatus = 'active' | 'pending' | 'rejected' | 'cancelled' | 'expired';
