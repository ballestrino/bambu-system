'use client'

import { ExtendedUser } from '@/next-auth'
import { Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Enable2faDialog from '@/components/settings/security/enable-2fa-dialog'
import ChangePasswordDialog from '@/components/settings/security/change-password-dialog'


export default function SecurityPage() {
  const { data: session, update } = useSession()
  const user = session?.user as ExtendedUser

  if (!user) return null

  return (
    <div className='flex flex-col gap-6'>
      <h2 className='text-lg font-semibold md:text-xl'>Seguridad</h2>

      <div className='flex flex-col gap-2'>
        <h3 className='font-medium'>Autenticación de dos factores (2FA)</h3>
        <div className='flex items-center gap-2'>
          {user.isTwoFactorEnabled ? (
            <div className='flex items-center gap-2'>
              <Check className='h-6 w-6 rounded-full bg-green-500 p-0.5 text-white' />
              <span className='text-sm text-muted-foreground'>Activado</span>
            </div>
          ) : (
            <Enable2faDialog
              user={user}
              onSuccess={() => {
                update()
              }}
            />
          )}
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <h3 className='font-medium'>Gestión de contraseña</h3>
        <p className='text-sm text-muted-foreground'>
          Cambia tu contraseña actual o solicita un restablecimiento por email
        </p>
        <div className='flex flex-wrap items-center gap-2'>
          <ChangePasswordDialog user={user} />
        </div>
      </div>
    </div>
  )
}
