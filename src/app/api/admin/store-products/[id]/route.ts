import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { fetchAdminStoreProductRaw, updateAdminStoreProduct, deleteAdminStoreProduct } from "@/lib/supabase/admin-dal";
import {
    adminJson,
    ensureAdmin,
    handleAdminError,
    parseIdParam,
} from "@/lib/api/admin-route";
import { parseStoreProductPayload } from "@/lib/api/admin-validations";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const { id } = await params;
        const parsedId = parseIdParam(id, "store product id");
        const data = await fetchAdminStoreProductRaw(parsedId);
        if (!data) return adminJson({ error: "Not found" }, { status: 404 });
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to fetch store product");
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
        const parsedId = parseIdParam(id, "store product id");
        const body = await req.json();
        const payload = parseStoreProductPayload(body, "update");
        const data = await updateAdminStoreProduct(parsedId, payload);
        revalidateTag("products", "max");
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to update store product");
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
        const parsedId = parseIdParam(id, "store product id");
        await deleteAdminStoreProduct(parsedId);
        revalidateTag("products", "max");
        return adminJson({ success: true });
    } catch (error) {
        return handleAdminError(error, "Failed to delete store product");
    }
}
