import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LoanHistoryItem } from '../lib/types';

export const useLoanHistory = (session: any) => {
  const [loanHistory, setLoanHistory] = useState<LoanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDummyLoanHistory = (): LoanHistoryItem[] => [
    {
      id: '1',
      amount: 50000,
      term_months: 12,
      monthly_payment: 4500,
      status: 'completed',
      application_date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      approval_date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000 + 2 * 24 * 60 * 60 * 1000).toISOString(),
      disbursement_date: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000 + 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      amount: 25000,
      term_months: 6,
      monthly_payment: 4200,
      status: 'active',
      application_date: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      approval_date: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000 + 1 * 24 * 60 * 60 * 1000).toISOString(),
      disbursement_date: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000 + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const fetchLoanHistory = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', session.user.id)
        .order('application_date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedHistory: LoanHistoryItem[] = data.map((loan) => ({
          id: loan.id,
          amount: loan.amount,
          term_months: loan.term_months,
          monthly_payment: loan.monthly_payment,
          status: loan.status,
          application_date: loan.application_date,
          approval_date: loan.approval_date,
          disbursement_date: loan.disbursement_date,
        }));
        setLoanHistory(formattedHistory);
      } else {
        // Use dummy data if no real loan history
        setLoanHistory(getDummyLoanHistory());
      }
    } catch (err: any) {
      console.error('Error fetching loan history:', err);
      setError(err.message);
      // Fallback to dummy data
      setLoanHistory(getDummyLoanHistory());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanHistory();
  }, [session]);

  return {
    loanHistory,
    loading,
    error,
    refetch: fetchLoanHistory,
  };
};
