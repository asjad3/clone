import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/auth/admin-access";

export async function requireAdmin(req: NextRequest) {
    void req;
    const session = await auth();

    if (!session?.user?.email || !isAdminEmail(session.user.email)) {
        return {
            authorized: false as const,
            response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        };
    }

    return {
        authorized: true as const,
        session,
    };
}
