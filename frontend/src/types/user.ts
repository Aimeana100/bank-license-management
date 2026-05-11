export type UserRole = 'APPLICANT' | 'REVIEWER' | 'APPROVER' | 'ADMIN'

export interface User {
  id: string
  names: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt?: string
  updateAt?: string
}
