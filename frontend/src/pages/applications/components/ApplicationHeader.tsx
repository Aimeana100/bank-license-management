import { formatInstitutionType, getStatusBadgeClass } from '../../../utils/application.util'
import type { Application } from '../../../types/application'

interface Props {
  application: Application
}

export function ApplicationHeader({ application }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="text-lg font-semibold text-amber-950">
        {application.institutionName}
      </h2>
      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
        {formatInstitutionType(application.institutionType)}
      </span>
      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusBadgeClass(application.applicationStatus)}`}>
        {application.applicationStatus.replace(/_/g, ' ')}
      </span>
    </div>
  )
}
