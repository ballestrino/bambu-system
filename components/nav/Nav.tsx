import NavLogo from "./NavLogo";
import NavUser from "./NavUser";

export default function Nav() {
    return (
        <div className="fixed top-0 z-40 w-full flex items-center py-3 justify-center h-20">
            <div className="flex items-center container justify-between h-full">
                <NavLogo />
                <NavUser />
            </div>
        </div>
    )
}
