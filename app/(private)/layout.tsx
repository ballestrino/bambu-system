import { PropsWithChildren } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function layout({ children }: PropsWithChildren) {
    const session = await auth();

    if (session?.user.role !== 'ADMIN') {
        redirect('/not-authorized');
    }

    return (
        <>
            {children}
        </>
    )
}
