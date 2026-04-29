'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { newVerification } from '@/actions/new-verification'
import CardWrapper from '@/components/CardWrapper'
import { Loader2 } from 'lucide-react'
import { FormSuccess } from '@/components/ui/form-success'
import { FormError } from '@/components/ui/form-error'
import { useRouter } from 'next/navigation'

export default function NewVerificationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, setIsPending] = useState(Boolean(token))

  useEffect(() => {
    if (!token) return

    let cancelled = false

    const verifyToken = async () => {
      const result = await newVerification(token)

      if (cancelled) return

      if (result?.success) {
        setSuccess(result.success)
        setIsPending(false)
        router.push('/auth/login')
        return
      }

      if (result?.error) {
        setError(result.error)
      }
      setIsPending(false)
    }

    void verifyToken()

    return () => {
      cancelled = true
    }
  }, [token, router])

  const errorMessage = token ? error : 'No se encontró el token'

  return (
    <CardWrapper title='Verifica tu token' subTitle='Verificando tu email ...'>
      <div className='flex flex-col items-center justify-center gap-8'>
        {isPending && <Loader2 className='animate-spin' />}
        <FormSuccess message={success} />
        <FormError message={errorMessage} />
      </div>
      <Button asChild>
        <Link href='/auth/register'>Volver a iniciar sesión</Link>
      </Button>
    </CardWrapper>
  )
}
