import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { useApplication } from './hooks/useApplication'
import { useAuditLogs } from './hooks/useAuditLogs'
import { ApplicationHeader } from './components/ApplicationHeader'
import { ApplicationMeta } from './components/ApplicationMeta'
import { ApplicationActions } from './components/ApplicationActions'
import { ApplicationDocuments } from './ApplicationDocuments'
import { AuditTrail } from './components/AuditTrail'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { getRoleActions, getRoleBadgeClass } from '../../utils/application.util'

export function ApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { application, loading, acting, error, success, onAction, onUploaded } =
    useApplication(id, user?.role)

  const { logs: auditLogs, loading: auditLoading } = useAuditLogs(id, user?.role === 'ADMIN')

  const actions = useMemo(
    () => (user && application ? getRoleActions(user.role, application.applicationStatus) : []),
    [user, application],
  )

  const canUpload =
    user?.role === 'APPLICANT' &&
    (application?.applicationStatus === 'DRAFT' ||
      application?.applicationStatus === 'INFO_REQUESTED')

  const pageTitle = user?.role === 'APPLICANT' ? 'My Application' : 'Application Review'

  return (
    <main className="min-h-screen bg-gray-50 p-5">
      <div className="mx-auto w-full max-w-4xl space-y-4">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            ← Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{pageTitle}</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-amber-950">{user?.names}</span>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getRoleBadgeClass(user?.role)}`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Feedback */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {loading && (
              <p className="text-sm text-amber-900/60">Loading…</p>
            )}

            {!loading && application && (
              <>
                <ApplicationHeader application={application} />
                <ApplicationMeta application={application} />
                <ApplicationActions actions={actions} acting={acting} onAction={onAction} />
                <ApplicationDocuments
                  applicationId={application.id}
                  canUpload={!!canUpload}
                  documents={application.documents ?? []}
                  onUploaded={onUploaded}
                />
                {user?.role === 'ADMIN' && (
                  <AuditTrail loading={auditLoading} logs={auditLogs} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
