'use client';

import { useQuery } from '@tanstack/react-query';
import { portfolioAPI } from '@/lib/api';
import type { PortfolioSummary, PortfolioHolding } from '@/types';

export function usePortfolio() {
  return useQuery<PortfolioSummary>({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data } = await portfolioAPI.getSummary();
      return data;
    },
  });
}

export function useHolding(id: string) {
  return useQuery<PortfolioHolding>({
    queryKey: ['holding', id],
    queryFn: async () => {
      const { data } = await portfolioAPI.getHolding(id);
      return data;
    },
    enabled: !!id,
  });
}
