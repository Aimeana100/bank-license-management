import { useEffect, useState } from 'react'
import { getAuditLogsByApplication } from '../../../api/audit.api'
import type { AuditLog } from '../../../types/audit'

interface UseAuditLogsResult {
  logs: AuditLog[]
  loading: boolean
}

export function useAuditLogs(applicationId: string | undefined, enabled: boolean): UseAuditLogsResult {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!applicationId || !enabled) return
    let mounted = true
    setLoading(true)
    getAuditLogsByApplication(applicationId)
      .then((data) => { if (mounted) setLogs(data) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [applicationId, enabled])

  return { logs, loading }
}
