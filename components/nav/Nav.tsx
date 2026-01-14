import NavDashboard from "./NavDashboard";
import NavLogo from "./NavLogo";
import NavUser from "./NavUser";

export default function Nav() {
    return (
        <div className="fixed hidden bg-white top-0 z-40 w-full md:flex items-center py-3 justify-center h-20">
            <div className="flex items-center container justify-between h-full">
                <NavLogo />
                <div className="flex items-center gap-6">
                    <NavDashboard />
                    <NavUser />
                </div>
            </div>
        </div>
    )
}
