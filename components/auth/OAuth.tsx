'use client'

import { signIn } from 'next-auth/react' // <-- import from here not @/auth
import { FcGoogle } from 'react-icons/fc'
import { Button } from '@/components/ui/button'
import { DEFAULT_LOGIN_REDIRECT } from '@/routes'
// import { DEFAULT_LOGIN_REDIRECT } from '@/routes'

export function OAuth({ register }: { register?: boolean }) {
  const onClick = async (provider: 'google' | 'github') => {
    await signIn(provider, {
      callbackUrl: DEFAULT_LOGIN_REDIRECT,
    })
  }
  return (
    <div className='flex w-full items-center justify-center space-x-2'>
      <Button
        size='lg'
        className='w-full cursor-pointer'
        type="button"
        variant='outline'
        onClick={() => onClick('google')}
      >
        <FcGoogle />
        {register ? 'Registrarse con Google' : 'Iniciar sesión con Google'}
      </Button>
      {/* <Button
        size='lg'
        className='w-1/2'
        variant='outline'
        onClick={() => onClick('github')}
      >
        <FaGithub />
      </Button> */}
    </div>
  )
}
