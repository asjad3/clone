import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminOrderById, updateAdminOrderStatus } from "@/lib/supabase/admin-dal";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await fetchAdminOrderById(id);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = await updateAdminOrderStatus(id, body.status);
        revalidateTag("orders", "max");
        return NextResponse.json(data);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update status";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
