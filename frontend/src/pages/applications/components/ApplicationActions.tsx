import { Button } from '../../../components/ui/button'
import { ACTION_LABELS } from '../../../utils/application.util'
import type { ApplicationStatus } from '../../../types/application'

interface Props {
  actions: ApplicationStatus[]
  acting: boolean
  onAction: (action: ApplicationStatus) => void
}

export function ApplicationActions({ actions, acting, onAction }: Props) {
  if (actions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          disabled={acting}
          key={action}
          size="sm"
          variant={action === 'REJECTED' ? 'destructive' : 'outline'}
          onClick={() => onAction(action)}
        >
          {acting ? 'Processing…' : (ACTION_LABELS[action] ?? action)}
        </Button>
      ))}
    </div>
  )
}
