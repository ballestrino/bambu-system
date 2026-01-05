import ResetForm from "@/components/auth/ResetForm"
import { authPagesMetadata } from "@/data/metadata/auth-pages-meta-data"

export const metadata = authPagesMetadata.reset

export default function page() {
  return <ResetForm />
}
