import NewPasswordForm from '@/components/auth/NewPasswordForm'
import { authPagesMetadata } from '@/data/metadata/auth-pages-meta-data'

export const metadata = authPagesMetadata.newPassword

export default function NewPassword() {
  return <NewPasswordForm />
}
