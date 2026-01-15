import ErrorCard from '@/components/auth/ErrorCard'

export default function AuthErrorPage() {
  return (
    <div className='flex w-full h-screen justify-center items-center bg-rose-100 dark:bg-rose-200/60'>
      <ErrorCard />
    </div>
  )
}
