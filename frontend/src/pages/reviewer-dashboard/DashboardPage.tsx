import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  createApplication,
  listApplications,
} from '../../api/applications.api'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useAuth } from '../../contexts/useAuth'
import type { Application } from '../../types/application'
import { EMPTY_FORM, formatDate, formatInstitutionType, getRoleBadgeClass, getStatusBadgeClass, INSTITUTION_TYPES } from '../../utils/application.util'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [items, setItems] = useState<Application[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingAction, setLoadingAction] = useState(false)
  const [listError, setListError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    let mounted = true
    listApplications()
      .then((applications) => {
        if (!mounted) return
        setItems(applications)
      })
      .catch(() => {
        if (!mounted) return
        setListError('Failed to load applications.')
      })
      .finally(() => {
        if (!mounted) return
        setLoadingList(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const setField = (field: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const isFormValid =
    form.institutionName.trim() &&
    form.contactEmail.trim() &&
    form.registrationNumber.trim() &&
    Number(form.proposedCapitalAmount) > 0

  const onCreate = async () => {
    if (!isFormValid) return
    setLoadingAction(true)
    try {
      const created = await createApplication({
        institutionName: form.institutionName.trim(),
        institutionType: form.institutionType,
        contactEmail: form.contactEmail.trim(),
        businessAddress: form.businessAddress.trim() || undefined,
        registrationNumber: form.registrationNumber.trim(),
        proposedCapitalAmount: Number(form.proposedCapitalAmount),
        applicationStatus: 'DRAFT',
      })
      setItems((prev) => [created, ...prev])
      setShowCreate(false)
      setForm(EMPTY_FORM)
    } finally {
      setLoadingAction(false)
    }
  }

  const canCreate = user?.role === 'APPLICANT'
  const showApplicantColumn = user?.role !== 'APPLICANT'
  const pageTitle = canCreate ? 'Applicant Dashboard' : 'Workflow Dashboard'
  const pageSubtitle = canCreate
    ? 'Track and submit my applications.'
    : 'Review application queue and take actions.'

  return (
    <main className="min-h-screen p-5">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[220px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-semibold text-amber-950">{user?.names ?? 'Unknown user'}</p>
            <span
              className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getRoleBadgeClass(user?.role)}`}
            >
              {user?.role }
            </span>
            {user?.role === 'ADMIN' ? (
              <Link
                className="mt-2 block w-full rounded-md border border-amber-200 px-3 py-2 text-center text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50"
                to="/admin/audit"
              >
                Audit Logs
              </Link>
            ) : null}
            <Button className="mt-2 w-full" variant="outline" onClick={logout}>
              Log out
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{pageTitle}</CardTitle>
            <CardDescription>{pageSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {canCreate ? (
              <Button className="mb-3 w-full" onClick={() => setShowCreate((v) => !v)}>
                {showCreate ? 'Cancel' : 'Create application'}
              </Button>
            ) : null}

            {showCreate ? (
              <div className="mb-4 grid gap-3 rounded-lg border border-amber-200 p-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="institutionName">Institution name</Label>
                  <Input
                    id="institutionName"
                    value={form.institutionName}
                    onChange={(e) => setField('institutionName', e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="institutionType">Institution type</Label>
                  <select
                    className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950 outline-none focus-visible:border-amber-900 focus-visible:ring-2 focus-visible:ring-amber-300"
                    id="institutionType"
                    value={form.institutionType}
                    onChange={(e) => setField('institutionType', e.target.value)}
                  >
                    {INSTITUTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="contactEmail">Contact email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setField('contactEmail', e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="registrationNumber">Registration number</Label>
                  <Input
                    id="registrationNumber"
                    value={form.registrationNumber}
                    onChange={(e) => setField('registrationNumber', e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="proposedCapitalAmount">Proposed capital (RWF)</Label>
                  <Input
                    id="proposedCapitalAmount"
                    type="number"
                    min={0}
                    value={form.proposedCapitalAmount}
                    onChange={(e) => setField('proposedCapitalAmount', e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="businessAddress">Business address (optional)</Label>
                  <textarea
                    className="min-h-16 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950 outline-none focus-visible:border-amber-900 focus-visible:ring-2 focus-visible:ring-amber-300"
                    id="businessAddress"
                    value={form.businessAddress}
                    onChange={(e) => setField('businessAddress', e.target.value)}
                  />
                </div>
                <Button disabled={loadingAction || !isFormValid} onClick={onCreate}>
                  {loadingAction ? 'Saving...' : 'Save application'}
                </Button>
              </div>
            ) : null}

            {listError ? (
              <Alert className="mb-3" variant="destructive">
                <AlertDescription>{listError}</AlertDescription>
              </Alert>
            ) : null}
            {loadingList ? <p className="text-sm text-amber-900/70">Loading list...</p> : null}

            <div className="overflow-x-auto rounded-lg border border-amber-200">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-amber-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-amber-950">Institution</th>
                    <th className="px-3 py-2 text-left font-semibold text-amber-950">Type</th>
                    <th className="px-3 py-2 text-left font-semibold text-amber-950">Status</th>
                    {showApplicantColumn ? (
                      <th className="px-3 py-2 text-left font-semibold text-amber-950">Applicant</th>
                    ) : null}
                    <th className="px-3 py-2 text-left font-semibold text-amber-950">Reg. Number</th>
                    <th className="px-3 py-2 text-left font-semibold text-amber-950">Submitted</th>
                    <th className="px-3 py-2 text-right font-semibold text-amber-950">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr className="border-t border-amber-100" key={item.id}>
                      <td className="px-3 py-2 font-medium text-amber-950">{item.institutionName}</td>
                      <td className="px-3 py-2 text-amber-900/80">
                        {formatInstitutionType(item.institutionType)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(item.applicationStatus)}`}
                        >
                          {item.applicationStatus.replace('_', ' ')}
                        </span>
                      </td>
                      {showApplicantColumn ? (
                        <td className="px-3 py-2 text-amber-900/80">{item.applicant?.names ?? '—'}</td>
                      ) : null}
                      <td className="px-3 py-2 text-amber-900/70">{item.registrationNumber}</td>
                      <td className="px-3 py-2 text-amber-900/70">{formatDate(item.createdAt)}</td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          onClick={() => navigate(`/applications/${item.id}`)}
                          size="sm"
                          variant="outline"
                        >
                          View details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loadingList && items.length === 0 ? (
              <p className="mt-3 text-sm text-amber-900/70">No applications available.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
