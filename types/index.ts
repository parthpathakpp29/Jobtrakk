// types/index.ts

export type ApplicationStatus = 
  | 'applied' 
  | 'referred' 
  | 'screening' 
  | 'interview' 
  | 'offer' 
  | 'rejected';
export interface Application {
  id: string
  user_id: string
  company_name: string
  job_title: string
  status: ApplicationStatus
  location?: string
  salary_min?: number
  salary_max?: number
  application_url?: string
  date_applied?: string
  notes?: string
  created_at?: string

  // 🟢 Add these new fields for interviews
  interview_date?: string
  interview_time?: string
  interviewer_name?: string
  interview_link?: string
  interview_notes?: string
}

export interface ApplicationFormData {
  company_name: string
  job_title: string
  status: ApplicationStatus
  location?: string
  salary_min?: number
  salary_max?: number
  application_url?: string
  date_applied?: string
  notes?: string

  // 🟢 Add these too
  interview_date?: string
  interview_time?: string
  interviewer_name?: string
  interview_link?: string
  interview_notes?: string
}

export const STATUS_CONFIG: Record<ApplicationStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {

  applied: {
    label: 'Applied',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  referred: {
    label: 'Referred',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
  },
  screening: {
    label: 'Screening',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
  },
  interview: {
    label: 'Interview',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
  },
  offer: {
    label: 'Offer',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-200',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
  },
};