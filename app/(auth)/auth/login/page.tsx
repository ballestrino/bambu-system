import LoginForm from '@/components/auth/LoginForm'
import { authPagesMetadata } from '@/data/metadata/auth-pages-meta-data'

import { Suspense } from 'react'

export const metadata = authPagesMetadata.login

export default function register() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
