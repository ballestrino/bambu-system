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
        <div className="sticky flex bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 top-0 z-40 w-full items-center py-3 justify-center h-20 px-4 pr-(--removed-body-scroll-bar-size) border-b">
            <div className="flex items-center container justify-between h-full">

                <div className="flex items-center gap-2 h-14">
                    <NavLogo />
                </div>


                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4">
                        <ThemeToggle />
                        {admin && (
                            <div className="flex items-center gap-6">
                                <NavDashboard />
                                <NavTools />
                            </div>
                        )}
                        <NavUser />
                    </div>

                    {/* Mobile Nav */}
                    <div className="md:hidden">
                        <MobileNav admin={admin} user={session?.user} />
                    </div>
                </div>
            </div>
        </div>
    )
}
