import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { updateAdminStore, deleteAdminStore } from "@/lib/supabase/admin-dal";
import {
    adminJson,
    ensureAdmin,
    handleAdminError,
    parseIdParam,
} from "@/lib/api/admin-route";
import { parseStorePayload } from "@/lib/api/admin-validations";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const { id } = await params;
        const parsedId = parseIdParam(id, "store id");
        const body = await req.json();
        const payload = parseStorePayload(body, "update");
        const data = await updateAdminStore(parsedId, payload);
        revalidateTag("stores", "max");
        revalidateTag("areas", "max");
        revalidateTag("products", "max"); // store changes can affect product display
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to update store");
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
        const parsedId = parseIdParam(id, "store id");
        await deleteAdminStore(parsedId);
        revalidateTag("stores", "max");
        revalidateTag("areas", "max");
        revalidateTag("products", "max");
        return adminJson({ success: true });
    } catch (error) {
        return handleAdminError(error, "Failed to delete store");
    }
}
