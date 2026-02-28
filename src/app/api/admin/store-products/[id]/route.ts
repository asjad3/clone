import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminStoreProductRaw, updateAdminStoreProduct, deleteAdminStoreProduct } from "@/lib/supabase/admin-dal";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await fetchAdminStoreProductRaw(Number(id));
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const data = await updateAdminStoreProduct(Number(id), body);
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
        await deleteAdminStoreProduct(Number(id));
        revalidateTag("products", "max");
        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to delete";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
