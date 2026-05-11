import { useEffect, useMemo, useState } from 'react'
import { ApplicationDocuments } from './ApplicationDocuments'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getApplicationById, transitionApplication } from '../../api/applications.api'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { useAuth } from '../../contexts/useAuth'
import type { Application, ApplicationStatus } from '../../types/application'
import { ACTION_LABELS, formatCurrency, formatDate, formatInstitutionType, getRoleActions, getRoleBadgeClass, getStatusBadgeClass } from '../../utils/application.util'


export function ApplicationDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!id) return
    let mounted = true
    getApplicationById(id)
      .then((response) => {
        if (!mounted) return
        setApplication(response)
      })
      .catch(() => {
        if (!mounted) return
        setError('Failed to load application details.')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [id])

  const actions = useMemo<ApplicationStatus[]>(() => {
    if (!user || !application) return []
    return getRoleActions(user.role, application.applicationStatus)
  }, [application, user])

  const detailsTitle =
    user?.role === 'APPLICANT' ? 'My Application Details' : 'Application Review Details'

  const onAction = async (action: ApplicationStatus) => {
    if (!application) return
    setError('')
    setSuccess('')
    setActing(true)
    try {
      const updated = await transitionApplication(application.id, user.role, { applicationStatus: action })
      setApplication(updated)
      setSuccess(`Action ${action} completed.`)
    } catch (err: any) {
      setError(err?.message)
    } finally {
      setActing(false)
    }
  }


  return (
    <main className="min-h-screen p-5">
      <div className="mx-auto w-full max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </Button>
          <Link className="text-sm font-semibold text-amber-950 underline" to="/dashboard">
            Applications list
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{detailsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
              <p className="text-sm font-semibold text-amber-950">{user?.names ?? 'Unknown user'}</p>
              <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getRoleBadgeClass(user?.role)}`}>
                {user?.role ?? 'UNKNOWN'}
              </span>
            </div>

            {error ? (
              <Alert className="mb-3" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {success ? (
              <Alert className="mb-3" variant="success">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}
            {loading ? <p className="text-sm text-amber-900/70">Loading details...</p> : null}

            {!loading && application ? (
              <div className="space-y-5">
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-amber-950">{application.institutionName}</h2>
                    <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium text-amber-800 border-amber-200 bg-amber-50">
                      {formatInstitutionType(application.institutionType)}
                    </span>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(application.applicationStatus)}`}>
                      {application.applicationStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-amber-900/60">Registration No.</dt>
                      <dd className="font-medium text-amber-950">{application.registrationNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-amber-900/60">Contact Email</dt>
                      <dd className="font-medium text-amber-950">{application.contactEmail}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-amber-900/60">Proposed Capital</dt>
                      <dd className="font-medium text-amber-950">{formatCurrency(application.proposedCapitalAmount)}</dd>
                    </div>
                    {application.businessAddress ? (
                      <div className="col-span-2 sm:col-span-3">
                        <dt className="text-xs text-amber-900/60">Business Address</dt>
                        <dd className="font-medium text-amber-950">{application.businessAddress}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-xs text-amber-900/60">Applicant</dt>
                      <dd className="font-medium text-amber-950">{application.applicant?.names ?? '—'}</dd>
                    </div>
                    {application.reviewer ? (
                      <div>
                        <dt className="text-xs text-amber-900/60">Reviewer</dt>
                        <dd className="font-medium text-amber-950">{application.reviewer.names}</dd>
                      </div>
                    ) : null}
                    {application.approver ? (
                      <div>
                        <dt className="text-xs text-amber-900/60">Approver</dt>
                        <dd className="font-medium text-amber-950">{application.approver.names}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-xs text-amber-900/60">Submitted</dt>
                      <dd className="text-amber-900/80">{formatDate(application.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-amber-900/60">Last Updated</dt>
                      <dd className="text-amber-900/80">{formatDate(application.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Actions */}
                {actions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <Button
                        disabled={acting}
                        key={action}
                        onClick={() => onAction(action)}
                        size="sm"
                        variant={action === 'REJECTED' ? 'destructive' : 'outline'}
                      >
                        {ACTION_LABELS[action] ?? action}
                      </Button>
                    ))}
                  </div>
                ) : null}

                <ApplicationDocuments documents={application.documents ?? []} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
