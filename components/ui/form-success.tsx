import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormSuccessProps {
  message?: string | null
  className?: string
}

export function FormSuccess({ message, className }: FormSuccessProps) {
  if (!message) return null
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-x-2 rounded-md bg-emerald-500/15 px-4 py-2 text-sm text-emerald-500',
        className,
      )}
    >
      <CheckCircle className='h-4 w-4' />
      <p>{message}</p>
    </div>
  )
}
