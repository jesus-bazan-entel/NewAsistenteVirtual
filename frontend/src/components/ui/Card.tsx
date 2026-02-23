import { type ReactNode } from 'react'

interface CardProps {
  title?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export default function Card({ title, icon, children, className = '' }: CardProps) {
  return (
    <div
      className={`
        glass-card p-6
        transition-all duration-300
        hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5
        ${className}
      `}
    >
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-entel-orange/20 to-entel-amber/20 text-entel-orange">
              {icon}
            </div>
          )}
          {title && (
            <h3 className="text-lg font-sans font-semibold text-white">{title}</h3>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
