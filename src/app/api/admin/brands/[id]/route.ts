import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { updateAdminBrand, deleteAdminBrand } from "@/lib/supabase/admin-dal";
import {
    adminJson,
    ensureAdmin,
    handleAdminError,
    parseIdParam,
} from "@/lib/api/admin-route";
import { parseBrandPayload } from "@/lib/api/admin-validations";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const { id } = await params;
        const parsedId = parseIdParam(id, "brand id");
        const body = await req.json();
        const payload = parseBrandPayload(body, "update");
        const data = await updateAdminBrand(parsedId, payload);
        revalidateTag("products", "max");
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to update brand");
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
        const parsedId = parseIdParam(id, "brand id");
        await deleteAdminBrand(parsedId);
        revalidateTag("products", "max");
        return adminJson({ success: true });
    } catch (error) {
        return handleAdminError(error, "Failed to delete brand");
    }
}
