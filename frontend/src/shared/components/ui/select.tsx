import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-12 w-full appearance-none rounded-2xl border border-[#d8c7b3] bg-[#fffdf9] px-4 pr-11 text-[15px] text-[#22170d] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-all outline-none focus:border-[#c57d31] focus:ring-4 focus:ring-[#c57d31]/15 aria-[invalid=true]:border-[#c84f45] aria-[invalid=true]:bg-[#fff7f6] aria-[invalid=true]:focus:ring-[#c84f45]/12 disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8d755d]"
      />
    </div>
  )
}
