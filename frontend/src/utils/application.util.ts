import type { InstitutionType } from "../types/application";

export const INSTITUTION_TYPES: { value: InstitutionType; label: string }[] = [
  { value: 'COMMERCIAL_BANK', label: 'Commercial Bank' },
  { value: 'MICROFINANCE', label: 'Microfinance' },
  { value: 'INVESTMENT_BANK', label: 'Investment Bank' },
  { value: 'INSURANCE', label: 'Insurance' },
]

export function formatDate(value?: string) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export function formatInstitutionType(type: InstitutionType) {
  return INSTITUTION_TYPES.find((t) => t.value === type)?.label ?? type
}

export function getStatusBadgeClass(status: string) {
  if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (status === 'REJECTED') return 'bg-red-100 text-red-800 border-red-200'
  if (status === 'SUBMITTED' || status === 'RESUBMITTED') return 'bg-blue-100 text-blue-800 border-blue-200'
  if (status === 'REVIEWED') return 'bg-purple-100 text-purple-800 border-purple-200'
  if (status === 'INFO_REQUESTED') return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-gray-100 text-gray-700 border-gray-200'
}

export function getRoleBadgeClass(role?: string) {
  if (role === 'APPLICANT') return 'bg-blue-100 text-blue-800 border-blue-200'
  if (role === 'REVIEWER') return 'bg-purple-100 text-purple-800 border-purple-200'
  if (role === 'APPROVER') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  return 'bg-amber-100 text-amber-800 border-amber-200'
}

export const EMPTY_FORM = {
  institutionName: '',
  institutionType: 'COMMERCIAL_BANK' as InstitutionType,
  contactEmail: '',
  businessAddress: '',
  registrationNumber: '',
  proposedCapitalAmount: '',
}
