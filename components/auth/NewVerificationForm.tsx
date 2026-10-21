'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { newVerification } from '@/actions/new-verification'
import CardWrapper from '@/components/CardWrapper'
import VerificationPasswordForm from '@/components/auth/VerificationPasswordForm'
import { Loader2 } from 'lucide-react'
import { FormSuccess } from '@/components/ui/form-success'
import { FormError } from '@/components/ui/form-error'
import { useRouter } from 'next/navigation'

type VerificationResult = Awaited<ReturnType<typeof newVerification>>

export default function NewVerificationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [isPending, setIsPending] = useState(Boolean(token))

  const handleResult = useCallback((result: VerificationResult) => {
    setIsPending(false)

    if ('needsPassword' in result) {
      setNeedsPassword(true)
      return
    }

    if ('success' in result && result.success) {
      setNeedsPassword(false)
      setError('')
      setSuccess(result.success)
      // An email change comes from Configuración; without a session the
      // proxy sends /settings on to the login.
      router.push('emailChanged' in result ? '/settings' : '/auth/login')
      return
    }

    if ('error' in result && result.error) setError(result.error)
  }, [router])

  useEffect(() => {
    if (!token) return

    let cancelled = false

    const verifyToken = async () => {
      const result = await newVerification(token)

      if (cancelled) return
      handleResult(result)
    }

    void verifyToken()

    return () => {
      cancelled = true
    }
  }, [token, handleResult])

  const submitPassword = async (password: string) => {
    if (!token) return

    setError('')
    setIsPending(true)
    handleResult(await newVerification(token, password))
  }

  const errorMessage = token ? error : 'No se encontró el token'

  return (
    <CardWrapper
      title={needsPassword ? 'Activá tu cuenta' : 'Verifica tu token'}
      subTitle={
        needsPassword
          ? 'Elegí la contraseña para entrar a Bambú'
          : 'Verificando tu email ...'
      }
    >
      <div className='flex w-full flex-col items-center justify-center gap-8'>
        {needsPassword && (
          <VerificationPasswordForm
            isPending={isPending}
            onSubmit={password => void submitPassword(password)}
          />
        )}
        {isPending && !needsPassword && <Loader2 className='animate-spin' />}
        <FormSuccess message={success} />
        <FormError message={errorMessage} />
      </div>
      <Button asChild>
        <Link href='/auth/login'>Volver a iniciar sesión</Link>
      </Button>
    </CardWrapper>
  )
}
