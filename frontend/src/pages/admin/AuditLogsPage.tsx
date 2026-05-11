import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllAuditLogs } from '../../api/audit.api'
import type { AuditLog } from '../../types/audit'
import { getRoleBadgeClass } from '../../utils/application.util'

// ─── helpers

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function parseState(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw) } catch { return { raw } }
}

// ─── sub-components
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-amber-100 bg-white px-5 py-4">
      <p className="text-2xl font-bold text-amber-950">{value}</p>
      <p className="mt-0.5 text-xs text-amber-900/60">{label}</p>
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  return (
    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
      {action.replace(/_/g, ' ')}
    </span>
  )
}

function StateDiff({ before, after }: { before: string; after: string }) {
  const b = parseState(before)
  const a = parseState(after)
  const keys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]))
  const changed = keys.filter((k) => JSON.stringify(b[k]) !== JSON.stringify(a[k]))
  const unchanged = keys.filter((k) => JSON.stringify(b[k]) === JSON.stringify(a[k]))

  return (
    <div className="space-y-3">
      {changed.length > 0 && (
        <div>
          <div className="overflow-hidden rounded-lg border border-amber-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50">
                  <th className="px-3 py-1.5 text-left font-semibold text-amber-900">Field</th>
                  <th className="px-3 py-1.5 text-left font-semibold text-red-700">Before</th>
                  <th className="px-3 py-1.5 text-left font-semibold text-emerald-700">After</th>
                </tr>
              </thead>
              <tbody>
                {changed.map((key) => (
                  <tr className="border-t border-amber-100 bg-white" key={key}>
                    <td className="px-3 py-1.5 text-red-700 line-through">
                      {String(b[key] ?? '—')}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-emerald-700">
                      {String(a[key] ?? '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {unchanged.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900/50">
            Unchanged fields
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <tbody>
                {unchanged.map((key) => (
                  <tr className="border-t border-gray-100 bg-gray-50/60 first:border-0" key={key}>
                    <td className="px-3 py-1.5 font-medium text-gray-500">{key}</td>
                    <td className="px-3 py-1.5 text-gray-500" colSpan={2}>
                      {String(b[key] ?? '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function AuditRow({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLog
  expanded: boolean
  onToggle: () => void
}) {
  const navigate = useNavigate()

  return (
    <>
      <tr
        className="cursor-pointer border-t border-amber-100 transition-colors hover:bg-amber-50/40"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          {log.application ? (
            <button
              className="text-left font-medium text-amber-900 hover:underline"
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/applications/${log.application!.id}`)
              }}
            >
              {log.application.institutionName}
            </button>
          ) : (
            <span className="text-amber-900/40">—</span>
          )}
        </td>

        <td className="px-4 py-3">
          <ActionBadge action={log.action} />
        </td>

        <td className="px-4 py-3">
          <p className="font-medium text-amber-950">{log.actor.names}</p>
          <span
            className={`mt-0.5 inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${getRoleBadgeClass(log.actor.role)}`}
          >
            {log.actor.role}
          </span>
        </td>

        <td className="whitespace-nowrap px-4 py-3 text-sm text-amber-900/60">
          {formatDateTime(log.createdAt)}
        </td>

        <td className="px-4 py-3 text-right">
          <span className="text-xs font-medium text-amber-600">
            {expanded ? '▲ hide' : '▼ diff'}
          </span>
        </td>
      </tr>

      {expanded && (
        <tr className="border-t border-amber-100 bg-gray-50/60">
          <td className="px-6 py-4" colSpan={5}>
            <StateDiff after={log.afterState} before={log.beforeState} />
          </td>
        </tr>
      )}
    </>
  )
}

// ─── page─────────

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getAllAuditLogs()
      .then((data) => { if (mounted) setLogs(data) })
      .catch(() => { if (mounted) setError('Failed to load audit logs.') })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const filtered = search
    ? logs.filter((log) => {
        const q = search.toLowerCase()
        return (
          log.action.toLowerCase().includes(q) ||
          log.actor.names.toLowerCase().includes(q) ||
          (log.application?.institutionName ?? '').toLowerCase().includes(q)
        )
      })
    : logs

  const uniqueActors = new Set(logs.map((l) => l.actor.id)).size
  const uniqueApps = new Set(logs.map((l) => l.application?.id).filter(Boolean)).size

  function toggleRow(id: string) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-amber-950">Audit Logs</h1>
        <p className="mt-1 text-sm text-amber-900/60">
          Immutable record of every status change. Rows are append-only at the database level.
        </p>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total entries" value={logs.length} />
          <StatCard label="Actors involved" value={uniqueActors} />
          <StatCard label="Applications audited" value={uniqueApps} />
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          className="w-full max-w-sm rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950 outline-none placeholder:text-amber-900/40 focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
          placeholder="Search by application, action, or actor…"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <span className="text-xs text-amber-900/60">
            {filtered.length} of {logs.length} results
          </span>
        )}
      </div>

      {/* States */}
      {loading && (
        <div className="rounded-xl border border-amber-100 bg-white px-6 py-10 text-center">
          <p className="text-sm text-amber-900/60">Loading audit logs…</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-amber-100 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-amber-900/70">
                  Application
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-amber-900/70">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-amber-900/70">
                  Actor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-amber-900/70">
                  Timestamp
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <AuditRow
                  expanded={expanded === log.id}
                  key={log.id}
                  log={log}
                  onToggle={() => toggleRow(log.id)}
                />
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-amber-900/60">
                {search ? 'No results match your search.' : 'No audit entries yet.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
