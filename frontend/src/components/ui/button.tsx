import * as React from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-gradient-to-b from-amber-900 to-amber-950 text-white hover:brightness-105',
  outline:
    'border border-amber-300 bg-transparent text-amber-950 hover:bg-amber-50',
  ghost: 'bg-transparent text-amber-950 hover:bg-amber-100/60',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
}

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-6',
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-60',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        type={type ?? 'button'}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
