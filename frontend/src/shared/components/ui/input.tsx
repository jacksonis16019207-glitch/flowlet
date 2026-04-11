import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full rounded-2xl border border-[#d8c7b3] bg-[#fffdf9] px-4 text-[15px] text-[#22170d] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-all outline-none placeholder:text-[#9b8d7c] focus:border-[#c57d31] focus:ring-4 focus:ring-[#c57d31]/15 aria-[invalid=true]:border-[#c84f45] aria-[invalid=true]:bg-[#fff7f6] aria-[invalid=true]:focus:ring-[#c84f45]/12 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}
