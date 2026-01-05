'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { newVerification } from '@/actions/new-verification'
import CardWrapper from '@/components/CardWrapper'
import { Loader2 } from 'lucide-react'
import { FormSuccess } from '@/components/ui/form-success'
import { FormError } from '@/components/ui/form-error'
import { useRouter } from 'next/navigation'

export default function NewVerificationForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, setIsPending] = useState(false)

  const searchParams = useSearchParams()

  const token = searchParams.get('token')

  const verifyToken = useCallback(async () => {
    setError('')
    setSuccess('')

    if (!token) {
      setError('No se encontró el token')
      return
    }

    setIsPending(true)
    const result = await newVerification(token)
    if (result?.success) {
      setSuccess(result.success)
      setIsPending(false)
      router.push('/auth/login')
    }
    if (result?.error) setError(result.error)
    setIsPending(false)
  }, [token, router])

  useEffect(() => {
    verifyToken()
  }, [verifyToken])
  return (
    <CardWrapper title='Verifica tu token' subTitle='Verificando tu email ...'>
      <div className='flex flex-col items-center justify-center gap-8'>
        {isPending && <Loader2 className='animate-spin' />}
        <FormSuccess message={success} />
        <FormError message={error} />
      </div>
      <Button asChild>
        <Link href='/auth/register'>Volver a iniciar sesión</Link>
      </Button>
    </CardWrapper>
  )
}
