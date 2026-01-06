import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function HomePage() {
  const session = await auth()

  if (session) {
    return (
      <div className="flex flex-col gap-6 max-w-md mx-auto p-6">
        <p className="text-center">Estas logeado como <span className="font-medium">{session.user?.name}</span></p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto p-6">
      <Button asChild>
        <Link href={"/auth/login"}>Login</Link>
      </Button>
      <Button asChild>
        <Link href={"/auth/register"}>Register</Link>
      </Button>
    </div>
  )
}