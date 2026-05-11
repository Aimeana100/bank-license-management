import type { ApplicationUser } from './application'

export interface AuditLog {
  id: string
  action: string
  beforeState: string
  afterState: string
  createdAt: string
  actor: ApplicationUser
  application?: {
    id: string
    institutionName: string
    applicationStatus: string
  }
}
