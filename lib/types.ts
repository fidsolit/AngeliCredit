// Type definitions for the E-Credit app

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  credit_score?: number;
  loan_limit?: number;
  avatar_url?: string;
  id_document_url?: string;
  id_verification_status?: string;
  // Address Information
  house_number?: string;
  province?: string;
  city?: string;
  barangay?: string;
  postal_code?: string;
  landline?: string;
  work_from_home?: boolean;
  // Income Information
  main_income_source?: string;
  business_name?: string;
  payout_frequency?: string;
  payout_days?: string;
  employment_company?: string;
  employment_position?: string;
  monthly_income?: number;
  // Profile Completion
  profile_completion_step?: number;
  profile_completed?: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'loan_application' | 'loan_approved' | 'loan_rejected' | 'payment' | 'profile_update';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  status?: string;
}

export interface LoanApplication {
  amount: number;
  term_months: number;
  purpose: string;
  monthly_income: number;
  employment_status: string;
  company_name: string;
  position: string;
  work_experience: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

export interface CalculatorInputs {
  amount: number;
  term_months: number;
  interest_rate: number;
}

export interface CalculatorResults {
  monthly_payment: number;
  total_payment: number;
  total_interest: number;
}

export interface LoanHistoryItem {
  id: string;
  amount: number;
  term_months: number;
  monthly_payment: number;
  status: string;
  application_date: string;
  approval_date?: string;
  disbursement_date?: string;
}

export interface AccountSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  security: {
    two_factor: boolean;
    biometric: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
}

export interface AddressForm {
  house_number: string;
  province: string;
  city: string;
  barangay: string;
  postal_code: string;
  landline: string;
  work_from_home: boolean;
}

export interface IncomeForm {
  main_income_source: string;
  business_name: string;
  payout_frequency: string;
  payout_days: string;
  employment_company: string;
  employment_position: string;
  monthly_income: number;
}

export interface BasicInfoForm {
  full_name: string;
  phone: string;
}
