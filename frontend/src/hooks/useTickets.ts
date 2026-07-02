'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketAPI } from '@/lib/api';
import type { ServiceRequest, TicketDetail } from '@/types';

export function useTickets(params?: { status?: string; page?: number }) {
  return useQuery<ServiceRequest[]>({
    queryKey: ['tickets', params],
    queryFn: async () => {
      const { data } = await ticketAPI.getAll(params);
      return data;
    },
  });
}

export function useTicketDetail(id: string) {
  return useQuery<TicketDetail>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const { data } = await ticketAPI.getById(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { status?: string; priority?: string; resolution_notes?: string };
    }) => {
      const response = await ticketAPI.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await ticketAPI.addNote(id, content);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.id] });
    },
  });
}
