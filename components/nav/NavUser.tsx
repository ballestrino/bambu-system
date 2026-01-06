"use client"

import { useSession } from "next-auth/react"
import { Button } from "../ui/button"
import { Settings } from "lucide-react"
import Link from "next/link"

export default function NavUser() {
    const { data: session } = useSession()
    return (
        <div className="flex gap-2 items-center">
            <p>{session?.user?.name}</p>
            <Button asChild className="cursor-pointer" variant='ghost' size='icon'>
                <Link href="/settings">
                    <Settings />
                </Link>
            </Button>
        </div>
    )
}
