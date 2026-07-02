export interface Fund {
  id: string;
  name: string;
  category: FundCategory;
  amc: string;
  nav: number;
  nav_date: string;
  expense_ratio: number;
  fund_size: number;
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
}

export type FundCategory =
  | 'equity_large_cap'
  | 'equity_mid_cap'
  | 'equity_small_cap'
  | 'equity_flexi_cap'
  | 'equity_multi_cap'
  | 'debt_short_term'
  | 'debt_long_term'
  | 'debt_liquid'
  | 'hybrid_balanced'
  | 'hybrid_aggressive'
  | 'index_fund'
  | 'elss'
  | 'other';

export interface PortfolioHolding {
  id: string;
  fund_id: string;
  fund_name: string;
  category: string;
  units: number;
  avg_nav: number;
  current_nav: number;
  invested_amount: number;
  current_value: number;
  returns: number;
  returns_percentage: number;
  last_transaction_date: string;
}

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_returns: number;
  returns_percentage: number;
  xirr: number;
  holdings_count: number;
  holdings: PortfolioHolding[];
  category_allocation: CategoryAllocation[];
}

export interface CategoryAllocation {
  category: string;
  value: number;
  percentage: number;
  color: string;
}
