import api from './axios'
import type { AuditLog } from '../types/audit'

export async function getAllAuditLogs(): Promise<AuditLog[]> {
  const response = await api.get<AuditLog[]>('/audit')
  return response.data
}

export async function getAuditLogsByApplication(applicationId: string): Promise<AuditLog[]> {
  const response = await api.get<AuditLog[]>(`/audit/${applicationId}`)
  return response.data
}
