import Link from "next/link"
import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"

export default async function page() {
  const session = await auth()


  if (session) {
    return (
      <div>
        <p>Ya estas autenticado</p>
        <form
          action={async () => {
            "use server"
            await signOut()
          }}
        >
          <Button type='submit'>Sign out</Button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <Button asChild>
        <Link href={"/auth/login"}>Login</Link>
      </Button>
    </div>
  )
}
