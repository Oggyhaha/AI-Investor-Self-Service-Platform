'use client';

import { useMutation } from '@tanstack/react-query';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import type { StoredUser } from '@/lib/auth';

export function useSendOTP() {
  return useMutation({
    mutationFn: (phone_number: string) => authAPI.sendOTP(phone_number),
  });
}

export function useVerifyOTP() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: ({ phone_number, otp }: { phone_number: string; otp: string }) =>
      authAPI.verifyOTP(phone_number, otp),
    onSuccess: (response, variables) => {
      const { access_token, user_id, role } = response.data;
      const name = variables.phone_number === '9876543210' 
        ? 'Rajesh Kumar Sharma' 
        : variables.phone_number === '9876543211' 
          ? 'Priya Mehta' 
          : 'Amit Patel';
      
      login(access_token, {
        id: user_id,
        name,
        role: role as StoredUser['role'],
      });
    },
  });
}

export function useAdvisorLogin() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authAPI.advisorLogin(email, password),
    onSuccess: (response, variables) => {
      const { access_token, user_id, role } = response.data;
      const name = variables.email.startsWith('sneha') ? 'Sneha Gupta' : 'Vikram Singh';
      
      login(access_token, {
        id: user_id,
        name,
        role: role as StoredUser['role'],
      });
    },
  });
}
