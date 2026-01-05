import RegisterForm from '@/components/auth/RegisterForm'
import { authPagesMetadata } from '@/data/metadata/auth-pages-meta-data'

export const metadata = authPagesMetadata.register

export default function login() {
  return <RegisterForm />
}
