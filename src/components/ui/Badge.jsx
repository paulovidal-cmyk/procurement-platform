import { cn } from '../../utils/cn.js'

export function Badge({ children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      {children}
    </span>
  )
}
