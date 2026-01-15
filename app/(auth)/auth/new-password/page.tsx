import NewPasswordForm from '@/components/auth/NewPasswordForm'
import { authPagesMetadata } from '@/data/metadata/auth-pages-meta-data'

import { Suspense } from 'react'

export const metadata = authPagesMetadata.newPassword

export default function NewPassword() {
  return (
    <Suspense>
      <NewPasswordForm />
    </Suspense>
  )
}
