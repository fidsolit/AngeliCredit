import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ActivityItem } from '../lib/types';

export const useActivities = (session: any) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDummyActivities = (): ActivityItem[] => [
    {
      id: '1',
      type: 'loan_approved',
      title: 'Loan Application Approved',
      description: 'Your loan application for ₱50,000 has been approved',
      amount: 50000,
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'approved',
    },
    {
      id: '2',
      type: 'loan_application',
      title: 'New Loan Application',
      description: 'You submitted a new loan application',
      amount: 25000,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    },
  ];

  const fetchActivities = async () => {
    if (!session?.user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch from activity_log table
      const { data: activityData, error: activityError } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch from loans table
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', session.user.id)
        .order('application_date', { ascending: false })
        .limit(10);

      if (activityError) console.error('Activity log error:', activityError);
      if (loanError) console.error('Loans error:', loanError);

      // Combine and format activities
      const combinedActivities: ActivityItem[] = [];

      // Add activity log entries
      if (activityData) {
        activityData.forEach((activity) => {
          combinedActivities.push({
            id: activity.id,
            type: activity.activity_type as any,
            title: activity.description,
            description: activity.description,
            amount: activity.amount,
            timestamp: activity.created_at,
            status: activity.activity_type.includes('approved') ? 'approved' : 'pending',
          });
        });
      }

      // Add loan applications
      if (loanData) {
        loanData.forEach((loan) => {
          combinedActivities.push({
            id: `loan-${loan.id}`,
            type: 'loan_application',
            title: 'Loan Application',
            description: `Loan application for ${new Intl.NumberFormat('en-PH', {
              style: 'currency',
              currency: 'PHP',
            }).format(loan.amount)}`,
            amount: loan.amount,
            timestamp: loan.application_date,
            status: loan.status,
          });
        });
      }

      // Sort by timestamp and limit to 10
      const sortedActivities = combinedActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      if (sortedActivities.length > 0) {
        setActivities(sortedActivities);
      } else {
        // Use dummy data if no real activities
        setActivities(getDummyActivities());
      }
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setError(err.message);
      // Fallback to dummy data
      setActivities(getDummyActivities());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [session]);

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  };
};
