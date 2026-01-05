import NewVerificationForm from '@/components/auth/NewVerificationForm'
import { authPagesMetadata } from '@/data/metadata/auth-pages-meta-data'

export const metadata = authPagesMetadata.verification

export default function newVerification() {
  return <NewVerificationForm />
}
