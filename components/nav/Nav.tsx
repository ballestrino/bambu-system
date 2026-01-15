import NavDashboard from "./NavDashboard";
import NavTools from "./NavTools";
import NavLogo from "./NavLogo";
import NavUser from "./NavUser";
import { auth } from "@/auth";

export default async function Nav() {
    const session = await auth();

    const admin = session?.user.role === 'ADMIN'

    return (
        <div className="sticky hidden bg-white top-0 z-40 w-full md:flex items-center py-3 justify-center h-20 pr-(--removed-body-scroll-bar-size)">
            <div className="flex items-center container justify-between h-full">
                <NavLogo />
                <div className="flex items-center gap-6">
                    {admin && <NavDashboard />}
                    {admin && <NavTools />}
                    <NavUser />
                </div>
            </div>
        </div>
    )
}
