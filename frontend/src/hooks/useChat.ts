'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatAPI } from '@/lib/api';
import type { Conversation, ConversationDetail, SendMessageResponse } from '@/types';

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await chatAPI.getConversations();
      return data;
    },
  });
}

export function useConversation(id: string | null) {
  return useQuery<ConversationDetail>({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const { data } = await chatAPI.getConversation(id!);
      return data;
    },
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation<SendMessageResponse, Error, { conversationId: string; content: string }>({
    mutationFn: async ({ conversationId, content }) => {
      const { data } = await chatAPI.sendMessage(conversationId, content);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await chatAPI.createConversation();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
