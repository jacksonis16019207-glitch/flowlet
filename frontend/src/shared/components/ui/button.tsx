import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px]',
  {
    variants: {
      variant: {
        default:
          'border border-[#d6c3ab] bg-[#efe3d5] text-[#684927] hover:bg-[#ead8c4] focus-visible:ring-[#c57d31]/30',
        primary:
          'bg-[linear-gradient(135deg,#9f5123,#d9893a)] text-[#fff8f1] shadow-[0_18px_40px_rgba(159,81,35,0.22)] hover:translate-y-[-1px] hover:shadow-[0_22px_44px_rgba(159,81,35,0.28)] focus-visible:ring-[#c57d31]/35',
        danger:
          'border border-[#e8c2bf] bg-[#f7dfdd] text-[#8c3931] hover:bg-[#f1d1ce] focus-visible:ring-[#c84f45]/25',
        ghost: 'bg-transparent text-[#684927] hover:bg-[#f4ebe2] focus-visible:ring-[#c57d31]/20',
      },
      size: {
        default: 'px-4 py-2.5',
        sm: 'px-3 py-2',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
