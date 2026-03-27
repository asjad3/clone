import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { updateAdminCategory, deleteAdminCategory } from "@/lib/supabase/admin-dal";
import {
    adminJson,
    ensureAdmin,
    handleAdminError,
    parseIdParam,
} from "@/lib/api/admin-route";
import {
    assertCategoryNotSelfParent,
    parseCategoryPayload,
} from "@/lib/api/admin-validations";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await ensureAdmin(req);
    if (!authResult.authorized) return authResult.response;

    try {
        const { id } = await params;
        const parsedId = parseIdParam(id, "category id");
        const body = await req.json();
        const payload = parseCategoryPayload(body, "update");
        assertCategoryNotSelfParent(parsedId, payload);
        const data = await updateAdminCategory(parsedId, payload);
        revalidateTag("products", "max");
        return adminJson(data);
    } catch (error) {
        return handleAdminError(error, "Failed to update category");
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
        const parsedId = parseIdParam(id, "category id");
        await deleteAdminCategory(parsedId);
        revalidateTag("products", "max");
        return adminJson({ success: true });
    } catch (error) {
        return handleAdminError(error, "Failed to delete category");
    }
}
