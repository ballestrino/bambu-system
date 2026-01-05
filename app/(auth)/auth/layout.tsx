export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-[92vh] w-full flex-col items-center justify-center gap-10 dark:bg-slate-950 dark:bg-none'>
      {children}
    </div>
  )
}
