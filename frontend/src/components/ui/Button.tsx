import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
  className?: string
}

const variantClasses: Record<string, string> = {
  primary:
    'bg-gradient-to-r from-entel-orange to-entel-amber text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-entel-orange/25 hover:-translate-y-0.5',
  secondary:
    'border border-white/10 text-white/70 font-medium transition-all duration-200 hover:bg-white/5 hover:border-white/20',
  danger:
    'bg-red-500/10 border border-red-500/20 text-red-400 font-medium transition-all duration-200 hover:bg-red-500/20',
  ghost:
    'text-white/60 font-medium transition-all duration-200 hover:text-white hover:bg-white/5',
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-6 py-2.5 rounded-xl',
  lg: 'px-8 py-3 text-lg rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-sans
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
        ${className}
      `}
      disabled={isDisabled}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
