import MobileNav from "./MobileNav";
import NavDashboard from "./NavDashboard";
import NavTools from "./NavTools";
import NavLogo from "./NavLogo";
import NavUser from "./NavUser";
import { auth } from "@/auth";

import { ThemeToggle } from "../ui/theme-toggle";

export default async function Nav() {
    const session = await auth();

    const admin = session?.user.role === 'ADMIN'

    return (
        <div className="sticky flex bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 top-0 z-40 w-full items-center py-3 justify-center h-20 pr-(--removed-body-scroll-bar-size) border-b">
            <div className="flex items-center container justify-between h-full">

                {/* Mobile Nav */}
                <div className="md:hidden">
                    <MobileNav admin={admin} />
                </div>

                {/* Desktop Logo - shown on both but handled by layout */}
                <div className="md:flex hidden h-14">
                    <NavLogo />
                </div>
                {/* Mobile Logo centered or right if needed, but let's stick to left for now or keeping structure */}
                <div className="md:hidden flex h-full">
                    <NavLogo />
                </div>


                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <div className="hidden md:flex items-center gap-6">
                        {admin && <NavDashboard />}
                        {admin && <NavTools />}
                    </div>
                    <NavUser />
                </div>
            </div>
        </div>
    )
}
