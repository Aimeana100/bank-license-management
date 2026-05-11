import { formatCurrency, formatDate } from '../../../utils/application.util'
import type { Application } from '../../../types/application'

interface Props {
  application: Application
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-amber-900/60">{label}</dt>
      <dd className="font-medium text-amber-950">{value}</dd>
    </div>
  )
}

export function ApplicationMeta({ application }: Props) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
      <Field label="Registration No." value={application.registrationNumber} />
      <Field label="Contact Email" value={application.contactEmail} />
      <Field label="Proposed Capital" value={formatCurrency(application.proposedCapitalAmount)} />

      {application.businessAddress && (
        <div className="col-span-2 sm:col-span-3">
          <dt className="text-xs text-amber-900/60">Business Address</dt>
          <dd className="font-medium text-amber-950">{application.businessAddress}</dd>
        </div>
      )}

      <Field label="Applicant" value={application.applicant?.names ?? '—'} />
      {application.reviewer && <Field label="Reviewer" value={application.reviewer.names} />}
      {application.approver && <Field label="Approver" value={application.approver.names} />}

      <Field label="Submitted" value={formatDate(application.createdAt)} />
      <Field label="Last Updated" value={formatDate(application.updatedAt)} />
    </dl>
  )
}
