import { TriangleAlert } from 'lucide-react'

interface FormErrorProps {
  message?: string | null
  className?: string
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null
  return (
    <div
      className={`bg-destructive/15 text-destructive flex items-center justify-center gap-x-2 rounded-md px-4 py-2 text-sm ${className}`}
    >
      <TriangleAlert className='h-4 w-4' />
      <p>{message}</p>
    </div>
  )
}
