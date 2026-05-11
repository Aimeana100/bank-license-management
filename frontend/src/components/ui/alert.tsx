import * as React from 'react'
import { cn } from '../../lib/utils'

type AlertVariant = 'default' | 'destructive' | 'success'

const variantClasses: Record<AlertVariant, string> = {
  default: 'border-amber-200 bg-amber-50 text-amber-950',
  destructive: 'border-red-200 bg-red-100 text-red-700',
  success: 'border-green-200 bg-green-100 text-green-800',
}

function Alert({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & { variant?: AlertVariant }) {
  return (
    <div
      className={cn(
        'relative w-full rounded-lg border px-4 py-3 text-sm',
        variantClasses[variant],
        className,
      )}
      role="alert"
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) {
  return <h5 className={cn('mb-1 font-semibold leading-none', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
}

export { Alert, AlertDescription, AlertTitle }
