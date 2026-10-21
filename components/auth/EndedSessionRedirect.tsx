'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * A session ended by a password change still has its cookie when the proxy
 * reads it, so the private layout lands here. The session fetch clears that
 * cookie and answers unauthenticated; then the login opens.
 */
export default function EndedSessionRedirect() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/login')
  }, [status, router])

  return null
}
