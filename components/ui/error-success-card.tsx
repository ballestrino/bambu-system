export default function ErrorSuccessCard({
  error,
  success,
}: {
  error?: string | undefined
  success?: string | undefined
}) {
  return (
    <>
      {error ? (
        <div className='w-full rounded-lg bg-red-200 p-3 text-center font-bold text-red-600'>
          {error}
        </div>
      ) : null}
      {success && (
        <div className='w-full rounded-lg bg-green-200 p-3 text-center font-bold text-green-600'>
          {success}
        </div>
      )}
    </>
  )
}
