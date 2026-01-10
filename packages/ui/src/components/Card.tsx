import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/**
 * Shared Card component
 * Placeholder - extend with your design system
 */
export function Card({ children, className = '', ...props }: CardProps) {
  const baseStyles = 'bg-white rounded-xl shadow-md p-6'

  return (
    <div className={`${baseStyles} ${className}`} {...props}>
      {children}
    </div>
  )
}
