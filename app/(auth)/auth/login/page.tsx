import LoginForm from '@/components/auth/LoginForm'
import { authPagesMetadata } from '@/data/metadata/auth-pages-meta-data'

export const metadata = authPagesMetadata.login

export default function register() {
  return <LoginForm />
}
