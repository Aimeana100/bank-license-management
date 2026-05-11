export type InstitutionType =
  | 'COMMERCIAL_BANK'
  | 'MICROFINANCE'
  | 'INVESTMENT_BANK'
  | 'INSURANCE'

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'INFO_REQUESTED'
  | 'RESUBMITTED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'REJECTED'


export interface ApplicationUser {
  id: string
  names: string
  email: string
  role: string
}

export interface ApplicationDocument {
  id: string
  filename: string
  version: number
  filepath: string
  mimetype: string
  size: number
  documentCategory: string
  createdAt: string
}

export interface Application {
  id: string
  institutionName: string
  institutionType: InstitutionType
  contactEmail: string
  businessAddress?: string
  registrationNumber: string
  proposedCapitalAmount: number
  applicationStatus: ApplicationStatus
  applicant: ApplicationUser
  reviewer?: ApplicationUser
  approver?: ApplicationUser
  documents?: ApplicationDocument[]
  createdAt: string
  updatedAt: string
}

export interface ApplicationFileVersion {
  id: string
  version: number
  fileName: string
  fileUrl: string
  uploadedAt: string
  uploadedBy?: string
}

export interface ApplicationFileCategory {
  category: string
  files: ApplicationFileVersion[]
}

export type RoleAction = 'SUBMIT' | 'REQUEST_CHANGES' | 'APPROVE' | 'REJECT'


export interface CreateApplicationRequest {
  institutionName: string
  institutionType: InstitutionType
  contactEmail: string
  businessAddress?: string
  registrationNumber: string
  proposedCapitalAmount: number
  applicationStatus: 'DRAFT'
}

export interface TransitionApplicationRequest {
  applicationStatus: ApplicationStatus
}
