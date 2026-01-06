'use client'

import { useSession } from 'next-auth/react'
import { User } from 'next-auth'
import { useState } from 'react'
import { enable2FA } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import CardWrapper from '@/components/CardWrapper'
import ErrorSuccessCard from '@/components/ui/error-success-card'
import TwoFactorPolicy from '@/components/settings/security/2FA-policy'

export default function Enable2FA({
  user,
  setShow2FA,
}: {
  user: User
  setShow2FA: (show: boolean) => void
}) {
  const { update } = useSession()
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleEnable2FA = async () => {
    setSuccess('')
    setError('')

    const res = await enable2FA(user.id as string)

    if (res.error) {
      setError(res.error)
      setSuccess('')
      return
    }

    update()
    setSuccess("Autenticación de dos factores activada exitosamente")

    setTimeout(() => {
      setShow2FA(false)
    }, 2500)
  }

  return (
    <CardWrapper title={"Activar autenticación de dos factores"} subTitle={"Agrega seguridad adicional a tu cuenta"}>
      <TwoFactorPolicy email={user.email as string} />
      <div className='flex h-full w-full flex-col justify-between gap-6'>
        <div className='w-full items-center justify-end'>
          <ErrorSuccessCard success={success} error={error} />
        </div>
        <div className='flex w-full justify-between gap-5'>
          <Button
            variant='outline'
            className='w-full'
            onClick={() => setShow2FA(false)}
          >
            Cancelar
          </Button>

          <Button
            className='w-full'
            onClick={() => {
              handleEnable2FA()
            }}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </CardWrapper>
  )
}
