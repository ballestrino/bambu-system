import EndedSessionRedirect from "@/components/auth/EndedSessionRedirect";

export default function NotAuthorizedPage() {
    return (
        <div>
            <EndedSessionRedirect />
            No estas autorizado para acceder a Bambú
        </div>
    )
}
