import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/transactionService';
import { useRealtimeData } from './useRealtimeData';

export const useTransactions = () => {
  const queryClient = useQueryClient();

  useRealtimeData([{ table: 'transactions', queryKey: ['transactions'] }]);

  const { data: transactions = [], isLoading: loading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await transactionService.fetchAll();
      if (error) throw new Error(error);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const recordPurchase = useMutation({
    mutationFn: ({ userId, userName, product, amount }: { userId: string; userName: string; product: string; amount: number }) =>
      transactionService.recordPurchase(userId, userName, product, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  return {
    transactions,
    loading,
    error,
    recordPurchase: recordPurchase.mutateAsync,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  };
};
