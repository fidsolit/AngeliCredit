// Utility functions for the E-Credit app

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
  });
};

export const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'loan_application': return 'document-text';
    case 'loan_approved': return 'checkmark-circle';
    case 'loan_rejected': return 'close-circle';
    case 'payment': return 'card';
    case 'profile_update': return 'person';
    default: return 'information-circle';
  }
};

export const getActivityColor = (type: string): string => {
  switch (type) {
    case 'loan_application': return '#007bff';
    case 'loan_approved': return '#28a745';
    case 'loan_rejected': return '#dc3545';
    case 'payment': return '#17a2b8';
    case 'profile_update': return '#ff751f';
    default: return '#ff751f';
  }
};

export const getLoanStatusIcon = (status: string): string => {
  switch (status) {
    case 'pending': return 'time';
    case 'approved': return 'checkmark-circle';
    case 'rejected': return 'close-circle';
    case 'active': return 'play-circle';
    case 'completed': return 'checkmark-done';
    default: return 'help-circle';
  }
};

export const getLoanStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return '#ff9800';
    case 'approved': return '#28a745';
    case 'rejected': return '#dc3545';
    case 'active': return '#007bff';
    case 'completed': return '#ff751f';
    default: return '#ff751f';
  }
};

export const getIdVerificationStatus = (status?: string): string => {
  switch (status) {
    case 'verified': return 'Verified';
    case 'pending': return 'Under Review';
    case 'rejected': return 'Rejected';
    default: return 'Not Uploaded';
  }
};

export const getIdVerificationColor = (status?: string): string => {
  switch (status) {
    case 'verified': return '#28a745';
    case 'pending': return '#ff9800';
    case 'rejected': return '#dc3545';
    default: return '#ff751f';
  }
};

export const calculateLoanDetails = (
  amount: number,
  termMonths: number,
  interestRate: number = 0.12
): { monthlyPayment: number; totalPayment: number; totalInterest: number } => {
  const monthlyRate = interestRate / 12;
  const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                        (Math.pow(1 + monthlyRate, termMonths) - 1);
  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = totalPayment - amount;

  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
  };
};

export const validateLoanApplication = (application: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!application.amount || application.amount < 1000 || application.amount > 100000) {
    errors.push('Amount must be between ₱1,000 and ₱100,000');
  }

  if (!application.term_months || application.term_months < 1 || application.term_months > 24) {
    errors.push('Term must be between 1 and 24 months');
  }

  if (!application.purpose || application.purpose.trim().length < 5) {
    errors.push('Purpose must be at least 5 characters');
  }

  if (!application.monthly_income || application.monthly_income < 10000) {
    errors.push('Monthly income must be at least ₱10,000');
  }

  if (!application.employment_status) {
    errors.push('Employment status is required');
  }

  if (!application.company_name || application.company_name.trim().length < 2) {
    errors.push('Company name must be at least 2 characters');
  }

  if (!application.position || application.position.trim().length < 2) {
    errors.push('Position must be at least 2 characters');
  }

  if (!application.work_experience) {
    errors.push('Work experience is required');
  }

  if (!application.emergency_contact_name || application.emergency_contact_name.trim().length < 2) {
    errors.push('Emergency contact name is required');
  }

  if (!application.emergency_contact_phone || application.emergency_contact_phone.trim().length < 10) {
    errors.push('Valid emergency contact phone is required');
  }

  if (!application.emergency_contact_relationship) {
    errors.push('Emergency contact relationship is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const checkLoanEligibility = (profile: any): { 
  canApply: boolean; 
  requirements: string[]; 
  missingRequirements: string[] 
} => {
  const requirements = [
    'Complete profile information',
    'Upload valid ID document',
    'ID verification approved'
  ];

  const missingRequirements: string[] = [];

  // Check if profile is complete
  if (!profile.profile_completed) {
    missingRequirements.push('Complete profile information');
  }

  // Check if ID document is uploaded
  if (!profile.id_document_url) {
    missingRequirements.push('Upload valid ID document');
  }

  // Check if ID is verified
  if (profile.id_verification_status !== 'verified') {
    missingRequirements.push('ID verification approved');
  }

  return {
    canApply: missingRequirements.length === 0,
    requirements,
    missingRequirements,
  };
};
