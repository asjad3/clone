import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { updateAdminBrand, deleteAdminBrand } from "@/lib/supabase/admin-dal";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = await updateAdminBrand(Number(id), body);
        revalidateTag("products", "max");
        return NextResponse.json(data);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await deleteAdminBrand(Number(id));
        revalidateTag("products", "max");
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to delete";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
