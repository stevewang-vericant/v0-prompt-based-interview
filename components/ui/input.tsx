import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-[rgba(0,0,0,0.36)] selection:bg-[#0071e3]/20 selection:text-[#1d1d1f] border-[rgba(0,0,0,0.12)] h-11 w-full min-w-0 rounded-xl border bg-white px-4 py-2 text-[17px] tracking-tight transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-[#0071e3] focus-visible:ring-[3px] focus-visible:ring-[#0071e3]/20',
        'aria-invalid:ring-[#ff3b30]/20 aria-invalid:border-[#ff3b30]',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
