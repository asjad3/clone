import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { updateAdminArea, deleteAdminArea } from "@/lib/supabase/admin-dal";
import {
    adminJson,
    ensureAdmin,
    handleAdminError,
    parseIdParam,
} from "@/lib/api/admin-route";
import { parseAreaPayload } from "@/lib/api/admin-validations";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const { id } = await params;
        const parsedId = parseIdParam(id, "area id");
        const body = await req.json();
        const payload = parseAreaPayload(body, "update");
        const data = await updateAdminArea(parsedId, payload);
        revalidateTag("areas", "max");
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to update area");
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
        const parsedId = parseIdParam(id, "area id");
        await deleteAdminArea(parsedId);
        revalidateTag("areas", "max");
        return adminJson({ success: true });
    } catch (error) {
        return handleAdminError(error, "Failed to delete area");
    }
}
