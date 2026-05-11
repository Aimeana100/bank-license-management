import { getRoleBadgeClass } from '../../../utils/application.util'
import type { AuditLog } from '../../../types/audit'

interface Props {
  logs: AuditLog[]
  loading: boolean
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function AuditEntry({ log }: { log: AuditLog }) {
  return (
    <li className="mb-5 ml-4">
      <span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full border border-amber-300 bg-amber-100" />
      <p className="text-xs text-amber-900/50">{formatDateTime(log.createdAt)}</p>
      <p className="mt-0.5 text-sm font-semibold text-amber-950">
        {log.action.replace(/_/g, ' ')}
      </p>
      <p className="mt-0.5 text-xs text-amber-900/70">
        by <span className="font-medium">{log.actor.names}</span>
        <span className={`ml-1.5 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${getRoleBadgeClass(log.actor.role)}`}>
          {log.actor.role}
        </span>
      </p>
    </li>
  )
}

export function AuditTrail({ logs, loading }: Props) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-amber-950">Audit Trail</h3>

      {loading && (
        <p className="text-xs text-amber-900/60">Loading audit trail…</p>
      )}

      {!loading && logs.length === 0 && (
        <p className="text-xs text-amber-900/60">No audit entries yet.</p>
      )}

      {!loading && logs.length > 0 && (
        <ol className="relative border-l border-amber-200">
          {logs.map((log) => (
            <AuditEntry key={log.id} log={log} />
          ))}
        </ol>
      )}
    </div>
  )
}
