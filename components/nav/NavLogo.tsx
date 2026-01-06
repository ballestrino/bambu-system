import Link from "next/link"
import Image from "next/image"

export default function NavLogo() {
    return (
        <Link href="/" className="h-full gap-2 flex">
            <Image
                src="/images/logo.png"
                alt="Logo"
                width={500}
                height={500}
                className="h-full w-auto"
            />
            <div className="flex flex-col justify-end">
                <p className="font-semibold text-xl">Bambú</p>
                <p className="text-sm">Sistema de gestión</p>
            </div>
        </Link>
    )
}
