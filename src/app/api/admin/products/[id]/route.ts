import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminProductById, updateAdminProduct, deleteAdminProduct } from "@/lib/supabase/admin-dal";
import {
    adminJson,
    ensureAdmin,
    handleAdminError,
    parseIdParam,
} from "@/lib/api/admin-route";
import { parseProductPayload } from "@/lib/api/admin-validations";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const { id } = await params;
        const parsedId = parseIdParam(id, "product id");
        const data = await fetchAdminProductById(parsedId);
        if (!data) return adminJson({ error: "Not found" }, { status: 404 });
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to fetch product");
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const { id } = await params;
        const parsedId = parseIdParam(id, "product id");
        const body = await req.json();
        const data = await updateAdminProduct(parsedId, parseProductPayload(body, "update"));
        revalidateTag("products", "max");
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to update product");
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await ensureAdmin(_req);
    if (!authResult.authorized) return authResult.response;

    try {
        const { id } = await params;
        const parsedId = parseIdParam(id, "product id");
        await deleteAdminProduct(parsedId);
        revalidateTag("products", "max");
        return adminJson({ success: true });
    } catch (error) {
        return handleAdminError(error, "Failed to archive product");
    }
}
