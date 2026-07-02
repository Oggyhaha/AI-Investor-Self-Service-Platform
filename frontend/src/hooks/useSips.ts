'use client';

import { useQuery } from '@tanstack/react-query';
import { sipAPI } from '@/lib/api';
import type { SIP, SIPDetail } from '@/types';

export function useSips() {
  return useQuery<SIP[]>({
    queryKey: ['sips'],
    queryFn: async () => {
      const { data } = await sipAPI.getAll();
      return data;
    },
  });
}

export function useSipDetail(id: string) {
  return useQuery<SIPDetail>({
    queryKey: ['sip', id],
    queryFn: async () => {
      const { data } = await sipAPI.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useFailedSips() {
  return useQuery<SIP[]>({
    queryKey: ['sips', 'failed'],
    queryFn: async () => {
      const { data } = await sipAPI.getFailed();
      return data;
    },
  });
}
