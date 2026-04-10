import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[17px] font-normal tracking-tight transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3] focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-[#0071e3] text-white hover:bg-[#0077ED] active:bg-[#006edb]',
        destructive:
          'bg-[#ff3b30] text-white hover:bg-[#ff3b30]/90 focus-visible:ring-[#ff3b30]/20',
        outline:
          'border border-[#0066cc] bg-transparent text-[#0066cc] hover:bg-[#0066cc]/5 active:bg-[#0066cc]/10',
        secondary:
          'bg-[#e8e8ed] text-[#1d1d1f] hover:bg-[#dcdce2] active:bg-[#d2d2d7]',
        ghost:
          'hover:bg-black/5 active:bg-black/8 text-[#1d1d1f]',
        link: 'text-[#0066cc] hover:text-[#0066cc]/80 underline-offset-4 hover:underline',
        apple_pill:
          'rounded-full border border-[#0066cc] bg-transparent text-[#0066cc] hover:bg-[#0066cc] hover:text-white',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 rounded-lg gap-1.5 px-4 text-sm',
        lg: 'h-12 rounded-xl px-8 text-lg',
        icon: 'size-11',
        'icon-sm': 'size-9',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
